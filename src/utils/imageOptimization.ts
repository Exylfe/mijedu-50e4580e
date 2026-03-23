// Image Optimization Utilities for Mobile

/**
 * Compresses an image file to reduce file size
 * @param {File} file - The original image file
 * @param {number} quality - The quality of the compressed image (0 to 1)
 * @returns {Promise<File>} - A promise that resolves to the compressed image file
 */
async function compressImage(file, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: file.type }));
                    } else {
                        reject(new Error('Blob creation failed'));
                    }
                }, file.type, quality);
            };
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Creates a blob URL from a file
 * @param {File} file - The image file to create a blob URL from
 * @returns {string} - The blob URL
 */
function createBlobURL(file) {
    return URL.createObjectURL(file);
}

export { compressImage, createBlobURL };