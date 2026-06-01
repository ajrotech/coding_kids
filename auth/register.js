import { z } from 'zod';
import { prisma } from '../_db.js';
import { createToken, hashPassword, sessionCookie } from '../_auth.js';
import { handleError, methodNotAllowed, readJson, sendJson } from '../_http.js';

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((value) => value.password === value.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const values = registerSchema.parse(await readJson(req));
    const existing = await prisma.adminUser.findUnique({ where: { email: values.email } });
    if (existing) {
      return sendJson(res, 409, { error: 'An admin account with this email already exists.' });
    }

    const totalAdmins = await prisma.adminUser.count();
    const admin = await prisma.adminUser.create({
      data: {
        fullName: values.fullName,
        email: values.email,
        passwordHash: await hashPassword(values.password),
        role: totalAdmins === 0 ? 'ADMIN' : 'TUTOR',
      },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });

    const token = createToken(admin);
    return sendJson(res, 201, { admin, token }, {
      'Set-Cookie': sessionCookie(token, true),
    });
  } catch (error) {
    return handleError(res, error);
  }
}
