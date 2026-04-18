import { defineConfig, loadEnv } from 'vite'

const readBody = async (req: NodeJS.ReadableStream): Promise<string> =>
  await new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })

const sendJson = (res: any, result: { status: number; headers: Record<string, string>; body: string }) => {
  res.statusCode = result.status
  Object.entries(result.headers).forEach(([key, value]) => {
    res.setHeader(key, value)
  })
  res.end(result.body)
}

const apiDevMiddleware = () => ({
  name: 'local-api-middleware',
  apply: 'serve',
  configureServer(server: any) {
    server.middlewares.use('/api/generate', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') {
        next()
        return
      }

      const { handleGenerateRequest } = await import('./server/api.js')
      const body = await readBody(req)
      const result = await handleGenerateRequest({ body })
      sendJson(res, result)
    })
  }
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [apiDevMiddleware()],
    build: {
      emptyOutDir: true,
      reportCompressedSize: false
    }
  }
})
