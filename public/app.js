/* UI for two-step waitlist. No dependencies, no hidden tracking. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const config = window.UNSTUCK_CONFIG || {};
  const form = $('waitlist-form');
  const msg = $('form-message');
  const params = new URLSearchParams(location.search);
  const attr = {
    utm_source: (params.get('utm_source') || '').slice(0, 80),
    utm_medium: (params.get('utm_medium') || '').slice(0, 80),
    utm_campaign: (params.get('utm_campaign') || '').slice(0, 100),
    referrer: (document.referrer || '').slice(0, 250)
  };
  const state = { signup: null, captchaId: null };
  const showError = (text, type = 'error') => {
    msg.hidden = false; msg.textContent = text; msg.className = 'form-message ' + type;
    msg.focus();
  };
  const clearError = () => { msg.hidden = true; msg.textContent = ''; };
  function initTurnstile() {
    if (!config.TURNSTILE_SITE_KEY || !window.turnstile || state.captchaId !== null) return;
    state.captchaId = window.turnstile.render($('cf-turnstile'), {
      sitekey: config.TURNSTILE_SITE_KEY, action: 'waitlist_signup',
      'expired-callback': () => showError('Verification expired. Please complete it again.'),
      'error-callback': () => showError('Anti-bot verification failed to load. Please try again.')
    });
  }
  window.onTurnstileLoad = initTurnstile;
  initTurnstile();
  const resetTurnstile = () => { if (state.captchaId !== null && window.turnstile) window.turnstile.reset(state.captchaId); };
  function token() { return state.captchaId !== null && window.turnstile ? window.turnstile.getResponse(state.captchaId) || '' : ''; }
  async function post(url, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
      return { status: response.status, data: await response.json() };
    } finally { clearTimeout(timeout); }
  }
  function finish() {
    try { sessionStorage.removeItem('unstuck_signup'); } catch {}
    $('step2').hidden = true; form.hidden = true; $('success').hidden = false;
    $('success-text').focus();
  }
  function startStep2(role) {
    form.hidden = true;
    $('step2').hidden = false;
    document.querySelectorAll('[data-role-fields]').forEach(group => group.hidden = group.dataset.roleFields !== role);
    $('step2').querySelector('h2').focus();
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); clearError();
    const email = $('email').value.trim();
    const role = form.querySelector('input[name="role"]:checked')?.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Please enter a valid email address.');
    if (!$('consent').checked) return showError('Please accept the privacy notice to continue.');
    if (!config.TURNSTILE_SITE_KEY) return showError('Registration is not configured yet. The site owner must set up Turnstile.');
    if (!token()) return showError('Please complete the anti-bot verification.');
    const button = $('submit-btn'); button.disabled = true; button.textContent = 'Joining...';
    try {
      const {status, data} = await post('/api/subscribe', {email,role,consent:true,website:$('website').value,turnstileToken:token(),...attr});
      resetTurnstile();
      if (data.ok && data.duplicate) return showError('This address is already registered for this role.', 'ok');
      if (!data.ok) {
        if (status === 403 && data.error === 'captcha') return showError('Verification failed or expired. Please complete it again.');
        if (status === 503) return showError('Registration is not configured yet. Please try again later.');
        throw new Error(data.error || 'server');
      }
      state.signup = {id:data.id, token:data.token, role};
      try { sessionStorage.setItem('unstuck_signup', JSON.stringify(state.signup)); } catch {}
      startStep2(role);
    } catch { resetTurnstile(); showError('We could not save your registration. Please try again.'); }
    finally { button.disabled = false; button.textContent = 'Join the waitlist ↗'; }
  });
  $('profile-skip').addEventListener('click', finish);
  $('profile-save').addEventListener('click', async () => {
    if (!state.signup) return finish();
    const role = state.signup.role;
    const data = {...state.signup};
    if (role === 'buyer') {
      data.service = $('buyer-service').value; data.integration = $('buyer-integration').value;
      data.budget = $('buyer-budget').value; data.timeline = $('buyer-timeline').value;
      data.context_note = $('buyer-note').value.slice(0,500);
    } else {
      data.service = $('expert-service').value; data.integration = $('expert-integration').value;
      data.proof_url = $('expert-proof').value.trim().slice(0,200);
      data.availability = $('expert-availability').value; data.rate = $('expert-rate').value;
    }
    const button = $('profile-save'); button.disabled = true; button.textContent = 'Saving...'; clearError();
    try { const response = await post('/api/profile', data); if (!response.data.ok) throw new Error(); finish(); }
    catch { showError('Could not save these optional details. You can skip this step.'); }
    finally { button.disabled = false; button.textContent = 'Save details'; }
  });
  document.querySelectorAll('[data-choose-role]').forEach(link => link.addEventListener('click', () => {
    const selector = $('role-' + link.dataset.chooseRole);
    if (selector && !form.hidden) selector.checked = true;
  }));
  $('copy-link').addEventListener('click', async () => {
    const url = location.origin + '/?utm_source=share&utm_medium=referral&utm_campaign=early_access';
    try { await navigator.clipboard.writeText(url); $('copy-link').textContent = 'Copied'; }
    catch { $('share-fallback').hidden = false; $('share-url').value = url; $('share-url').select(); }
  });
  if (config.CONTACT_EMAIL) {
    const link = $('contact-link'); if (link) { link.hidden = false; link.href = 'mailto:' + config.CONTACT_EMAIL; }
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem('unstuck_signup') || 'null');
    if (saved && /^[a-f0-9-]{36}$/i.test(saved.id) && /^[a-f0-9]{64}$/.test(saved.token) && ['buyer','expert'].includes(saved.role)) {
      state.signup = saved; startStep2(saved.role);
    }
  } catch {}
})();
