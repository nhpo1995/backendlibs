const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('editor supports Tab, Shift-Tab and four-space Enter indentation', async ({ page }) => {
  await page.goto('/lessons/springboot/mvc-request-flow/index.html#bai-tap-code');
  const editor = page.locator('.cm-content');
  const value = page.locator('[data-editor] textarea');
  await editor.fill('class Example {');
  await editor.press('Control+End');
  await editor.press('Enter');
  await expect(value).toHaveValue('class Example {\n    ');
  await editor.press('Tab');
  await expect(value).toHaveValue('class Example {\n        ');
  await editor.press('Shift+Tab');
  await expect(value).toHaveValue('class Example {\n    ');
});

test('YAML and PowerShell editors indent with Enter and Tab', async ({ page }) => {
  for (const [slug, start] of [['boot-datasource', 'spring:'], ['nen-tang-http', 'function Check {']]) {
    await page.goto(`/lessons/springboot/${slug}/index.html#bai-tap-code`);
    const editor = page.locator('.cm-content');
    const value = page.locator('[data-editor] textarea');
    await editor.fill(start);
    await editor.press('Control+End');
    await editor.press('Enter');
    await expect(value, slug).toHaveValue(start + '\n    ');
    await editor.press('Tab');
    await expect(value, slug).toHaveValue(start + '\n        ');
    await editor.press('Shift+Tab');
    await expect(value, slug).toHaveValue(start + '\n    ');
  }
});

test('Enter indentation ignores punctuation in strings and comments', async ({ page }) => {
  for (const [slug, text, spaces] of [
    ['boot-datasource', 'spring: # datasource', 4],
    ['boot-datasource', 'message: "text:"', 0],
    ['nen-tang-http', 'Write-Output "{"', 0],
    ['nen-tang-http', '# {', 0],
    ['boot-datasource', '', 0],
  ]) {
    await page.goto(`/lessons/springboot/${slug}/index.html#bai-tap-code`);
    const editor = page.locator('.cm-content');
    await editor.fill(text);
    await editor.press('Control+End');
    await editor.press('Enter');
    await expect(page.locator('[data-editor] textarea')).toHaveValue(text + '\n' + ' '.repeat(spaces));
  }
});

test('starter uses TODO and old placeholder drafts get an actionable message', async ({ page }) => {
  await page.goto('/lessons/springboot/mvc-request-flow/index.html#bai-tap-code');
  const value = page.locator('[data-editor] textarea');
  await expect(value).not.toHaveValue(/throw new UnsupportedOperationException/);
  const lab = require('../content/springboot/course.json').lessons.find(x => x.slug === 'mvc-request-flow').lab;
  await page.locator('.cm-content').fill(lab.solution.replace('return service.find(id);', 'return service.find(id);\nthrow new UnsupportedOperationException();'));
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.code-check-feedback')).toContainText('Xóa dòng');
  await expect(page.locator('.code-check-feedback')).not.toHaveAttribute('data-code-check-result', 'match');
  await page.locator('.cm-content').fill(lab.solution);
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.code-check-feedback')).toHaveAttribute('data-code-check-result', 'match');
});

test('code check accepts formatting, rejects changed content and clears stale results', async ({ page }) => {
  const lab = require('../content/springboot/course.json').lessons.find(x => x.slug === 'mvc-request-flow').lab;
  await page.goto('/lessons/springboot/mvc-request-flow/index.html#bai-tap-code');
  const input = page.locator('[data-editor] .cm-content');
  const result = page.locator('.code-check-feedback');
  await input.fill(lab.solution.replace('return service.find(id);', 'return   service . find ( id ) ;').replaceAll('\n', '\n\n    '));
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
  await expect(result).toHaveAttribute('data-code-check-result', 'match');
  await expect(page.locator('.solution')).not.toHaveAttribute('open', '');
  await page.locator('[data-editor]').screenshot({ path: 'test-results/code-check-match.png' });
  await expect(page.locator('[data-complete]')).not.toBeChecked();
  await page.locator('[data-action="save"]').click();
  await expect(result).toHaveAttribute('data-code-check-result', 'match');
  await input.fill(lab.solution.replace('service.find(id)', 'null'));
  await expect(result).toBeEmpty();
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
  await expect(result).toHaveAttribute('data-code-check-result', 'different');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-action="reset"]').click();
  await expect(result).toBeEmpty();
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
  await expect(result).not.toHaveAttribute('data-code-check-result', 'match');
});

