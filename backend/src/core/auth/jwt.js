import { SignJWT, jwtVerify } from 'jose';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Missing JWT_SECRET');
    err.code = 'JWT_SECRET_MISSING';
    throw err;
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload) {
  const secret = getJwtSecret();
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? '12h')
    .sign(secret);
  return jwt;
}

export async function verifyAccessToken(token) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  return payload;
}

