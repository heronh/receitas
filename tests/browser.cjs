// npm install; npx playwright install chromium; npm run test:browser
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const output = process.env.SCREENSHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'receitas-qa-'));
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
  try {
    await page.goto(url);
    assert.equal(await page.locator('[data-receita]').count(), 22);
    assert.equal(await page.locator('[data-card]').count(), 22);
    assert.equal(await page.locator('#contagem').innerText(), '22 receitas');
    await page.locator('.card[href="#aveia-assada-maca"]').click();
    await page.locator('#aveia-assada-maca .variacao__nome').waitFor();
    assert.equal(await page.locator('#aveia-assada-maca .variacao__nome').innerText(), 'Cookies de aveia, maçã e canela');
    assert.equal(await page.locator('a[href="https://www.youtube.com/watch?v=FxgVCAD6KyE"]').count(), 1);
    await page.locator('#bolo-aveia-cacau-banana h2').waitFor();
    await page.locator('#pao-aveia-iogurte-grego h2').waitFor();
    await page.getByRole('button', { name: 'Recentes', exact: true }).click();
    assert.equal(await page.locator('[data-card]:visible').count(), 5);
    await page.getByRole('button', { name: 'Todas', exact: true }).click();
    const anchors = await page.locator('.card').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
    for (const anchor of anchors) {
      await page.locator(`.card[href="${anchor}"]`).click();
      const box = await page.locator(anchor).boundingBox();
      const header = await page.locator('#topo').boundingBox();
      assert.ok(box.y >= header.height - 1, `${anchor}: título coberto pelo cabeçalho`);
    }
    await page.getByRole('button', { name: 'Pratos principais', exact: true }).click();
    assert.equal(await page.locator('[data-card]:visible').count(), 6);
    assert.equal(await page.locator('[data-receita]:visible').count(), 6);
    await page.locator('#busca').fill('SALMAO');
    assert.equal(await page.locator('[data-receita]:visible').count(), 1);
    await page.locator('#busca').fill('ingredienteinexistente');
    assert.ok(await page.locator('#vazio').isVisible());
    assert.equal(await page.locator('[data-card]:visible').count(), 0);
    // Um link direto deve abrir a receita mesmo que o filtro anterior a esconda.
    await page.evaluate(() => { location.hash = '#wrap-cottage-ovos'; });
    await page.waitForFunction(() => !document.querySelector('#wrap-cottage-ovos').hidden);
    assert.equal(await page.locator('#busca').inputValue(), '');
    assert.equal(await page.locator('[data-receita]:visible').count(), 22);
    await page.getByRole('button', { name: 'Vegana', exact: true }).click();
    assert.equal(await page.locator('[data-card]:visible').count(), 4);
    await page.getByRole('button', { name: 'Todas', exact: true }).click();
    const compras = page.locator('[data-compras="pao-linhaca"]');
    const first = compras.locator('input[type=checkbox]').first();
    const marked = await first.getAttribute('data-item');
    await first.check();
    await page.reload();
    assert.ok(await first.isChecked());
    assert.match(await compras.locator('[data-progresso]').innerText(), /^1 de /);
    await compras.getByRole('button', { name: 'Copiar lista', exact: true }).click();
    let copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(copied.includes('Rendimento:'));
    assert.ok(!copied.includes(marked), 'a cópia deve omitir o item já comprado');
    await compras.getByRole('button', { name: 'Limpar marcações', exact: true }).click();
    assert.ok(!await first.isChecked());
    await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
    await compras.getByRole('button', { name: 'Compartilhar', exact: true }).click();
    copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(copied.includes(marked), 'compartilhar deve copiar a lista quando não há Web Share');
    await page.evaluate(() => { localStorage.setItem('receitas:compras:v1', '{"pao-linhaca":42}'); location.hash = '#%E0%A4%A'; });
    await page.reload();
    assert.equal(await page.locator('[data-receita]').count(), 22);
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id));
    assert.equal(new Set(ids).size, ids.length, 'IDs duplicados');
    await page.evaluate(() => { history.replaceState(null, '', '/'); scrollTo(0, 0); });
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    await page.locator('.card[href="#pao-linhaca"]').click();
    await page.screenshot({ path: path.join(output, 'receita-desktop.png') });
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => scrollTo(0, 0));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow em ${width}px`);
      await page.screenshot({ path: path.join(output, `largura-${width}.png`) });
      await page.locator('.card[href="#pao-linhaca"]').click();
      await page.screenshot({ path: path.join(output, `receita-${width}.png`) });
      assert.ok(await page.evaluate(() => [...document.images].every(i => !i.complete || i.naturalWidth > 0)), 'imagem quebrada');
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: path.join(output, 'escuro.png') });
    // O teclado alcança os controles principais e há foco visível.
    await page.evaluate(() => { document.activeElement.blur(); scrollTo(0, 0); });
    await page.locator('#busca').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Todas');
    assert.deepEqual(errors, []);
    console.log('PASS: 22 âncoras; filtros; busca sem acentos; estado vazio; link direto; compras persistentes; copiar/compartilhar/limpar; armazenamento inválido; 320/390/768/1280px; modo escuro; teclado; nenhum erro de página.');
    console.log(`Capturas: ${output}`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