test('code check handles starter additions, YAML hierarchy and checklist exercises', async ({ page }) => {
  const course = require('../content/springboot/course.json');
  const lab = course.lessons.find(x => x.slug === 'security-authentication').lab;
  await page.goto('/lessons/springboot/security-authentication/index.html#bai-tap-code');
  await page.locator('.cm-content').fill(lab.starter.replace('// TODO: kiểm tra đúng và sai mật khẩu', 'boolean accepted = encoder.matches("demo-pass", hash);\nboolean rejected = encoder.matches("wrong", hash);'));
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.code-check-feedback')).toHaveAttribute('data-code-check-result', 'match');
  await page.goto('/lessons/springboot/boot-datasource/index.html#bai-tap-code');
  await page.locator('.cm-content').fill(course.lessons.find(x => x.slug === 'boot-datasource').lab.solution.replaceAll('  ', '    '));
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.code-check-feedback')).toHaveAttribute('data-code-check-result', 'match');
  await page.goto('/lessons/springboot/security-oauth2/index.html#bai-tap-code');
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.code-check-feedback')).toHaveAttribute('data-code-check-result', 'manual');
});

test('editing during comparator loading cannot show a stale pass', async ({ page }) => {
  await page.route('**/*codeComparison*', async route => { await new Promise(resolve => setTimeout(resolve, 700)); await route.continue(); });
  await page.goto('/lessons/springboot/mvc-request-flow/index.html#bai-tap-code');
  const lab = require('../content/springboot/course.json').lessons.find(x => x.slug === 'mvc-request-flow').lab;
  await page.locator('.cm-content').fill(lab.solution);
  await page.locator('[data-action="check"]').click();
  await page.locator('.cm-content').fill('return null;');
  await page.locator('[data-action="check"]').click();
  await expect(page.locator('.code-check-feedback')).toHaveAttribute('data-code-check-result', 'different');
});

test('home and catalog expand only the selected topic in place', async ({ page }) => {
  for (const path of ['/', '/lessons/springboot/index.html']) {
    await page.goto(path);
    const core = page.getByRole('button', { name: /^Spring Core/ });
    const security = page.getByRole('button', { name: /^Spring Security/ });
    await expect(page.locator('[data-lesson-card]:visible')).toHaveCount(0);
    const url = page.url();
    await core.press('Enter');
    await expect(core).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-module="core"] [data-lesson-card]').first()).toBeVisible();
    await expect(page.locator('[data-module]:visible')).toHaveCount(1);
    await expect(page).toHaveURL(url);
    await security.click();
    await expect(core).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-module="security"] [data-lesson-card]').first()).toBeVisible();
    await expect(page.locator('[data-module]:visible')).toHaveCount(1);
    await security.click();
    await expect(page.locator('[data-lesson-card]:visible')).toHaveCount(0);
    await expect(page).toHaveURL(url);
    await core.click();
    await page.locator('[data-lesson-card][data-slug="ioc-container"]').click();
    await expect(page).toHaveURL(/ioc-container\/index\.html$/);
  }
});

test('existing module URLs survive reload and history', async ({ page }) => {
  await page.goto('/lessons/springboot/modules/core/index.html');
  await expect(page.locator('[data-module]')).toHaveCount(1);
  await expect(page.locator('[data-module]')).toHaveAttribute('id', 'core');
  await page.reload();
  await expect(page.locator('[data-module]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Spring Security', exact: true }).click();
  await expect(page).toHaveURL(/\/modules\/security\/index\.html$/);
  await expect(page.locator('[data-module]')).toHaveAttribute('id', 'security');
  await page.goBack();
  await expect(page.locator('[data-module]')).toHaveAttribute('id', 'core');
  await page.goto('/lessons/springboot/index.html#security');
  await expect(page).toHaveURL(/\/modules\/security\/index\.html$/);
  await expect(page.locator('[data-module]')).toHaveCount(1);
});

