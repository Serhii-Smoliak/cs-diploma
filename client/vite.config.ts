import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function resolveApiOrigin(env: Record<string, string>): string {
  const origin = env.VITE_API_ORIGIN?.replace(/\/$/, '')
  if (origin) return origin

  const apiUrl = env.VITE_API_URL?.replace(/\/$/, '')
  if (apiUrl) return apiUrl.replace(/\/api\/?$/, '')

  return ''
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = resolveApiOrigin(env)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      ...(apiOrigin && {
        proxy: {
          '/api': {
            target: apiOrigin,
            changeOrigin: true,
          },
          '/uploads': {
            target: apiOrigin,
            changeOrigin: true,
          },
        },
      }),
    },
  }
})
