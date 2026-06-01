import { z } from 'zod';
import { requireAdmin } from '../_auth.js';
import { prisma } from '../_db.js';
import { handleError, methodNotAllowed, readJson, sendJson } from '../_http.js';

const updateSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONFIRMED']).optional(),
  verificationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED']).optional(),
  notes: z.string().optional(),
});

export default async function handler(req, res) {
  if (!['PATCH', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['PATCH', 'DELETE']);

  try {
    await requireAdmin(req, ['ADMIN']);
    const { id } = req.query;

    if (req.method === 'PATCH') {
      const values = updateSchema.parse(await readJson(req));
      const enrollment = await prisma.enrollment.update({ where: { id }, data: values });
      return sendJson(res, 200, { enrollment });
    }

    await prisma.enrollment.delete({ where: { id } });
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}
