import { z } from 'zod';
import { requireAdmin } from '../_auth.js';
import { prisma } from '../_db.js';
import { handleError, methodNotAllowed, readJson, sendJson } from '../_http.js';

const updateSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().trim().optional(),
  level: z.string().trim().min(1).optional(),
  duration: z.string().trim().min(1).optional(),
  instructor: z.string().trim().min(2).optional(),
  capacity: z.number().int().positive().optional(),
  enrolledCount: z.number().int().min(0).optional(),
  learningObjectives: z.array(z.string().trim()).optional(),
  thumbnail: z.string().url().nullable().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
});

export default async function handler(req, res) {
  if (!['PATCH', 'DELETE'].includes(req.method)) return methodNotAllowed(res, ['PATCH', 'DELETE']);

  try {
    await requireAdmin(req, ['ADMIN']);
    const { id } = req.query;

    if (req.method === 'PATCH') {
      const values = updateSchema.parse(await readJson(req));
      const course = await prisma.course.update({ where: { id }, data: values });
      return sendJson(res, 200, { course });
    }

    await prisma.course.delete({ where: { id } });
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return handleError(res, error);
  }
}
