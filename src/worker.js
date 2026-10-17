// Unstuck n8n waitlist — Cloudflare Worker + D1 + static assets
// No keys, workflow JSON, n8n instances, or client credentials are collected.
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SERVICE = new Set(['build', 'fix', 'customize', 'audit', 'maintain', 'learn', 'other']);
const INTEGRATION = new Set(['gmail', 'sheets', 'whatsapp', 'hubspot', 'notion', 'stripe', 'telegram', 'webhooks', 'other']);
const BUDGET = new Set(['under_100', '100_500', '500_2000', 'over_2000', 'unsure']);
const TIMELINE = new Set(['asap', 'this_month', 'exploring']);
const AVAILABILITY = new Set(['now', 'two_weeks', 'later']);
const RATE = new Set(['under_25', '25_60', '60_120', 'over_120', 'project']);
const ROLE = new Set(['buyer', 'expert']);
const MAX_BODY = 6000;
const TURNSTILE_ACTION = 'waitlist_signup';
const makeJson = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
});
const validUrl = (v) => { try { const u = new URL(v); return u.protocol === 'https:' && u.hostname.includes('.'); } catch { return false; } };
const clip = (x, size) => typeof x === 'string' ? x.trim().slice(0, size) : '';
async function hashToken(token) {
  const data = new TextEncoder().encode(token);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))]
    .map(x => x.toString(16).padStart(2, '0')).join('');
}
async function parseJson(req) {
  if (!(req.headers.get('content-type') || '').toLowerCase().includes('application/json')) return null;
  if (Number(req.headers.get('content-length') || 0) > MAX_BODY) return null;
  const body = await req.text();
  if (body.length > MAX_BODY) return null;
  try { const parsed = JSON.parse(body); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null; }
  catch { return null; }
}
function originMatches(req) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // Turnstile still required; non-browser clients lack Origin.
  try { return new URL(origin).origin === new URL(req.url).origin; } catch { return false; }
}
// Spin contract: token is verified by the existing Worker, never by client JavaScript.
// Configuration is deployment-specific: TURNSTILE_SECRET and TURNSTILE_HOSTNAMES.
async function verifyTurnstile(env, token, ip, requestHostname) {
  const expectedHostnames = new Set(
    (env.TURNSTILE_HOSTNAMES || '').split(',').map(host => host.trim()).filter(Boolean)
  );
  if (
    !env.TURNSTILE_SECRET || typeof token !== 'string' ||
    token.length === 0 || token.length > 2048 ||
    expectedHostnames.size === 0 || !expectedHostnames.has(requestHostname)
  ) return false; // fail closed on missing or invalid configuration

  const body = new URLSearchParams({secret: env.TURNSTILE_SECRET, response: token});
  if (ip) body.set('remoteip', ip);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      body,
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.success === true &&
      result.action === TURNSTILE_ACTION &&
      expectedHostnames.has(result.hostname) &&
      result.hostname === requestHostname;
  } catch {
    return false; // network, timeout, invalid JSON: never accept an unverified submission
  }
}
async function subscribe(req, env) {
  const body = await parseJson(req);
  if (!body) return makeJson({ok:false,error:'invalid_json'}, 400);
  if (!originMatches(req)) return makeJson({ok:false,error:'origin'}, 403);
  const email = clip(body.email, 254).toLowerCase();
  if (!RE_EMAIL.test(email) || email.length > 254 || !ROLE.has(body.role) || body.consent !== true)
    return makeJson({ok:false,error:'validation'}, 400);
  if (!env.DB || !env.TURNSTILE_SECRET || !env.TURNSTILE_HOSTNAMES)
    return makeJson({ok:false,error:'not_configured'}, 503);
  // Do not truncate untrusted tokens: a token beyond the Turnstile limit is invalid.
  if (!await verifyTurnstile(env, body.turnstileToken, req.headers.get('cf-connecting-ip'), new URL(req.url).hostname))
    return makeJson({ok:false,error:'captcha'}, 403);
  if (clip(body.website, 200)) return makeJson({ok:true}, 200); // honeypot, no DB write
  const id = crypto.randomUUID();
  const secretBytes = new Uint8Array(32); crypto.getRandomValues(secretBytes);
  const token = Array.from(secretBytes).map(x => x.toString(16).padStart(2,'0')).join('');
  try {
    const result = await env.DB.prepare(`INSERT OR IGNORE INTO waitlist
      (id,email,role,consented_at,edit_token_hash,utm_source,utm_medium,utm_campaign,referrer)
      VALUES (?,?,?,datetime('now'),?,?,?,?,?)`)
      .bind(id,email,body.role,await hashToken(token),clip(body.utm_source,80),clip(body.utm_medium,80),clip(body.utm_campaign,100),clip(body.referrer,250)).run();
    if (result.meta.changes === 0) return makeJson({ok:true,duplicate:true});
    return makeJson({ok:true,id,token},201);
  } catch (error) { console.error('subscribe:', error?.name || 'db_error'); return makeJson({ok:false,error:'server'},500); }
}
async function profile(req, env) {
  const body = await parseJson(req);
  if (!body) return makeJson({ok:false,error:'validation'},400);
  if (!originMatches(req)) return makeJson({ok:false,error:'origin'},403);
  if (!env.DB) return makeJson({ok:false,error:'not_configured'},503);
  if (!RE_UUID.test(body.id || '') || !/^[a-f0-9]{64}$/.test(body.token || '')) return makeJson({ok:false,error:'validation'},400);
  try {
    const row = await env.DB.prepare('SELECT role,edit_token_hash FROM waitlist WHERE id=?').bind(body.id).first();
    if (!row || (await hashToken(body.token)) !== row.edit_token_hash) return makeJson({ok:false,error:'forbidden'},403);
    const service = SERVICE.has(body.service) ? body.service : null;
    const integration = INTEGRATION.has(body.integration) ? body.integration : null;
    if (row.role === 'buyer') {
      const budget = BUDGET.has(body.budget) ? body.budget : null;
      const timeline = TIMELINE.has(body.timeline) ? body.timeline : null;
      await env.DB.prepare(`UPDATE waitlist SET service=?, integration=?, budget=?, timeline=?, context_note=?, updated_at=datetime('now') WHERE id=?`)
        .bind(service,integration,budget,timeline,clip(body.context_note,500),body.id).run();
    } else {
      const proofUrl = clip(body.proof_url,200);
      const availability = AVAILABILITY.has(body.availability) ? body.availability : null;
      const rate = RATE.has(body.rate) ? body.rate : null;
      await env.DB.prepare(`UPDATE waitlist SET service=?, integration=?, proof_url=?, availability=?, rate=?, updated_at=datetime('now') WHERE id=?`)
        .bind(service,integration,proofUrl && validUrl(proofUrl) ? proofUrl : null,availability,rate,body.id).run();
    }
    return makeJson({ok:true});
  } catch (error) { console.error('profile:',error?.name || 'db_error'); return makeJson({ok:false,error:'server'},500); }
}
export default {
  async fetch(req,env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      if (req.method !== 'POST') return makeJson({ok:false,error:'method'},405);
      if (url.pathname === '/api/subscribe') return subscribe(req,env);
      if (url.pathname === '/api/profile') return profile(req,env);
      return makeJson({ok:false,error:'not_found'},404);
    }
    const response = await env.ASSETS.fetch(req);
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    headers.set('X-Frame-Options','DENY');
    headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'self'");
    return new Response(response.body,{status:response.status,headers});
  }
};
