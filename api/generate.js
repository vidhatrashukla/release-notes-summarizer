import { handleGenerateRequest } from '../server/api.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const result = await handleGenerateRequest({
    body: JSON.stringify(req.body ?? {})
  });

  Object.entries(result.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.status(result.status).send(result.body);
}
