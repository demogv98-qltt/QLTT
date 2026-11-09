import {createRequire} from 'node:module';
const require = createRequire('/root/.claude/skills/teardown/node_modules/x.js');
const {chromium} = require('playwright');
const [file, out, shotsJson] = process.argv.slice(2);
const shots = JSON.parse(shotsJson);
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox']});
const page = await browser.newPage({viewport: {width: 1600, height: 900}});
const errs = []; page.on('console', (m) => m.type() === 'error' && errs.push(m.text())); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto('file://' + file);
try { await page.waitForFunction(() => window.S3 && window.S3.shown, null, {timeout: 40000}); } catch (e) { console.log('NOT SHOWN', JSON.stringify(errs), await page.evaluate(() => window.S3 ? JSON.stringify(window.S3.errors) : 'undef')); await browser.close(); process.exit(1); }
for (const [name, o] of shots) {
  await page.evaluate((o) => window.S3.pose(o), o); await page.waitForTimeout(o.wait ?? 2500);
  await page.screenshot({path: `${out}/${name}.png`});
  console.log(name, JSON.stringify(await page.evaluate(() => { const r = window.S3.readout(); return {hr: r.hr, ph: r.ph.id, vol: +r.vol.toFixed(1), tier: window.S3.tier}; })));
}
console.log('errors:', JSON.stringify([...errs, ...(await page.evaluate(() => window.S3.errors))]));
await browser.close();
