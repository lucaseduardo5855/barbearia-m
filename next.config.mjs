/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
      },
    ],
  },
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/.prisma/client/**/*'],
    '/*': ['./node_modules/.prisma/client/**/*'],
  },
}

export default nextConfig;
