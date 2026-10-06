import { createVerify, generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
// @ts-expect-error: plain .mjs script without type declarations
import { serviceAccountJwt, uploadOutcome } from '../../scripts/publish-cws.mjs';

describe('serviceAccountJwt', () => {
  it('builds an RS256 JWT for the Chrome Web Store scope that the key verifies', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const key = { client_email: 'ci@lidar.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
    const jwt: string = serviceAccountJwt(key, 1_000);
    const [head, body, sig] = jwt.split('.');
    expect(JSON.parse(Buffer.from(head, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(JSON.parse(Buffer.from(body, 'base64url').toString())).toEqual({
      iss: 'ci@lidar.iam.gserviceaccount.com',
      scope: 'https://www.googleapis.com/auth/chromewebstore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: 1_000,
      exp: 4_600,
    });
    expect(createVerify('RSA-SHA256').update(`${head}.${body}`).verify(publicKey, sig, 'base64url')).toBe(true);
  });
});

describe('uploadOutcome', () => {
  it('maps the API upload states', () => {
    expect(uploadOutcome('SUCCEEDED')).toBe('done');
    expect(uploadOutcome('IN_PROGRESS')).toBe('wait');
    expect(uploadOutcome('UPLOAD_IN_PROGRESS')).toBe('wait');
    for (const s of ['FAILED', 'NOT_FOUND', 'UPLOAD_STATE_UNSPECIFIED', undefined]) expect(uploadOutcome(s)).toBe('failed');
  });
});
