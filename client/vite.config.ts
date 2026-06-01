import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

function resolveApiOrigin(env: Record<string, string>): string {
  const origin = env.VITE_API_ORIGIN?.replace(/\/$/, '')
  if (origin) return origin

  const apiUrl = env.VITE_API_URL?.replace(/\/$/, '')
  if (apiUrl) return apiUrl.replace(/\/api\/?$/, '')

  return ''
}

const DEV_API_ORIGIN = 'http://localhost:3001'

function proxyApiConfig(target: string) {
  return {
    target,
    changeOrigin: true,
    configure: (proxy: { on: (event: string, handler: (...args: unknown[]) => void) => void }) => {
      proxy.on('error', (_err: unknown, _req: IncomingMessage, res: ServerResponse) => {
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Service unavailable' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = resolveApiOrigin(env) || (mode === 'development' ? DEV_API_ORIGIN : '')

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
          '/api': proxyApiConfig(apiOrigin),
          '/uploads': proxyApiConfig(apiOrigin),
        },
      }),
    },
  }
})
