import { handleVersionRequest } from '../server/api.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const query = new URLSearchParams(req.query ?? {}).toString();
  const url = query ? `http://localhost/api/version?${query}` : 'http://localhost/api/version';
  const result = await handleVersionRequest({ url });

  Object.entries(result.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.status(result.status).send(result.body);
}
