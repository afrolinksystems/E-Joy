import 'dotenv/config';
import { createHmac } from 'node:crypto';

const userId = process.argv[2] ?? 'user_seed_1';
const role = process.argv[3] ?? 'customer';
const secret = process.env.JWT_SECRET ?? 'dev_jwt_secret';
const nowSec = Math.floor(Date.now() / 1000);
const payload = {
  sub: userId,
  role,
  iat: nowSec,
  exp: nowSec + 60 * 60,
};
const header = { alg: 'HS256', typ: 'JWT' };

const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
const signature = createHmac('sha256', secret)
  .update(`${encodedHeader}.${encodedPayload}`)
  .digest('base64url');

const token = `${encodedHeader}.${encodedPayload}.${signature}`;
console.log(token);
