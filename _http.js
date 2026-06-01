export function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  sendJson(res, 405, { error: `Method not allowed. Use ${allowed.join(', ')}.` }, {
    Allow: allowed.join(', '),
  });
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Invalid JSON request body.');
    error.statusCode = 400;
    throw error;
  }
}

export function handleError(res, error) {
  const status = error.statusCode ?? 500;
  sendJson(res, status, {
    error: status === 500 ? 'Internal server error.' : error.message,
  });
}
