import test from 'node:test'
import assert from 'node:assert/strict'
import { handleGenerateRequest, handleVersionRequest } from '../server/api.js'

const originalEnv = { ...process.env }
const originalFetch = global.fetch

const resetEnv = () => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key]
  }
  Object.assign(process.env, originalEnv)
}

test.afterEach(() => {
  resetEnv()
  global.fetch = originalFetch
})

test('handleGenerateRequest rejects missing prompt', async () => {
  process.env.GROQ_API_KEY = 'secret'
  const result = await handleGenerateRequest({ body: '{}' })

  assert.equal(result.status, 400)
  assert.equal(JSON.parse(result.body).error, 'Prompt is required.')
})

test('handleGenerateRequest returns generated message on success', async () => {
  process.env.GROQ_API_KEY = 'secret'
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: 'Generated release note' } }]
    })
  })

  const result = await handleGenerateRequest({
    body: JSON.stringify({ prompt: 'Write the release note' })
  })

  assert.equal(result.status, 200)
  assert.equal(JSON.parse(result.body).message, 'Generated release note')
})

test('handleVersionRequest falls back to manual entry when no config exists', async () => {
  delete process.env.GITHUB_REPOS
  const result = await handleVersionRequest({ url: 'http://localhost/api/version?field=osBE' })

  assert.equal(result.status, 503)
  assert.equal(JSON.parse(result.body).fallbackToManual, true)
})

test('handleVersionRequest returns package version from configured repo lookup', async () => {
  process.env.GITHUB_REPOS = JSON.stringify([
    { owner: 'demo', repo: 'demo', field: 'osBE', path: 'package.json' }
  ])
  process.env.GITHUB_TOKEN = 'token'
  global.fetch = async () => ({
    status: 200,
    ok: true,
    text: async () => JSON.stringify({ version: '1.2.3' })
  })

  const result = await handleVersionRequest({ url: 'http://localhost/api/version?field=osBE' })

  assert.equal(result.status, 200)
  assert.deepEqual(JSON.parse(result.body), {
    field: 'osBE',
    version: '1.2.3',
    branch: 'main'
  })
})

test('handleVersionRequest rejects unknown fields', async () => {
  process.env.GITHUB_REPOS = JSON.stringify([
    { owner: 'demo', repo: 'demo', field: 'osBE', path: 'package.json' }
  ])

  const result = await handleVersionRequest({ url: 'http://localhost/api/version?field=unknown' })
  assert.equal(result.status, 400)
  assert.equal(JSON.parse(result.body).error, 'Unknown version field.')
})
