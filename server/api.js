const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8'
};

const readEnv = (name) => process.env[name]?.trim();

const getGroqApiKey = () => readEnv('GROQ_API_KEY') || readEnv('VITE_GROQ_API_KEY');

const createResponse = (status, body) => ({
  status,
  headers: jsonHeaders,
  body: JSON.stringify(body)
});

const readRequestBody = async (request) => {
  if (!request) {
    return {};
  }

  if (typeof request.body === 'string') {
    return request.body ? JSON.parse(request.body) : {};
  }

  if (typeof request.json === 'function') {
    return await request.json();
  }

  return {};
};

export const handleGenerateRequest = async (request) => {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return createResponse(503, {
      error: 'Generation is not configured. Add GROQ_API_KEY on the server.'
    });
  }

  let payload;
  try {
    payload = await readRequestBody(request);
  } catch {
    return createResponse(400, {
      error: 'Invalid JSON payload.'
    });
  }

  const prompt = payload?.prompt?.trim();
  if (!prompt) {
    return createResponse(400, {
      error: 'Prompt is required.'
    });
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      const retryable = response.status >= 500 || response.status === 429;
      return createResponse(response.status, {
        error: retryable
          ? 'Generation failed upstream. Please retry in a moment.'
          : `Generation failed: ${errorText || response.statusText}`,
        retryable
      });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();

    if (!message) {
      return createResponse(502, {
        error: 'The model returned an empty response.',
        retryable: true
      });
    }

    return createResponse(200, {
      message
    });
  } catch (error) {
    return createResponse(502, {
      error: error instanceof Error ? error.message : 'Generation failed unexpectedly.',
      retryable: true
    });
  }
};
