import { z } from 'zod';
import { requireAdmin } from '../_auth.js';
import { prisma } from '../_db.js';
import { handleError, methodNotAllowed, readJson, sendJson } from '../_http.js';

const studentSchema = z.object({
  fullName: z.string().trim().min(2),
  parentName: z.string().trim().min(2),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(6),
  ageClass: z.string().trim().min(1),
  assignedCourse: z.string().trim().min(1),
  enrollmentId: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional().default(0),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'SUSPENDED']).optional().default('ACTIVE'),
});

export default async function handler(req, res) {
  try {
    await requireAdmin(req, ['ADMIN', 'TUTOR']);

    if (req.method === 'GET') {
      const students = await prisma.student.findMany({ orderBy: { createdAt: 'desc' } });
      return sendJson(res, 200, { students });
    }

    if (req.method === 'POST') {
      await requireAdmin(req, ['ADMIN']);
      const values = studentSchema.parse(await readJson(req));
      const student = await prisma.student.create({ data: values });
      return sendJson(res, 201, { student });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return handleError(res, error);
  }
}
