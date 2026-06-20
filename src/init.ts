// Sanitize and normalize potential placeholder/invalid environment variables before any other imports execute
if (process.env.CLOUDINARY_URL) {
  const cUrl = process.env.CLOUDINARY_URL.trim();
  if (!cUrl.startsWith("cloudinary://") || cUrl === "cloudinary://..." || cUrl === "") {
    console.warn(`[INITIALIZATION WARNING] Invalid or placeholder CLOUDINARY_URL detected ("${cUrl}"). Stripping environment variable to prevent Cloudinary SDK initialization crash.`);
    delete process.env.CLOUDINARY_URL;
  }
}
