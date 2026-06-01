import { clearSessionCookie } from '../_auth.js';
import { methodNotAllowed, sendJson } from '../_http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
}
