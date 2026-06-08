/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Serve the static Marketing OS (public/index.html) at the root.
    // The budget tool lives at /budget and the API at /api.
    return [{ source: "/", destination: "/index.html" }];
  },
};

export default nextConfig;
