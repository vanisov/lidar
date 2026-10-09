// Usage: node scripts/publish-cws.mjs lidar.zip 1.2.0 (setup: docs/RELEASING.md)
// Exits 0 when a CWS_* secret is missing, so releases still work before the store is set up.
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const API = 'https://chromewebstore.googleapis.com';
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';

const b64url = v => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

export function serviceAccountJwt(key, now = Math.floor(Date.now() / 1000)) {
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: key.client_email,
    scope: SCOPE,
    aud: key.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  return `${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url')}`;
}

export function uploadOutcome(state) {
  if (state === 'SUCCEEDED') return 'done';
  if (state === 'IN_PROGRESS' || state === 'UPLOAD_IN_PROGRESS') return 'wait';
  return 'failed';
}

async function call(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url} → ${res.status}\n${text}`);
  return text ? JSON.parse(text) : {};
}

async function main([zip, version]) {
  const { CWS_SERVICE_ACCOUNT_JSON: json, CWS_PUBLISHER_ID: publisher, CWS_EXTENSION_ID: extension } = process.env;
  if (!zip || !version) throw new Error('usage: node scripts/publish-cws.mjs <zip> <version>');
  if (!json || !publisher || !extension) {
    console.log('::notice::Chrome Web Store credentials are not set, so the store upload was skipped. See docs/RELEASING.md.');
    return;
  }
  const key = JSON.parse(json);
  const { access_token: token } = await call(key.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: serviceAccountJwt(key) }),
  });
  const auth = { authorization: `Bearer ${token}` };
  const item = `publishers/${publisher}/items/${extension}`;

  console.log(`Uploading ${zip} (${version})…`);
  const up = await call(`${API}/upload/v2/${item}:upload`, {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/zip' },
    body: await readFile(zip),
  });
  let state = up.uploadState;
  for (let i = 0; uploadOutcome(state) === 'wait'; i++) {
    if (i === 30) throw new Error('The upload is still processing after 5 minutes.');
    await new Promise(r => setTimeout(r, 10_000));
    state = (await call(`${API}/v2/${item}:fetchStatus`, { headers: auth })).lastAsyncUploadState;
  }
  if (uploadOutcome(state) === 'failed') throw new Error(`Upload failed (${state}): ${JSON.stringify(up)}`);
  if (up.crxVersion && up.crxVersion !== version) throw new Error(`The store read version ${up.crxVersion}, expected ${version}.`);

  console.log('Upload processed. Submitting for review…');
  const pub = await call(`${API}/v2/${item}:publish`, {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: '{}',
  });
  console.log(`Submitted ${version} for review: ${JSON.stringify(pub)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(err => {
    console.error(`::error::${err.message}`);
    process.exit(1);
  });
}
