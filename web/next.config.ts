/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin images from external domains if needed in future
  images: {
    remotePatterns: [],
  },
  // Expose the FastAPI base URL to server-side code only
  env: {
    AEROPURE_API_URL: process.env.AEROPURE_API_URL ?? "",
  },
};

export default nextConfig;
