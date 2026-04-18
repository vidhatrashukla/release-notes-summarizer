const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const VERSION_FIELDS = new Set(['osBE', 'osFE', 'proFE', 'proNative']);

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8'
};

const readEnv = (name) => process.env[name]?.trim();

const getGroqApiKey = () => readEnv('GROQ_API_KEY') || readEnv('VITE_GROQ_API_KEY');

const getGitHubToken = () => readEnv('GITHUB_TOKEN') || readEnv('GITHUB_API_TOKEN');

const getGitHubRepoConfig = () => {
  const raw = readEnv('GITHUB_REPOS') || readEnv('VITE_GITHUB_REPOS');
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse GITHUB_REPOS:', error);
    return [];
  }
};

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

const extractFieldConfig = (field) => {
  if (!VERSION_FIELDS.has(field)) {
    return null;
  }

  return getGitHubRepoConfig().find((config) => config.field === field) ?? null;
};

const fetchVersionFromGitHub = async (config) => {
  const token = getGitHubToken();
  const path = config.path || 'package.json';
  const branches = ['main', 'master'];

  for (const branch of branches) {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${branch}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.raw+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (response.status === 404) {
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('GitHub version lookup is not authorized. Configure GITHUB_TOKEN or enter versions manually.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub lookup failed with HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const rawPackageJson = await response.text();
    const parsedPackageJson = JSON.parse(rawPackageJson);

    if (!parsedPackageJson.version) {
      throw new Error('No version field was found in the configured package.json file.');
    }

    return {
      version: parsedPackageJson.version,
      branch
    };
  }

  throw new Error('No supported branch was found for the configured repository.');
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

export const handleVersionRequest = async (request) => {
  const url = new URL(request.url, 'http://localhost');
  const field = url.searchParams.get('field') || '';
  const config = extractFieldConfig(field);

  if (!getGitHubRepoConfig().length) {
    return createResponse(503, {
      error: 'Version lookup is not configured. Enter versions manually.',
      fallbackToManual: true
    });
  }

  if (!config) {
    return createResponse(400, {
      error: 'Unknown version field.'
    });
  }

  try {
    const result = await fetchVersionFromGitHub(config);
    return createResponse(200, {
      field,
      version: result.version,
      branch: result.branch
    });
  } catch (error) {
    return createResponse(502, {
      error: error instanceof Error ? error.message : 'Version lookup failed.',
      fallbackToManual: true
    });
  }
};
