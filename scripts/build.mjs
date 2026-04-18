import { build } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const assetsDir = path.join(distDir, 'assets')
const publicDir = path.join(rootDir, 'public')
const indexTemplatePath = path.join(rootDir, 'index.html')

await rm(distDir, { recursive: true, force: true })
await mkdir(assetsDir, { recursive: true })

await build({
  entryPoints: [path.join(rootDir, 'src/main.tsx')],
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  minify: true,
  sourcemap: false,
  target: ['es2020'],
  outfile: path.join(assetsDir, 'app.js'),
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx'
  }
})

try {
  await cp(publicDir, distDir, { recursive: true })
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error
  }
}

const indexTemplate = await readFile(indexTemplatePath, 'utf8')
const builtHtml = indexTemplate
  .replace('</head>', '    <link rel="stylesheet" href="/assets/app.css" />\n  </head>')
  .replace('/src/main.tsx', '/assets/app.js')

await writeFile(path.join(distDir, 'index.html'), builtHtml)

process.exit(0)
