const puppeteer = require('puppeteer-core');
async function find() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  await page.goto('https://www.tiktok.com/live', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  const content = await page.content();
  const matches = [...content.matchAll(/\"uniqueId\":\"([^\"]+)\"/g)];
  const seen = new Set();
  const users = [];
  for (const m of matches) {
    if (!seen.has(m[1]) && m[1].length > 2 && !m[1].includes('tiktok')) {
      seen.add(m[1]);
      users.push(m[1]);
    }
  }
  await browser.close();
  return users.slice(0, 15);
}
find().then(u => { console.log(JSON.stringify(u)); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
