const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');

(async () => {
  const root = path.resolve(__dirname, '../dist');
  const prefix = process.env.PUBLIC_BASE || '/';
  const files = fs.readdirSync(root, { recursive: true }).map(file => file.split(path.sep).join('/'));
  assert(!files.some(file => file.split('/').some(part => ['target', 'node_modules', '.git', '.env'].includes(part))), 'Private or generated Java files were packaged');
  assert(!files.includes('assets/site.js'), 'Legacy DOM script must not run alongside React');
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
    let target = path.resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html');
    if (!target.startsWith(root + path.sep)) { response.writeHead(404).end(); return; }
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.zip': 'application/zip' })[path.extname(target)] || 'text/plain');
    fs.createReadStream(target).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + prefix + 'lessons/springboot/mvc-request-flow/index.html#bai-tap-code');
    const lab = require('../content/springboot/course.json').lessons.find(x => x.slug === 'mvc-request-flow').lab;
    await page.locator('.cm-content').fill(lab.solution);
    await page.locator('[data-action="check"]').click();
    await page.locator('[data-code-check-result="match"]').waitFor();
    await page.goto(origin + prefix);
    await page.getByRole('button', { name: /^Spring Core/ }).click();
    await page.locator('[data-module="core"]:visible').waitFor();
    assert.equal(page.url(), origin + prefix);
    assert.equal(await page.locator('[data-module]:visible').count(), 1);
    await page.locator('[data-lesson-card][data-slug="ioc-container"]').click();
    await page.locator('.cm-content').fill('class ProductionDraft {}');
    await page.locator('[data-action="save"]').click();
    await page.reload();
    await page.locator('.cm-content').waitFor();
    assert.equal(await page.locator('[data-editor] textarea').inputValue(), 'class ProductionDraft {}');
    await page.goto(origin + prefix + 'lessons/springboot/index.html#security');
    await page.waitForURL('**/modules/security/index.html');
    await page.locator('[data-module]').waitFor();
    assert.equal(await page.locator('[data-module]').count(), 1);
    const course = require('../content/springboot/course.json');
    const routes = ['index.html', 'lessons/springboot/index.html', ...course.lessons.map(x => `lessons/springboot/${x.slug}/index.html`), ...Object.keys(course.aliases).map(slug => `lessons/springboot/${slug}/index.html`), ...course.modules.map(x => `lessons/springboot/modules/${x.id}/index.html`), 'practice/spring-foundations/index.html', 'practice/reference-directory/index.html'];
    for (const route of routes) {
      const response = await fetch(origin + prefix + route);
      assert.equal(response.status, 200, route);
      assert((await response.text()).includes('id="root"'), `Not a React entry: ${route}`);
    }
    for (const file of [
      'practice/spring-foundations/downloads/spring-foundations-starter.zip',
      'practice/spring-advanced-lab/downloads/spring-advanced-lab.zip',
      'practice/spring-demo-bundle/downloads/spring-demo-bundle.zip',
      'lessons/springboot/buoi-17/demo/pom.xml',
    ]) {
      const asset = await fetch(origin + prefix + file);
      assert.equal(asset.status, 200, file);
      if (file.endsWith('.zip')) assert.equal(Buffer.from(await asset.arrayBuffer()).subarray(0, 2).toString(), 'PK', file);
    }
    for (const [directory, title] of [['lessons/springboot/ioc-container/', 'IoC container và đồ thị dependency'], ['lessons/springboot/buoi-01/', 'Luồng request trong Spring Web MVC'], ['lessons/springboot/', course.title], ['practice/spring-foundations/', 'Project thực hành Spring Foundations'], ['lessons/springboot/modules/core/', 'Spring Core']]) {
      await page.goto(origin + prefix + directory);
      await page.locator('h1').waitFor();
      assert.equal(await page.locator('h1').textContent(), title, directory);
    }
    assert.deepEqual(errors, []);
    console.log(`PASS production ${prefix}: ${routes.length} real deep links, selected module, reload, draft, resources and no JS errors.`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
