/**
 * High-level notification helpers (local notifications via Capacitor).
 * All native imports are dynamic + wrapped so the app never crashes on web
 * or on a native build that lacks the plugin / FCM configuration.
 */

const PERM_KEY = 'mijedu_local_notif_perm';
const TRENDING_TS_KEY = 'mijedu_trending_last_ts';
const TRENDING_WATERMARK_KEY = 'mijedu_trending_watermark';

let permissionRequested = false;
let permissionGranted = false;

async function getNative() {
  try {
    const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null as any }));
    if (!Capacitor || !Capacitor.isNativePlatform?.()) return null;
    const mod = await import('@capacitor/local-notifications').catch((e) => {
      console.warn('[notify] local-notifications unavailable:', e);
      return null;
    });
    return mod ? mod.LocalNotifications : null;
  } catch (e) {
    console.warn('[notify] init failed:', e);
    return null;
  }
}

async function ensurePermission(LN: any): Promise<boolean> {
  if (permissionGranted) return true;
  try {
    const cached = localStorage.getItem(PERM_KEY);
    if (cached === 'granted') {
      permissionGranted = true;
      return true;
    }
    if (cached === 'denied') return false;
    if (permissionRequested) return false;
    permissionRequested = true;
    const res = await LN.requestPermissions();
    const granted = res?.display === 'granted';
    localStorage.setItem(PERM_KEY, granted ? 'granted' : 'denied');
    permissionGranted = granted;
    return granted;
  } catch (e) {
    console.warn('[notify] permission error:', e);
    return false;
  }
}

interface ScheduleOpts {
  id: number;
  title: string;
  body: string;
  at?: Date;
  route?: string;
  group?: string;
}

async function schedule(opts: ScheduleOpts) {
  const LN = await getNative();
  if (!LN) return;
  if (!(await ensurePermission(LN))) return;
  try {
    await LN.schedule({
      notifications: [
        {
          id: opts.id,
          title: opts.title,
          body: opts.body,
          schedule: opts.at ? { at: opts.at } : undefined,
          extra: opts.route ? { route: opts.route } : undefined,
          smallIcon: 'ic_stat_icon',
          iconColor: '#A855F7',
          group: opts.group,
        },
      ],
    });
  } catch (e) {
    console.warn('[notify] schedule failed:', e);
  }
}

async function cancel(id: number) {
  const LN = await getNative();
  if (!LN) return;
  try {
    await LN.cancel({ notifications: [{ id }] });
  } catch (e) {
    console.warn('[notify] cancel failed:', e);
  }
}

// Stable IDs (avoid collisions across features)
const ID = {
  postPublished: () => 100000 + Math.floor(Math.random() * 9999),
  trending: () => 200000 + Math.floor(Math.random() * 9999),
  newRoom: () => 300000 + Math.floor(Math.random() * 9999),
  roomExpiring: (roomId: string) => 400000 + (hash(roomId) % 9999),
  newComment: () => 500000 + Math.floor(Math.random() * 9999),
  newFollower: () => 600000 + Math.floor(Math.random() * 9999),
  verified: () => 700001,
  retention: 999001,
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const notify = {
  postPublished() {
    return schedule({
      id: ID.postPublished(),
      title: 'Post published 🎉',
      body: 'Your post is live on Mijedu — see how your tribe reacts.',
      route: '/feed',
    });
  },

  trending(title: string, postId?: string) {
    // Throttle to once per hour
    const now = Date.now();
    const last = Number(localStorage.getItem(TRENDING_TS_KEY) || '0');
    if (now - last < 60 * 60 * 1000) return Promise.resolve();
    localStorage.setItem(TRENDING_TS_KEY, String(now));
    return schedule({
      id: ID.trending(),
      title: '🔥 Trending in your tribe',
      body: title.length > 80 ? title.slice(0, 77) + '…' : title,
      route: postId ? `/feed` : '/feed',
    });
  },

  newRoom(title: string, roomId: string) {
    return schedule({
      id: ID.newRoom(),
      title: 'New room just opened',
      body: title,
      route: `/room/${roomId}`,
    });
  },

  roomExpiring(title: string, roomId: string, expiresAt: Date) {
    // Schedule at expiresAt - 30min, only if still in future
    const fireAt = new Date(expiresAt.getTime() - 30 * 60 * 1000);
    if (fireAt.getTime() <= Date.now()) return Promise.resolve();
    return schedule({
      id: ID.roomExpiring(roomId),
      title: '⏳ Room closing soon',
      body: `"${title}" expires in 30 minutes — jump back in.`,
      at: fireAt,
      route: `/room/${roomId}`,
    });
  },

  newComment(actorName: string) {
    return schedule({
      id: ID.newComment(),
      title: 'New reply on your post',
      body: `${actorName} commented on your post.`,
      route: '/feed',
    });
  },

  newFollower(actorName: string) {
    return schedule({
      id: ID.newFollower(),
      title: 'You have a new follower',
      body: `${actorName} started following you.`,
      route: '/feed',
    });
  },

  verified() {
    return schedule({
      id: ID.verified(),
      title: 'You\'re verified ✅',
      body: 'Welcome to Mijedu — your tribe is waiting.',
      route: '/feed',
    });
  },

  async scheduleRetention() {
    const at = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await cancel(ID.retention);
    return schedule({
      id: ID.retention,
      title: 'We miss you 👋',
      body: 'Your tribe has new posts waiting for you on Mijedu.',
      at,
      route: '/feed',
    });
  },

  cancelRetention() {
    return cancel(ID.retention);
  },
};

export const trendingWatermark = {
  get(): number {
    return Number(localStorage.getItem(TRENDING_WATERMARK_KEY) || '0');
  },
  set(v: number) {
    localStorage.setItem(TRENDING_WATERMARK_KEY, String(v));
  },
};
