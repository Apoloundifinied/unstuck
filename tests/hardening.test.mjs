import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import worker from '../src/worker.js';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const noAssets = { ASSETS: { fetch() { throw new Error('API fell through to assets'); } } };

test('profile rejects foreign and malformed origins with 403 before reading the database', async () => {
  const env = { DB: { prepare() { throw new Error('Rejected origin reached database'); } } };
  for (const origin of ['https://evil.test', 'null', 'not-a-url', 'http://unstuck.test']) {
    const response = await worker.fetch(new Request('https://unstuck.test/api/profile', {
      method: 'POST', headers: { 'content-type': 'application/json', origin }, body: '{}',
    }), env);
    assert.equal(response.status, 403, origin);
    assert.deepEqual(await response.json(), { ok: false, error: 'origin' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  const malformed = await worker.fetch(new Request('https://unstuck.test/api/profile', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://unstuck.test' }, body: 'null',
  }), env);
  assert.equal(malformed.status, 400);
  const validBody = { id: '00000000-0000-4000-8000-000000000001', token: '0'.repeat(64) };
  for (const origin of [undefined, 'https://unstuck.test']) {
    const headers = { 'content-type': 'application/json' };
    if (origin) headers.origin = origin;
    const response = await worker.fetch(new Request('https://unstuck.test/api/profile', {
      method: 'POST', headers, body: JSON.stringify(validBody),
    }), {});
    assert.equal(response.status, 503); // accepted origin reaches the configuration check
  }
});

test('canonical and sharing metadata use the operator-confirmed public URL on both pages', async () => {
  for (const [file, path] of [['../public/index.html', '/'], ['../public/privacidade/index.html', '/privacidade/']]) {
    const html = await read(file);
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
    assert.equal(canonical, `https://unstuck-n8n-waitlist.unstuck-n8n-waitlist.workers.dev${path}`);
    assert.equal(html.match(/property="og:url" content="([^"]+)"/)[1], canonical);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    assert.equal(html.match(/property="og:title" content="([^"]+)"/)[1], title);
    assert.equal(html.match(/name="twitter:title" content="([^"]+)"/)[1], title);
    const description = html.match(/name="description" content="([^"]+)"/)[1];
    assert.equal(html.match(/property="og:description" content="([^"]+)"/)[1], description);
    assert.equal(html.match(/name="twitter:description" content="([^"]+)"/)[1], description);
    assert.match(html, /name="twitter:card" content="summary"/);
  }
});

test('API rejects unsupported methods before accessing services', async () => {
  for (const path of ['/api/subscribe', '/api/profile']) {
    for (const method of ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const response = await worker.fetch(new Request(`https://unstuck.test${path}`, { method }), noAssets);
      assert.equal(response.status, 405, `${method} ${path}`);
      assert.deepEqual(await response.json(), { ok: false, error: 'method' });
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  }
});

test('unknown POST API route returns JSON 404 without asset fallback', async () => {
  const response = await worker.fetch(new Request('https://unstuck.test/api/missing', { method: 'POST' }), noAssets);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { ok: false, error: 'not_found' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('content-type'), /^application\/json/);
});

test('assets preserve status, body and existing headers while receiving restrictive CSP', async () => {
  for (const status of [200, 404]) {
    const request = new Request('https://unstuck.test/privacidade/');
    const response = await worker.fetch(request, { ASSETS: { fetch(received) {
      assert.equal(received, request);
      return new Response('asset body', { status, headers: { 'content-type': 'text/html', etag: 'asset-version' } });
    } } });
    assert.equal(response.status, status);
    assert.equal(await response.text(), 'asset body');
    assert.equal(response.headers.get('etag'), 'asset-version');
    assert.equal(response.headers.get('content-type'), 'text/html');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()');
    const csp = response.headers.get('content-security-policy');
    const directives = new Map(csp.split(';').map(value => {
      const [name, ...sources] = value.trim().split(/\s+/);
      return [name, sources];
    }));
    for (const name of ['default-src', 'style-src', 'font-src', 'form-action']) {
      assert.deepEqual(directives.get(name), ["'self'"]);
    }
    assert.deepEqual(directives.get('script-src'), ["'self'", 'https://challenges.cloudflare.com', 'https://static.cloudflareinsights.com/beacon.min.js']);
    assert.deepEqual(directives.get('connect-src'), ["'self'", 'https://cloudflareinsights.com']);
    assert.deepEqual(directives.get('frame-src'), ['https://challenges.cloudflare.com']);
    assert.deepEqual(directives.get('base-uri'), ["'none'"]);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|fonts\.google|\*/);
  }
});

test('deployment routes every asset through the security-header Worker', async () => {
  const config = await read('../wrangler.toml');
  const assets = config.split('[assets]')[1].split('[[d1_databases]]')[0];
  assert.match(assets, /^run_worker_first\s*=\s*true\s*$/m);
});

test('both pages use local styles without inline CSS or remote font requests', async () => {
  for (const path of ['../public/index.html', '../public/privacidade/index.html']) {
    const html = await read(path);
    assert.match(html, /href="\/fonts\/fonts\.css"/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com|<style\b|\sstyle\s*=/i);
    for (const [, href] of html.matchAll(/<link\b[^>]*href="([^"#]+\.css)"/g)) {
      await read(`../public${href}`);
    }
  }
});

test('local fonts cover original families, weights and styles and contain valid WOFF2 files', async () => {
  const css = await read('../public/fonts/fonts.css');
  assert.doesNotMatch(css, /https?:|@import/);
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(([, body]) => body);
  for (const [family, styles, weights] of [
    ['DM Mono', ['normal'], [400, 500]],
    ['DM Sans', ['normal'], [400, 500, 600, 700]],
    ['Instrument Serif', ['normal', 'italic'], [400]],
  ]) {
    for (const style of styles) for (const weight of weights) {
      assert.ok(faces.some(face => face.includes(`font-family: '${family}'`) &&
        face.includes(`font-style: ${style};`) && face.includes(`font-weight: ${weight};`)), `${family} ${style} ${weight}`);
    }
  }
  const urls = new Set([...css.matchAll(/url\(([^)]+)\)/g)].map(([, url]) => url));
  for (const url of urls) {
    assert.match(url, /^\/fonts\/[\w-]+\.woff2$/);
    const data = await readFile(new URL(`../public${url}`, import.meta.url));
    assert.equal(data.subarray(0, 4).toString(), 'wOF2');
    assert.equal(data.readUInt32BE(8), data.length);
  }
  for (const family of ['dmmono', 'dmsans', 'instrumentserif']) {
    assert.match(await read(`../public/fonts/OFL-${family}.txt`), /SIL OPEN FONT LICENSE/);
  }
});

test('only the placeholder dev.vars example is exempt from gitignore', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const result = execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/').replace(/\/$/, '')}`,
    'check-ignore', '--no-index', '--stdin'], {
    cwd: root, input: '.dev.vars\n.dev.vars.production\n.env\n.env.local\n.dev.vars.example\n', encoding: 'utf8',
  });
  assert.deepEqual(result.trim().split(/\r?\n/), ['.dev.vars', '.dev.vars.production', '.env', '.env.local']);
});