test('React retains legacy storage keys and flushes unsaved drafts on SPA navigation', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('backendlibs:draft:ioc-container:v1', 'class LegacyDraft {}');
      localStorage.setItem('backendlibs:complete:ioc-container', 'true');
      sessionStorage.setItem('seeded', 'true');
    }
  });
  await page.goto('/lessons/springboot/ioc-container/index.html');
  await expect(page.locator('[data-editor] textarea')).toHaveValue('class LegacyDraft {}');
  await expect(page.locator('[data-complete]')).toBeChecked();
  await page.locator('.cm-content').fill('class UnsavedDraft {}');
  await page.evaluate(() => { window.spaMarker = 'kept'; });
  await page.locator('.lesson-navigation a').last().click();
  await expect(page.locator('h1')).toHaveText('Thiết kế trách nhiệm và SOLID');
  expect(await page.evaluate(() => window.spaMarker)).toBe('kept');
  await page.goBack();
  await expect(page.locator('[data-editor] textarea')).toHaveValue('class UnsavedDraft {}');
});

test('directory bookmarks retain query and anchor for lessons and old aliases', async ({ page }) => {
  await page.goto('/lessons/springboot/ioc-container/?from=bookmark#bai-tap-code');
  await expect(page).toHaveURL(/ioc-container\/index\.html\?from=bookmark#bai-tap-code$/);
  await expect(page.locator('h1')).toHaveText('IoC container và đồ thị dependency');
  await page.goto('/lessons/springboot/buoi-06/?from=bookmark#moc-video');
  await expect(page).toHaveURL(/dto-contracts\/index\.html\?from=bookmark#moc-video$/);
  await expect(page.locator('#moc-video')).toBeAttached();
});

test('deep link waits for slow article data and malformed fragments do not crash', async ({ page }) => {
  await page.route('**/generated/lessons/ioc-container.json*', async route => {
    await new Promise(resolve => setTimeout(resolve, 3500));
    await route.continue();
  });
  await page.goto('/lessons/springboot/ioc-container/index.html#bai-tap-code');
  const target = page.locator('#bai-tap-code');
  await expect(target).toBeAttached();
  await expect.poll(async () => (await target.boundingBox()).y).toBeLessThan(100);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/lessons/springboot/ioc-container/index.html#%E0%A4%A');
  await expect(page.locator('h1')).toHaveText('IoC container và đồ thị dependency');
  expect(errors).toEqual([]);
});

test('learner types directly into a highlighted editor without a separate preview', async ({ page }) => {
  await page.goto('/lessons/springboot/security-authentication/index.html#bai-tap-code');
  const editor = page.locator('[data-editor]');
  const input = editor.locator('.cm-content');
  await expect(input).toBeVisible();
  await expect(editor.getByText('Xem mã của bạn với màu cú pháp', { exact: true })).toHaveCount(0);
  await editor.screenshot({ path: 'test-results/direct-editor-desktop.png' });
  await input.fill('String message = "Xin chào";\n// ghi chú');
  await expect(editor.locator('textarea')).toHaveValue('String message = "Xin chào";\n// ghi chú');
  const stringToken = input.locator('span').filter({ hasText: /^"Xin chào"$/ }).last();
  await expect(stringToken).toBeVisible();
  expect(await stringToken.evaluate(el => getComputedStyle(el).color)).not.toBe(await input.evaluate(el => getComputedStyle(el).color));
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await editor.screenshot({ path: 'test-results/direct-editor-mobile.png' });
});

test('direct editor highlights YAML and PowerShell and scrolls long documents', async ({ page }) => {
  for (const slug of ['boot-configuration', 'nen-tang-http']) {
    await page.goto(`/lessons/springboot/${slug}/index.html#bai-tap-code`);
    const input = page.locator('[data-editor] .cm-content');
    await expect(input).toBeVisible();
    expect(await input.evaluate(el => [...el.querySelectorAll('span')].some(span => getComputedStyle(span).color !== getComputedStyle(el).color))).toBe(true);
  }
  const input = page.locator('[data-editor] .cm-content');
  const longDocument = Array.from({ length: 100 }, (_, i) => `$value${i} = "${'x'.repeat(180)}"`).join('\n');
  await input.fill(longDocument);
  const scroller = page.locator('[data-editor] .cm-scroller');
  expect(await scroller.evaluate(el => el.scrollHeight > el.clientHeight && el.scrollWidth > el.clientWidth)).toBe(true);
  await scroller.evaluate(el => { el.scrollTop = 150; el.scrollLeft = 100; });
  expect(await scroller.evaluate(el => el.scrollTop > 0 && el.scrollLeft > 0)).toBe(true);
  await expect(page.locator('[data-editor] textarea')).toHaveValue(longDocument);
});

test('missing editor bundle leaves the original editable control usable', async ({ page }) => {
  await page.route('**/*editor-entry*', route => route.abort());
  await page.goto('/lessons/springboot/ioc-container/index.html');
  const input = page.locator('[data-editor] textarea');
  await expect(page.locator('.editor-status')).toContainText('Chưa tải được màu cú pháp');
  await expect(input).toBeVisible();
  await input.fill('class FallbackDraft {}');
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('.editor-status')).toContainText('Đã lưu');
});

test('search handles Vietnamese without accents and reports empty results', async ({ page }) => {
  await page.goto('/lessons/springboot/index.html');
  await page.locator('[data-search]').fill('phan quyen');
  await expect(page.locator('[data-lesson-card]:visible')).not.toHaveCount(0);
  await page.locator('[data-search]').fill('khong-co-bai-nay-xyz');
  await expect(page.locator('[data-lesson-card]:visible')).toHaveCount(0);
  await expect(page.locator('[data-search-status]')).toContainText('Không tìm thấy');
  await page.locator('[data-search]').clear();
  await expect(page.locator('[data-lesson-card]:visible')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Spring Core/ })).toBeVisible();
});

