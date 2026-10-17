import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import worker from '../src/worker.js';
if (!globalThis.crypto) globalThis.crypto = webcrypto;

function fakeDb() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      let args = [];
      return {
        bind(...values) { args = values; return this; },
        async run() {
          if (sql.includes('INSERT OR IGNORE')) {
            const [id, email, role, hash] = args;
            if ([...rows.values()].some(r => r.email === email && r.role === role)) return {meta:{changes:0}};
            rows.set(id, {id, email, role, edit_token_hash:hash});
            return {meta:{changes:1}};
          }
          if (sql.includes('UPDATE waitlist')) return {meta:{changes:1}};
          throw new Error('Unknown SQL');
        },
        async first() {
          const row = rows.get(args[0]);
          return row ? {role:row.role, edit_token_hash:row.edit_token_hash} : null;
        }
      };
    }
  };
}
const envFor = (db = fakeDb()) => ({DB:db, TURNSTILE_SECRET:'fake-secret', TURNSTILE_HOSTNAMES:'unstuck.test', ASSETS:{fetch:()=>new Response('static')}});
function makeRequest(path, data, origin = 'https://unstuck.test') {
  return new Request('https://unstuck.test'+path, {
    method:'POST', headers:{'content-type':'application/json','origin':origin}, body:JSON.stringify(data)
  });
}
const registration = {email:'Test@Example.com',role:'buyer',consent:true,turnstileToken:'fresh-human-token'};
const savedFetch = globalThis.fetch;
let responseFor = () => ({success:true, action:'waitlist_signup', hostname:'unstuck.test'});
let siteverifyCalls = 0;
globalThis.fetch = async (url, options) => {
  if (String(url) !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') throw new Error('Unexpected network access');
  siteverifyCalls++;
  assert.equal(options.method, 'POST');
  assert.equal(options.headers['content-type'], 'application/x-www-form-urlencoded');
  const params = new URLSearchParams(options.body);
  assert.equal(params.get('secret'), 'fake-secret');
  return new Response(JSON.stringify(responseFor(params)), {status:200});
};

test('valid signup, normalized email, duplicate and authorized optional profile', async () => {
  const db = fakeDb(); const env = envFor(db);
  const first = await worker.fetch(makeRequest('/api/subscribe', registration), env);
  assert.equal(first.status, 201);
  const data = await first.json();
  assert.equal(data.ok,true); assert.match(data.token,/^[a-f0-9]{64}$/);
  assert.equal(db.rows.get(data.id).email,'test@example.com');
  const again = await worker.fetch(makeRequest('/api/subscribe', {...registration,turnstileToken:'fresh-token-2'}),env);
  assert.equal(again.status,200); assert.equal((await again.json()).duplicate,true);
  const update = await worker.fetch(makeRequest('/api/profile',{id:data.id,token:data.token,service:'fix',budget:'100_500'}),env);
  assert.equal(update.status,200); assert.equal((await update.json()).ok,true);
  const rejected = await worker.fetch(makeRequest('/api/profile',{id:data.id,token:'0'.repeat(64),service:'fix'}),env);
  assert.equal(rejected.status,403);
});

test('invalid consent and malformed body rejected before siteverify',async () => {
  const env = envFor();
  const bad = await worker.fetch(makeRequest('/api/subscribe',{...registration,consent:false}),env);
  assert.equal(bad.status,400);
  const nullData = await worker.fetch(new Request('https://unstuck.test/api/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:'null'}),env);
  assert.equal(nullData.status,400);
});

test('origin verification and missing configuration fail closed',async () => {
  const env = envFor();
  assert.equal((await worker.fetch(makeRequest('/api/subscribe',registration,'https://evil.test'),env)).status,403);
  assert.equal((await worker.fetch(makeRequest('/api/subscribe',registration),{DB:fakeDb()})).status,503);
  assert.equal((await worker.fetch(makeRequest('/api/subscribe',registration),{DB:fakeDb(),TURNSTILE_SECRET:'fake-secret'})).status,503);
});

test('honeypot does not write data',async () => {
  const db=fakeDb(); const env=envFor(db);
  const res=await worker.fetch(makeRequest('/api/subscribe',{...registration,website:'spam'}),env);
  assert.equal(res.status,200); assert.equal(db.rows.size,0);
});

test('siteverify accepts only action=waitlist_signup and exact deployment hostname', async () => {
  const db = fakeDb(); const env = envFor(db);
  for (const result of [
    {success:true,action:'login',hostname:'unstuck.test'},
    {success:true,action:'waitlist_signup',hostname:'evil.test'},
    {success:true,action:'waitlist_signup',hostname:'localhost'},
    {success:false,action:'waitlist_signup',hostname:'unstuck.test'},
    {success:true,action:'waitlist_signup'},
    {success:true,hostname:'unstuck.test'},
  ]) {
    responseFor = () => result;
    const r = await worker.fetch(makeRequest('/api/subscribe',registration),env);
    assert.equal(r.status,403,JSON.stringify(result));
  }
  assert.equal(db.rows.size,0);
  responseFor = () => ({success:true,action:'waitlist_signup',hostname:'unstuck.test'});
});

test('token must be present and at most 2048 characters (no truncation)',async () => {
  const db=fakeDb(); const env=envFor(db);
  const old = siteverifyCalls;
  for (const token of [undefined, '', null, 42, 'x'.repeat(2049)]) {
    const r=await worker.fetch(makeRequest('/api/subscribe',{...registration,turnstileToken:token}),env);
    assert.equal(r.status,403);
  }
  assert.equal(siteverifyCalls,old); // invalid tokens never sent to Cloudflare
  assert.equal(db.rows.size,0);
});

test('siteverify rejects a replayed token, with no additional DB write',async () => {
  const seen = new Set();
  responseFor = params => {
    const token = params.get('response');
    if (seen.has(token)) return {success:false,'error-codes':['timeout-or-duplicate']};
    seen.add(token);
    return {success:true, action:'waitlist_signup', hostname:'unstuck.test'};
  };
  try {
    const db=fakeDb(); const env=envFor(db);
    const first=await worker.fetch(makeRequest('/api/subscribe',registration),env);
    assert.equal(first.status,201);
    const second=await worker.fetch(makeRequest('/api/subscribe',{...registration,email:'Other@Example.com'}),env);
    assert.equal(second.status,403);
    assert.equal(db.rows.size,1);
  } finally {
    responseFor = () => ({success:true,action:'waitlist_signup',hostname:'unstuck.test'});
  }
});

test('siteverify HTTP failures and invalid JSON fail closed',async () => {
  const db=fakeDb(); const env=envFor(db);
  const saved=globalThis.fetch;
  try {
    globalThis.fetch=async()=>new Response('broken',{status:502});
    assert.equal((await worker.fetch(makeRequest('/api/subscribe',registration),env)).status,403);
    globalThis.fetch=async()=>new Response('not json',{status:200});
    assert.equal((await worker.fetch(makeRequest('/api/subscribe',registration),env)).status,403);
    globalThis.fetch=async()=>{throw new Error('offline')};
    assert.equal((await worker.fetch(makeRequest('/api/subscribe',registration),env)).status,403);
    assert.equal(db.rows.size,0);
  } finally { globalThis.fetch=saved; }
});

test('hostname must belong to current Worker deployment, even if allowed elsewhere',async () => {
  const env=envFor(); env.TURNSTILE_HOSTNAMES='unstuck.test,localhost';
  responseFor=()=>({success:true,action:'waitlist_signup',hostname:'localhost'});
  try { assert.equal((await worker.fetch(makeRequest('/api/subscribe',registration),env)).status,403); }
  finally { responseFor=()=>({success:true,action:'waitlist_signup',hostname:'unstuck.test'}); }
});

test('frontend uses the same siteverify action; no secret in browser config',async () => {
  const frontend = await readFile(new URL('../public/app.js',import.meta.url),'utf8');
  const config = await readFile(new URL('../public/config.js',import.meta.url),'utf8');
  assert.match(frontend,/action:\s*'waitlist_signup'/);
  assert.doesNotMatch(config,/TURNSTILE_SECRET/);
});

test.after(() => { globalThis.fetch=savedFetch; });
