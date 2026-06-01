import { z } from 'zod';
import { requireAdmin } from '../_auth.js';
import { prisma } from '../_db.js';
import { handleError, methodNotAllowed, readJson, sendJson } from '../_http.js';

const courseSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().optional().default(''),
  level: z.string().trim().min(1),
  duration: z.string().trim().min(1),
  instructor: z.string().trim().min(2),
  capacity: z.number().int().positive(),
  learningObjectives: z.array(z.string().trim()).optional().default([]),
  thumbnail: z.string().url().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional().default('DRAFT'),
});

export default async function handler(req, res) {
  try {
    await requireAdmin(req, ['ADMIN', 'TUTOR']);

    if (req.method === 'GET') {
      const courses = await prisma.course.findMany({ orderBy: { updatedAt: 'desc' } });
      return sendJson(res, 200, { courses });
    }

    if (req.method === 'POST') {
      await requireAdmin(req, ['ADMIN']);
      const values = courseSchema.parse(await readJson(req));
      const course = await prisma.course.create({ data: values });
      return sendJson(res, 201, { course });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return handleError(res, error);
  }
}
