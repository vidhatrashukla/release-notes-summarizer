export const requestGeneratedMessage = async (prompt) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Generation failed.')
  }

  return data.message || 'No response generated'
}
