// Image Optimization Utilities

/**
 * Function to optimize image sizes for web.
 * @param {File} file - The image file to optimize.
 * @returns {Promise<File>} - The optimized image file.
 */
async function optimizeImage(file) {
    // Logic for image optimization will be implemented here
}

/**
 * Function to convert image to base64 format.
 * @param {File} file - The image file to convert.
 * @returns {Promise<String>} - The base64 encoded string of the image.
 */
async function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export { optimizeImage, toBase64 };