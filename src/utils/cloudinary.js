/**
 * Transforms Cloudinary image URLs dynamically to inject format auto-selection (WebP/AVIF),
 * automatic compression quality, dynamic width resizing, and 4:3 aspect ratio cropping.
 *
 * @param {string} url - Original image URL
 * @param {number} [width=600] - Desired image width in pixels
 * @param {string} [quality="auto"] - Dynamic quality compression ("auto", "auto:good", "auto:eco")
 * @returns {string} Optimized Cloudinary CDN URL
 */
export function getOptimizedCloudinaryUrl(url, width = 600, quality = "auto") {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) {
    return url;
  }
  return url.replace(
    "/upload/",
    `/upload/f_auto,q_${quality},w_${width},c_fill,ar_4:3/`
  );
}

/**
 * Transforms Cloudinary avatar URLs dynamically for committee portraits.
 * Enforces 400x400 face-centered crop, 1:1 aspect ratio, auto-format, and auto-quality.
 *
 * @param {string} url - Original avatar image URL
 * @returns {string} Optimized 400x400 Cloudinary Avatar URL
 */
export function getCommitteeAvatarUrl(url) {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) {
    return url;
  }
  return url.replace(
    "/upload/",
    "/upload/f_auto,q_auto,w_400,c_fill,g_face,ar_1:1/"
  );
}