test('editor persists draft, escapes HTML, downloads and protects reset', async ({ page }) => {
  await page.goto('/lessons/springboot/ioc-container/index.html');
  const textarea = page.locator('[data-editor] textarea');
  const starter = await textarea.inputValue();
  const draft = '// <img src=x onerror="window.injected=1">\nclass MyDraft {}';
  await page.locator('[data-editor] .cm-content').fill(draft);
  await page.locator('[data-action="save"]').click();
  await page.reload();
  await expect(textarea).toHaveValue(draft);
  await expect(page.locator('[data-editor] .cm-content')).toContainText('MyDraft');
  await expect(page.locator('[data-editor] .cm-content img')).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-action="download"]').click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('Exercise.java');
  const fs = require('node:fs');
  expect(fs.readFileSync(await download.path(), 'utf8')).toBe(draft);
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('[data-action="reset"]').click();
  await expect(textarea).toHaveValue(draft);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-action="reset"]').click();
  await expect(textarea).toHaveValue(starter);
  await page.reload();
  await expect(textarea).toHaveValue(starter);
});

test('quiz explains answers; completion appears in catalog', async ({ page }) => {
  await page.goto('/lessons/springboot/ioc-container/index.html');
  await page.getByText('Ôn nhanh bằng trắc nghiệm', { exact: true }).click();
  await page.locator('[data-quiz] button').click();
  await expect(page.locator('[data-feedback]')).toContainText('Chọn');
  await page.locator('[data-quiz] input[value="0"]').check();
  await page.locator('[data-quiz] button').click();
  await expect(page.locator('[data-feedback]')).toContainText('Chưa đúng');
  await page.locator('[data-quiz] input[value="1"]').check();
  await page.locator('[data-quiz] button').click();
  await expect(page.locator('[data-feedback]')).toContainText('Đúng');
  await page.locator('[data-complete]').check();
  await page.goto('/lessons/springboot/index.html');
  await page.getByRole('button', { name: /^Spring Core/ }).click();
  await expect(page.locator('[data-slug="ioc-container"] .lesson-state')).toHaveText('✓');
  await expect(page.locator('[data-course-progress]')).toContainText('1 / ' + require('../content/springboot/course.json').lessons.length);
});

