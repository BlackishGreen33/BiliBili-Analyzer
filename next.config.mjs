/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: "export",  // 仅在 `pnpm build:mobile` 时由 scripts/build-mobile.mjs 临时启用
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i0.hdslb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'i0.hdslb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's1.hdslb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i1.hdslb.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
