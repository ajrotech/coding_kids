import { z } from 'zod';
import { requireAdmin } from '../_auth.js';
import { prisma } from '../_db.js';
import { handleError, methodNotAllowed, readJson, sendJson } from '../_http.js';

const enrollmentSchema = z.object({
  studentName: z.string().trim().min(2),
  parentName: z.string().trim().min(2),
  ageClass: z.string().trim().min(1),
  whatsappNumber: z.string().trim().min(6),
  emailAddress: z.string().trim().email().transform((value) => value.toLowerCase()),
  selectedCourse: z.string().trim().min(1),
  message: z.string().trim().optional().default(''),
});

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      await requireAdmin(req, ['ADMIN', 'TUTOR']);
      const enrollments = await prisma.enrollment.findMany({ orderBy: { createdAt: 'desc' } });
      return sendJson(res, 200, { enrollments });
    }

    if (req.method === 'POST') {
      const values = enrollmentSchema.parse(await readJson(req));
      const enrollment = await prisma.enrollment.create({ data: values });
      return sendJson(res, 201, { enrollment });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return handleError(res, error);
  }
}
