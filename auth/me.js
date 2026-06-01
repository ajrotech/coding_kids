import { requireAdmin } from '../_auth.js';
import { handleError, methodNotAllowed, sendJson } from '../_http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const admin = await requireAdmin(req, ['ADMIN', 'TUTOR']);
    return sendJson(res, 200, { admin });
  } catch (error) {
    return handleError(res, error);
  }
}
