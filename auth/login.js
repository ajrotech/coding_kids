import { z } from 'zod';
import { prisma } from '../_db.js';
import { createToken, sessionCookie, verifyPassword } from '../_auth.js';
import { handleError, methodNotAllowed, readJson, sendJson } from '../_http.js';

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
  remember: z.boolean().optional().default(false),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const values = loginSchema.parse(await readJson(req));
    const adminWithPassword = await prisma.adminUser.findUnique({ where: { email: values.email } });
    const valid = adminWithPassword && (await verifyPassword(values.password, adminWithPassword.passwordHash));

    if (adminWithPassword) {
      await prisma.loginHistory.create({
        data: {
          adminId: adminWithPassword.id,
          ipAddress: req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          success: Boolean(valid),
        },
      }).catch(() => undefined);
    }

    if (!valid) {
      return sendJson(res, 401, { error: 'Email or password is incorrect.' });
    }

    const admin = {
      id: adminWithPassword.id,
      fullName: adminWithPassword.fullName,
      email: adminWithPassword.email,
      role: adminWithPassword.role,
      createdAt: adminWithPassword.createdAt,
    };
    const token = createToken(admin);

    return sendJson(res, 200, { admin, token }, {
      'Set-Cookie': sessionCookie(token, values.remember),
    });
  } catch (error) {
    return handleError(res, error);
  }
}
