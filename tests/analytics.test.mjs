import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const code = await readFile(new URL('../public/analytics.js', import.meta.url), 'utf8');
function page(token) {
  const scripts = [];
  const context = {
    window: { UNSTUCK_CONFIG: { WEB_ANALYTICS_TOKEN: token } },
    document: {
      querySelector(selector) {
        assert.equal(selector, 'script[data-cf-beacon]');
        return scripts.find(script => script.dataset.cfBeacon);
      },
      createElement(tag) { assert.equal(tag, 'script'); return { dataset: {} }; },
      head: { appendChild(script) { scripts.push(script); } },
    },
  };
  return { scripts, run() { runInNewContext(code, context); } };
}

test('analytics never loads without a valid public site token', () => {
  for (const token of [undefined, null, '', 'placeholder', '0'.repeat(31), 123]) {
    const browser = page(token);
    browser.run();
    assert.equal(browser.scripts.length, 0);
  }
});

test('analytics loads the official beacon once and passes only its public token', () => {
  const token = 'a'.repeat(32);
  const browser = page(token);
  browser.run();
  browser.run();
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.scripts[0].src, 'https://static.cloudflareinsights.com/beacon.min.js');
  assert.equal(browser.scripts[0].type, 'module');
  assert.deepEqual(JSON.parse(browser.scripts[0].dataset.cfBeacon), { token });
});

test('both pages load analytics after public configuration', async () => {
  for (const path of ['../public/index.html', '../public/privacidade/index.html']) {
    const html = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.equal((html.match(/src="\/analytics.js"/g) || []).length, 1);
    assert.ok(html.indexOf('src="/config.js"') < html.indexOf('src="/analytics.js"'));
  }
});