test('closing an unchanged old tab cannot overwrite another tab draft', async ({ page, context }) => {
  await page.goto('/lessons/springboot/ioc-container/index.html');
  const second = await context.newPage();
  await second.goto('/lessons/springboot/ioc-container/index.html');
  await second.locator('[data-editor] .cm-content').fill('class NewerDraft {}');
  await second.locator('[data-action="save"]').click();
  await page.goto('/lessons/springboot/index.html');
  expect(await second.evaluate(() => localStorage.getItem('backendlibs:draft:ioc-container:v1'))).toBe('class NewerDraft {}');
  await second.reload();
  await expect(second.locator('[data-editor] textarea')).toHaveValue('class NewerDraft {}');
});

test('storage and clipboard failures leave usable controls', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    Object.defineProperty(navigator, 'clipboard', { get() { throw new Error('blocked'); } });
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/lessons/springboot/ioc-container/index.html');
  await page.locator('[data-editor] .cm-content').fill('// available without storage');
  await page.locator('[data-action="save"]').click();
  await expect(page.locator('.editor-status')).toContainText('Tải mã');
  await page.locator('.copy').first().click();
  await expect(page.locator('.copy').first()).toContainText('Ctrl/Cmd+C');
  await page.locator('[data-complete]').check();
  await expect(page.locator('[data-progress-status]')).toContainText('không lưu');
  expect(errors).toEqual([]);
});

test('highlight is offline, code copy matches text and mobile has no page overflow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/lessons/springboot/security-authentication/index.html');
  await expect(page.locator('pre code .token').first()).toBeAttached();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copiedCode = text; } }, configurable: true });
  });
  const expectedCode = await page.locator('.snippet code').first().textContent();
  await page.locator('.copy').first().click();
  expect(await page.evaluate(() => window.copiedCode)).toBe(expectedCode);
  await expect(page.locator('.copy').first()).toHaveText('Đã sao chép');
  await expect(page.locator('.solution')).not.toHaveAttribute('open', '');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/security-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/security-desktop.png', fullPage: true });
  await page.goto('/lessons/springboot/ioc-container/index.html');
  await expect(page.locator('pre code .token').first()).toBeAttached();
  await page.locator('[data-editor] .cm-content').fill('class FileMode {}');
  await expect(page.locator('[data-editor] textarea')).toHaveValue('class FileMode {}');
  await expect(page.locator('[data-editor] .cm-content span').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('catalog and practice work on mobile and downloads are real archives', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/lessons/springboot/index.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/catalog-mobile.png', fullPage: false });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/catalog-desktop.png', fullPage: false });
  await page.goto('/practice/spring-foundations/index.html');
  await expect(page.locator('h1')).toHaveText('Project thực hành Spring Foundations');
  const contrast = await page.locator('.lead').evaluate(element => {
    const linear = n => { n /= 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; };
    const luminance = color => {
      const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(linear);
      return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    };
    const foreground = luminance(getComputedStyle(element).color);
    const background = luminance(getComputedStyle(document.body).backgroundColor);
    return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Tải starter ZIP', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('spring-foundations-starter.zip');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/practice-mobile.png', fullPage: false });
});

test('authorization walkthrough distinguishes request permission from group ownership', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/lessons/springboot/security-authorization/index.html#mo-phong-phan-quyen');
  const walkthrough = page.locator('#mo-phong-phan-quyen');
  const result = walkthrough.locator('#authorization-outcome');
  for (const [name, expected] of [
    ['Reader đọc nhóm', 'Controller tiếp tục'],
    ['Reader gửi lời mời', 'Dừng ở @PreAuthorize'],
    ['Owner khác nhóm gửi lời mời', 'thuộc owner-backend'],
    ['Owner của nhóm gửi lời mời', 'tiếp tục kiểm tra nghiệp vụ'],
  ]) {
    await walkthrough.getByRole('button', { name, exact: true }).click();
    await expect(result).toBeHidden();
    await walkthrough.getByRole('button', { name: 'Xem quyết định' }).click();
    await expect(result).toBeVisible();
    await expect(result).toContainText(expected);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('#bai-tap-code .cm-content')).toBeVisible();
});

