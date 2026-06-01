import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './_db.js';

const COOKIE_NAME = 'codekidzz_session';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw Object.assign(new Error('JWT_SECRET must be set to at least 32 characters.'), { statusCode: 500 });
  }
  return secret;
}

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(data) {
  return crypto.createHmac('sha256', getJwtSecret()).update(data).digest('base64url');
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createToken(admin) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.fullName,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    }),
  );
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyToken(token) {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    throw Object.assign(new Error('Invalid session token.'), { statusCode: 401 });
  }

  const expected = sign(`${header}.${payload}`);
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    throw Object.assign(new Error('Invalid session token.'), { statusCode: 401 });
  }

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
    throw Object.assign(new Error('Session expired.'), { statusCode: 401 });
  }

  return claims;
}

export function sessionCookie(token, remember = false) {
  const maxAge = remember ? ` Max-Age=${TOKEN_TTL_SECONDS};` : '';
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax;${secure}${maxAge}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0;`;
}

export function tokenFromRequest(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice('Bearer '.length);

  const cookies = req.headers.cookie?.split(';').map((part) => part.trim()) ?? [];
  const cookie = cookies.find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return cookie ? decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)) : null;
}

export async function requireAdmin(req, roles = ['ADMIN']) {
  const token = tokenFromRequest(req);
  if (!token) {
    throw Object.assign(new Error('Authentication required.'), { statusCode: 401 });
  }

  const claims = verifyToken(token);
  const admin = await prisma.adminUser.findUnique({
    where: { id: claims.sub },
    select: { id: true, fullName: true, email: true, role: true, createdAt: true },
  });

  if (!admin) {
    throw Object.assign(new Error('Admin account not found.'), { statusCode: 401 });
  }

  if (!roles.includes(admin.role)) {
    throw Object.assign(new Error('Insufficient permissions.'), { statusCode: 403 });
  }

  return admin;
}
