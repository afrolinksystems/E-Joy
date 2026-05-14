import 'dotenv/config';
import { createHmac } from 'node:crypto';

const userId = process.argv[2] ?? 'user_seed_1';
const role = process.argv[3] ?? 'customer';
const sessionId = process.argv[4];
const secret = process.env.JWT_ACCESS_SECRET?.trim();
const issuer = process.env.JWT_ISSUER?.trim();
const audience = process.env.JWT_AUDIENCE?.trim();
if (!secret || !issuer || !audience || !sessionId) {
  throw new Error(
    'JWT_ACCESS_SECRET, JWT_ISSUER, JWT_AUDIENCE and sid argument are required',
  );
}
const nowSec = Math.floor(Date.now() / 1000);
const payload = {
  sub: userId,
  typ: 'access',
  sid: sessionId,
  role,
  scope: [],
  subjectType: role === 'platform_admin' ? 'PLATFORM_ADMIN' : 'STAFF',
  iss: issuer,
  aud: audience,
  iat: nowSec,
  exp: nowSec + 15 * 60,
};
const header = { alg: 'HS256', typ: 'JWT' };

const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
  'base64url',
);
const signature = createHmac('sha256', secret)
  .update(`${encodedHeader}.${encodedPayload}`)
  .digest('base64url');

const token = `${encodedHeader}.${encodedPayload}.${signature}`;
console.log(token);
