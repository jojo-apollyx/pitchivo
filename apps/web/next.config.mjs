/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure server-side only native modules are not included in client bundle
  // This tells Next.js to treat these packages as external and not bundle them
  serverExternalPackages: ['@napi-rs/canvas'],
};

export default nextConfig;

