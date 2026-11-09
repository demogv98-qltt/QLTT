import {createRequire} from 'node:module';
const require = createRequire('/root/.claude/skills/teardown/node_modules/x.js');
const {chromium} = require('playwright');
const [file, out, shotsJson] = process.argv.slice(2);
const shots = JSON.parse(shotsJson);
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox']});
const page = await browser.newPage({viewport: {width: 1600, height: 900}});
const errs = []; page.on('console', (m) => m.type() === 'error' && errs.push(m.text())); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto('file://' + file);
try { await page.waitForFunction(() => window.W2 && window.W2.shown, null, {timeout: 40000}); } catch (e) { console.log('NOT SHOWN', JSON.stringify(errs), await page.evaluate(() => window.W2 ? JSON.stringify(window.W2.errors) : 'undef')); await browser.close(); process.exit(1); }
for (const [name, o] of shots) {
  await page.evaluate((o) => window.W2.pose(o), o); await page.waitForTimeout(o.wait ?? 2500);
  await page.screenshot({path: `${out}/${name}.png`});
  console.log(name, JSON.stringify(await page.evaluate(() => { const r = window.W2.readout(); return {mode: r.mode, lam: +r.lam.toFixed(2), front: +r.front.toFixed(2), tier: window.W2.tier}; })));
}
console.log('errors:', JSON.stringify([...errs, ...(await page.evaluate(() => window.W2.errors))]));
await browser.close();
