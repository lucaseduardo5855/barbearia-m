/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
      },
      {
        hostname: "images.unsplash.com",
      },
      {
        hostname: "lh3.googleusercontent.com",
      },
      {
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        hostname: "ufs.sh",
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/.prisma/client/**/*'],
      '/*': ['./node_modules/.prisma/client/**/*'],
    },
  },
}

export default nextConfig;
