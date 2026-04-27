/**
 * Cross-platform avatar picker.
 *
 * On native (Capacitor / Android / iOS) it uses @capacitor/camera with
 * `CameraSource.Prompt`, which shows the native action-sheet:
 *   "Take Photo  /  Choose from Gallery  /  Cancel"
 *
 * On web (PWA / browser) it falls back to a hidden <input type="file"> with
 * `accept="image/*"` and **no** `capture` attribute, so mobile browsers show
 * their full chooser (gallery + camera).
 *
 * The function is fully wrapped in try/catch and logs failures via
 * errorLogger so a misbehaving native plugin can never crash the app.
 */

import { logError } from '@/utils/errorLogger';

export type PickedImage = {
  file: File;
  /** A blob: URL you can use directly for a preview. Caller must revoke it. */
  previewUrl: string;
};

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const [meta, b64] = dataUrl.split(',');
  const mimeMatch = /data:([^;]+);base64/.exec(meta);
  const mime = mimeMatch?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
};

const pickFromBrowser = (): Promise<PickedImage | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = DEFAULT_ACCEPT;
    // Intentionally no `capture` attribute → browser shows gallery + camera.
    input.style.display = 'none';

    let settled = false;
    const cleanup = () => {
      try {
        document.body.removeChild(input);
      } catch {}
    };

    input.onchange = () => {
      settled = true;
      const file = input.files?.[0] || null;
      cleanup();
      if (!file) return resolve(null);
      const previewUrl = URL.createObjectURL(file);
      resolve({ file, previewUrl });
    };

    // If the user dismisses the picker, browsers don't fire `change`.
    // We resolve `null` once the window regains focus and no file was picked.
    const onFocus = () => {
      setTimeout(() => {
        if (!settled) {
          cleanup();
          resolve(null);
        }
        window.removeEventListener('focus', onFocus);
      }, 500);
    };
    window.addEventListener('focus', onFocus);

    document.body.appendChild(input);
    input.click();
  });

export const pickAvatar = async (): Promise<PickedImage | null> => {
  try {
    const { Capacitor } = await import('@capacitor/core').catch(() => ({
      Capacitor: null as any,
    }));

    if (Capacitor?.isNativePlatform?.()) {
      try {
        const cam = await import('@capacitor/camera');
        const photo = await cam.Camera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: cam.CameraResultType.DataUrl,
          source: cam.CameraSource.Prompt, // → "Camera / Photo Library / Cancel"
          promptLabelHeader: 'Profile picture',
          promptLabelPhoto: 'Choose from Gallery',
          promptLabelPicture: 'Take Photo',
          width: 1024,
          height: 1024,
          correctOrientation: true,
        });

        if (!photo?.dataUrl) return null;
        const ext = (photo.format || 'jpg').toLowerCase();
        const file = dataUrlToFile(photo.dataUrl, `avatar.${ext}`);
        return { file, previewUrl: URL.createObjectURL(file) };
      } catch (nativeErr: any) {
        // User cancelling raises an error in @capacitor/camera — silence it.
        const msg = String(nativeErr?.message || nativeErr || '').toLowerCase();
        if (msg.includes('cancel') || msg.includes('denied')) return null;

        errorLogger?.('avatar_picker_native_failed', nativeErr);
        // Fall through to web picker as a last-resort fallback.
        return await pickFromBrowser();
      }
    }

    return await pickFromBrowser();
  } catch (err) {
    errorLogger?.('avatar_picker_failed', err);
    return null;
  }
};
