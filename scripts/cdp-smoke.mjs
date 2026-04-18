const wsUrl = process.argv[2]

if (!wsUrl) {
  console.error('Usage: node scripts/cdp-smoke.mjs <webSocketDebuggerUrl>')
  process.exit(1)
}

const socket = new WebSocket(wsUrl)
let id = 0
const pending = new Map()

socket.addEventListener('error', (event) => {
  console.error('WebSocket error', event.message || '')
})

socket.addEventListener('close', () => {
  process.exit(0)
})

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const messageId = ++id
    pending.set(messageId, { resolve, reject })
    socket.send(JSON.stringify({ id: messageId, method, params }))
  })

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (!message.id) {
    return
  }

  const entry = pending.get(message.id)
  if (!entry) {
    return
  }

  pending.delete(message.id)

  if (message.error) {
    entry.reject(new Error(message.error.message))
    return
  }

  entry.resolve(message.result)
})

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  })

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Evaluation failed')
  }

  return result.result?.value
}

const waitFor = async (predicateExpression, timeoutMs = 15000) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const value = await evaluate(predicateExpression)
    if (value) {
      return value
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`Timed out waiting for predicate: ${predicateExpression}`)
}

const escapeForTemplate = (value) => value.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${')

socket.addEventListener('open', async () => {
  try {
    console.error('CDP socket open')
    await send('Page.enable')
    await send('Runtime.enable')

    await waitFor('document.readyState === "complete"')

    const title = await evaluate('document.title')
    const heading = await evaluate('document.querySelector("h1")?.textContent?.trim()')

    await evaluate(`
      (() => {
        document.querySelector('button[aria-label="Dismiss notification"]')?.click()
        return true
      })()
    `)

    const todayButtonText = await evaluate(`
      (() => Array.from(document.querySelectorAll('button')).find((button) => button.textContent.includes('Today'))?.textContent?.trim())()
    `)

    await evaluate(`
      (() => {
        const setValue = (selector, value) => {
          const element = document.querySelector(selector)
          element.value = value
          element.dispatchEvent(new Event('input', { bubbles: true }))
          element.dispatchEvent(new Event('change', { bubbles: true }))
        }

        setValue('input[name="releaseDate"]', '2026-04-18')
        setValue('input[name="releaseTime"]', '13:45')
        setValue('textarea[name="ticketDetails"]', \`${escapeForTemplate('FM-210: Added a faster release export\nFM-211: Fixed a delay in stock sync notifications')}\`)
        return true
      })()
    `)

    const generateEnabled = await evaluate(`
      (() => {
        const button = Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent.includes('Generate Release Message'))
        return button ? !button.disabled : false
      })()
    `)

    await evaluate(`
      (() => {
        const button = Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent.includes('Generate Release Message'))
        button?.click()
        return true
      })()
    `)

    await waitFor(`
      (() => {
        const output = document.querySelector('textarea[aria-label="Generated release note"]')
        return output && output.value.trim().length > 0
      })()
    `, 30000)

    const generatedPreview = await evaluate(`
      (() => {
        const output = document.querySelector('textarea[aria-label="Generated release note"]')
        return output?.value?.slice(0, 240) || ''
      })()
    `)

    await evaluate(`
      (() => {
        const button = Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent.includes('Copy'))
        button?.click()
        return true
      })()
    `)

    const copyButtonText = await waitFor(`
      (() => Array.from(document.querySelectorAll('button')).find((entry) => /Copy|Copied/.test(entry.textContent))?.textContent?.trim())()
    `)

    await evaluate(`
      (() => {
        const button = Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent.includes('Clear All'))
        button?.click()
        return true
      })()
    `)

    const clearedState = await waitFor(`
      (() => {
        const date = document.querySelector('input[name="releaseDate"]')?.value || ''
        const details = document.querySelector('textarea[name="ticketDetails"]')?.value || ''
        return date === '' && details === ''
      })()
    `)

    const result = {
      title,
      heading,
      todayButtonText,
      generateEnabled,
      generatedPreview,
      copyButtonText,
      clearedState
    }

    console.log(JSON.stringify(result, null, 2))
    socket.close()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    socket.close()
    process.exit(1)
  }
})
