import test from 'node:test'
import assert from 'node:assert/strict'
import { handleGenerateRequest } from '../server/api.js'

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
