const wsUrl = process.argv[2]

if (!wsUrl) {
  console.error('Usage: node scripts/cdp-dump.mjs <webSocketDebuggerUrl>')
  process.exit(1)
}

const socket = new WebSocket(wsUrl)
let id = 0
const pending = new Map()

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (!message.id) return
  const entry = pending.get(message.id)
  if (!entry) return
  pending.delete(message.id)
  if (message.error) {
    entry.reject(new Error(message.error.message))
    return
  }
  entry.resolve(message.result)
})

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const messageId = ++id
    pending.set(messageId, { resolve, reject })
    socket.send(JSON.stringify({ id: messageId, method, params }))
  })

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  })
  return result.result?.value
}

socket.addEventListener('open', async () => {
  try {
    await send('Page.enable')
    await send('Runtime.enable')
    const snapshot = await evaluate(`(() => ({
      title: document.title,
      heading: document.querySelector('h1')?.textContent?.trim() || '',
      notification: document.querySelector('[role="status"]')?.textContent?.trim() || '',
      generateButtonText: Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent.includes('Generate'))?.textContent?.trim() || '',
      generateDisabled: Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent.includes('Generate'))?.disabled ?? null,
      outputValue: document.querySelector('textarea[aria-label="Generated release note"]')?.value || '',
      dateValue: document.querySelector('input[name="releaseDate"]')?.value || '',
      timeValue: document.querySelector('input[name="releaseTime"]')?.value || '',
      detailsLength: document.querySelector('textarea[name="ticketDetails"]')?.value?.length || 0,
      bodyText: document.body.innerText.slice(0, 2000)
    }))()`)
    console.log(JSON.stringify(snapshot, null, 2))
    socket.close()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    socket.close()
    process.exit(1)
  }
})

socket.addEventListener('close', () => process.exit(0))