test('security call graphs expose framework methods, branches and highlighted code', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [slug, component, method] of [
    ['security-authentication', 'PasswordEncoder', 'matches('],
    ['security-authorization', 'AuthorizationManagerBeforeMethodInterceptor', '@PreAuthorize'],
    ['security-session-csrf', 'CsrfFilter', 'MissingCsrfTokenException'],
    ['security-lab', 'AuthorizationFilter', 'hasRole("ADMIN")'],
    ['security-oauth2', 'JwtDecoder', 'decode('],
  ]) {
    await page.goto(`/lessons/springboot/${slug}/index.html`);
    const graph = page.locator('.security-call-graph');
    if (slug === 'security-authentication') {
      await expect(page.locator('#flow .security-call-graph')).toBeVisible({ timeout: 4000 });
      await expect(graph).toContainText('GET /api/groups');
      await expect(page.locator('#authentication-decisions a[download]')).toHaveAttribute('href', /spring-foundations-solution\.zip$/);
      await expect(page.locator('#authentication-decisions .snippet').first()).toContainText('mvn spring-boot:run');
    }
    await graph.getByRole('button', { name: component, exact: true }).click({ timeout: 4000 });
    const inspector = graph.locator('.security-call-inspector');
    await expect(inspector.getByRole('heading', { name: component, exact: true })).toBeVisible();
    await expect(inspector.locator('code.language-java')).toContainText(method);
    await expect(inspector.locator('code .token').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('all topic lessons render on mobile without runtime errors or overflow', async ({ page }) => {
  test.setTimeout(90000);
  const course = require('../content/springboot/course.json');
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const lesson of course.lessons) {
    const response = await page.goto(`/lessons/springboot/${lesson.slug}/index.html`);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText(lesson.title);
    await expect(page.locator('.exercise-instructions')).toContainText(lesson.lab.instructions);
    const simulationId = {
      'bean-validation': 'mo-phong-validation',
      'security-authorization': 'mo-phong-phan-quyen',
    }[lesson.slug] || 'mo-phong-bai-hoc';
    const simulation = page.locator('#' + simulationId);
    await expect(simulation).toBeVisible();
    const simulationTocId = lesson.slug === 'security-authentication' ? 'flow' : simulationId;
    await expect(page.locator('.sidebar a[href="#' + simulationTocId + '"]')).toHaveCount(1);
    if (lesson.module === 'security') {
      await expect(page.locator('.security-call-graph')).toBeVisible();
    } else if (simulationId === 'mo-phong-bai-hoc') {
      await expect(simulation.locator('.lesson-walkthrough-stages button')).toHaveCount(3);
      const result = simulation.getByRole('status');
      await expect(result).toContainText('Dự đoán');
      await simulation.getByRole('button', { name: 'Xem kết quả mô phỏng', exact: true }).click();
      await expect(result).not.toContainText('Dự đoán kết quả của bước này');
      await simulation.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
      await expect(simulation.locator('[aria-current="step"]')).toContainText('2');
      await expect(result).toContainText('Dự đoán');
    }
    const cases = page.locator('#kiem-tra-nang-luc .understanding-case');
    await expect(cases).toHaveCount(2);
    for (const [index, item] of lesson.understanding.entries()) {
      const card = cases.nth(index);
      const disclosure = card.locator('details');
      await expect(card.getByRole('heading')).toHaveText(item.title);
      await expect(disclosure).not.toHaveAttribute('open');
      await disclosure.locator('summary').click();
      await expect(disclosure).toContainText(item.answer);
      await expect(disclosure.getByText(item.criterion, { exact: false })).toBeVisible();
    }
    await page.locator('.cm-content').waitFor();
    await page.locator('[data-action="check"]').click();
    const feedback = page.locator('.code-check-feedback');
    await expect(feedback).toHaveAttribute('data-code-check-result', lesson.lab.comparison === 'manual' ? 'manual' : /^(?!match$).+/);
    await page.locator('.cm-content').fill(lesson.lab.solution.replaceAll('\n', '\n\n'));
    await page.locator('[data-action="check"]').click();
    await expect(feedback).toHaveAttribute('data-code-check-result', lesson.lab.comparison === 'manual' ? 'manual' : 'match');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), lesson.slug).toBe(true);
  }
  expect(errors).toEqual([]);
});
