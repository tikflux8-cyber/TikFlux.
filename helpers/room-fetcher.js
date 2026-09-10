const puppeteer = require('puppeteer-core');

async function getRoomInfo(uniqueId) {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    
    console.error(`[Helper] Fetching TikTok page for @${uniqueId}...`);
    await page.goto(`https://www.tiktok.com/@${uniqueId}/live`, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    const cookies = await page.cookies();
    const ttwidCookie = cookies.find(c => c.name === 'ttwid');
    const ttwid = ttwidCookie ? ttwidCookie.value : null;
    console.error(`[Helper] ttwid: ${ttwid ? 'found (' + ttwid.substring(0,30) + '...)' : 'not found'}`);
    
    const roomId = await page.evaluate(() => {
      const sigiEl = document.getElementById('SIGI_STATE');
      if (sigiEl) {
        try {
          const data = JSON.parse(sigiEl.textContent);
          const str = JSON.stringify(data);
          const m = str.match(/"roomId"\s*:\s*"(\d+)"/);
          if (m) return m[1];
        } catch(e) {}
      }
      const nextEl = document.getElementById('__NEXT_DATA__');
      if (nextEl) {
        try {
          const data = JSON.parse(nextEl.textContent);
          const str = JSON.stringify(data);
          const m = str.match(/"roomId"\s*:\s*"(\d+)"/);
          if (m) return m[1];
        } catch(e) {}
      }
      try {
        const scripts = document.querySelectorAll('script');
        for (const s of scripts) {
          const text = s.textContent || '';
          const m = text.match(/"roomId"\s*:\s*"(\d+)"/);
          if (m) return m[1];
        }
      } catch(e) {}
      const html = document.documentElement.innerHTML;
      let m1 = html.match(/roomId['"\\s]*[:=]['"\\s]*(\d{15,})/);
      if (m1) return m1[1];
      let m2 = html.match(/room_id['"\\s]*[:=]['"\\s]*(\d{15,})/);
      if (m2) return m2[1];
      return null;
    });
    
    console.error(`[Helper] roomId: ${roomId || 'not found (user may not be live)'}`);
    
    const clusterRegion = await page.evaluate(() => {
      const html = document.documentElement.innerHTML;
      const m = html.match(/"clusterRegion"\s*:\s*"([^"]+)"/);
      return m ? m[1] : '';
    });
    
    return { ttwid, roomId, clusterRegion };
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const uniqueId = process.argv[2] || 'charlidamelio';
  getRoomInfo(uniqueId)
    .then(result => { console.log(JSON.stringify(result)); process.exit(0); })
    .catch(err => { console.error('Error:', err.message); process.exit(1); });
}

module.exports = { getRoomInfo };
