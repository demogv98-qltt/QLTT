import {createRequire} from 'node:module';
const require = createRequire('/root/.claude/skills/teardown/node_modules/x.js');
const {chromium} = require('playwright');
const out = process.argv[2];
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox']});
const page = await browser.newPage({viewport: {width: 1600, height: 900}});
const errs = []; page.on('console', (m) => m.type() === 'error' && errs.push(m.text())); page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto('file:///home/user/QLTT/teardown-out/dist/vl10-m5.html');
await page.waitForFunction(() => window.M5 && window.M5.shown, null, {timeout: 30000});
const txt = () => page.evaluate(() => document.querySelector('#lesson').innerText.replace(/\n+/g, ' ¦ ').slice(0, 230));
const slide = (id, v) => page.evaluate(([id, v]) => { const s = document.querySelector('#s-' + id); s.value = v; s.dispatchEvent(new Event('input', {bubbles: true})); }, [id, v]);
const wait = (ms = 900) => page.waitForTimeout(ms);
await page.screenshot({path: out + '/L5-intro.png'});
console.log('INTRO:', await txt());
await page.click('#start'); await wait();
console.log('B1 (chờ, mô hình bị xáo):', await txt());
// bước 1: làm đúng
await slide('F1', 3); await slide('F2', 4); await slide('al', 90); await wait(1500);
console.log('B1 xong?:', (await txt()).includes('✔') ? 'CÓ' : 'KHÔNG', '|', await txt());
await page.click('#next'); await wait();
// bước 2 predict: nhập sai rồi đúng
await page.fill('#ans', '7'); await page.click('#chk'); await wait(300);
console.log('B2 sai (7):', (await txt()).includes('Chưa khớp') ? 'báo chưa khớp ✔' : await txt());
await page.fill('#ans', '5,0'); await page.click('#chk'); await wait(300);
console.log('B2 đúng (5,0):', (await txt()).includes('Đúng rồi') ? 'báo đúng ✔' : await txt());
await page.click('#next'); await wait();
await slide('al', 0); await wait(1800); console.log('B3 α=0:', (await txt()).includes('✔') ? 'xong ✔' : await txt()); await page.click('#next'); await wait();
await slide('al', 180); await wait(1800); console.log('B4 α=180:', (await txt()).includes('✔') ? 'xong ✔' : await txt()); await page.click('#next'); await wait();
await page.fill('#ans', '6'); await page.click('#chk'); await wait(400); console.log('B5 (6):', (await txt()).includes('Đúng rồi') ? 'đúng ✔' : await txt()); await page.click('#next'); await wait();
await page.click('#b-td'); await wait(6000); console.log('B6 teardown:', (await txt()).includes('✔') ? 'xong ✔' : 'chưa: ' + await txt()); await page.screenshot({path: out + '/L5-b6.png'}); await page.click('#next'); await wait();
await page.fill('#ans', '5'); await page.click('#chk'); await wait(400); console.log('B7 (5 cm):', (await txt()).includes('Đúng rồi') ? 'đúng ✔' : await txt()); await page.click('#next'); await wait();
await page.click('#tabP'); await slide('F', 10); await slide('beta', 37); await wait(1800); console.log('B8 phân tích:', (await txt()).includes('✔') ? 'xong ✔' : await txt()); await page.click('#next'); await wait();
await page.fill('#ans', '5'); await page.click('#chk'); await wait(500); console.log('B9 (5 N):', (await txt()).includes('Đúng rồi') ? 'đúng ✔' : await txt());
await page.screenshot({path: out + '/L5-b9.png'}); await page.click('#next'); await wait();
// quiz: chọn đáp án theo cấu hình (2,1,1,1,1) và thử 1 câu sai
const ans = [2, 1, 1, 1, 1]; let q = 0;
for (const a of ans) { const pick = q === 2 ? 0 : a; await page.click(`.opt[data-k="${pick}"]`); await wait(200); if (q === 2) console.log('Q3 chọn sai:', (await txt()).includes('Chưa đúng') ? 'báo sai + giải thích ✔' : await txt()); await page.click('#qnext'); await wait(300); q++; }
console.log('KẾT QUẢ:', await txt()); await page.screenshot({path: out + '/L5-end.png'});
console.log('errors:', JSON.stringify([...errs, ...(await page.evaluate(() => window.M5.errors))]));
await browser.close();
