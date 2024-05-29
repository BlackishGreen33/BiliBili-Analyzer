import MillionLint from '@million/lint';
import million from 'million/compiler';
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  swcMinify: true,
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.github.com',
        port: '',
        pathname: '/**',
      },
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
    ],
  },
};

export default million.next(
  MillionLint.next({
    rsc: true,
  })(nextConfig),
  {
    auto: true,
  }
);
