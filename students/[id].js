import { z } from 'zod';
import { requireAdmin } from '../_auth.js';
import { prisma } from '../_db.js';
import { handleError, methodNotAllowed, readJson, sendJson } from '../_http.js';

const updateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  parentName: z.string().trim().min(2).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  phone: z.string().trim().min(6).optional(),
  ageClass: z.string().trim().min(1).optional(),
  assignedCourse: z.string().trim().min(1).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'SUSPENDED']).optional(),
});

export default async function handler(req, res) {
  if (!['PATCH', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['PATCH', 'DELETE']);

  try {
    await requireAdmin(req, ['ADMIN']);
    const { id } = req.query;

    if (req.method === 'PATCH') {
      const values = updateSchema.parse(await readJson(req));
      const student = await prisma.student.update({ where: { id }, data: values });
      return sendJson(res, 200, { student });
    }

    await prisma.student.delete({ where: { id } });
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}
