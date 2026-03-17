/** @type {import('next').NextConfig} */
const apiProxyTarget = (process.env.API_PROXY_TARGET || 'http://localhost:3001').replace(/\/$/, '');
const llmApiProxyTarget = (process.env.LLM_API_PROXY_TARGET || 'http://localhost:8000').replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/chat',
        destination: `${llmApiProxyTarget}/api/chat`
      },
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
