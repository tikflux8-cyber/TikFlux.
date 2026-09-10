const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const liveUsers = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('live') || url.includes('webcast')) {
      try {
        const text = await response.text();
        const matches = text.matchAll(/"uniqueId"\s*:\s*"([^"]+)"/g);
        for (const m of matches) {
          if (!liveUsers.includes(m[1]) && m[1].length > 2) liveUsers.push(m[1]);
        }
      } catch {}
    }
  });
  
  await page.goto('https://www.tiktok.com/live', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  const html = await page.content();
  const idMatches = html.matchAll(/"uniqueId"\s*:\s*"([^"]+)"/g);
  for (const m of idMatches) {
    if (!liveUsers.includes(m[1]) && m[1].length > 2 && m[1] !== 'tiktok') liveUsers.push(m[1]);
  }
  
  await browser.close();
  console.log(JSON.stringify([...new Set(liveUsers)].slice(0, 15)));
})();
