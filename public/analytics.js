/* Public site token only. No form values or signup identifiers are sent here. */
(() => {
  'use strict';
  const token = window.UNSTUCK_CONFIG?.WEB_ANALYTICS_TOKEN;
  if (typeof token !== 'string' || !/^[a-f0-9]{32}$/i.test(token)) return;
  if (document.querySelector('script[data-cf-beacon]')) return;
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({ token });
  document.head.appendChild(beacon);
})();
