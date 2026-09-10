const API_KEY = process.env.TIKTOK_API_KEY || '';

async function discoverLiveRooms() {
  // Use sign server to check multiple potential streamers
  const candidates = [
    'tiktok', 'zachking', 'addisonre', 'bellapoarch', 'charlidamelio',
    'khaby.lame', 'domelipa', 'lorengray', 'spencerx', 'jasonderulo',
    'brentsiverd', 'lizzo', 'badgalriri', 'postmalone', 'dojacat',
    'lilnasx', 'snoopdogg', 'kevinhart4real', 'markiplier', 'pewdiepie',
    'david dobrik', 'mr beast', 'nba youngboy', 'kyliejenner', 'kimkardashian',
    'therock', 'leomessi', 'cristiano', 'selenagomez', 'billieeilish',
    'shakira', 'miley cyrus', 'katyperry', 'arianagrande', 'taylorswift',
    'mariahcarey', 'elenadegeneres', 'jimmyfallon', 'stephencurry30',
    'lebron', 'kobebryant', 'nba', 'nfl', 'ufc', 'espn',
    'pokimane', 'ninjatfue', 'xqcow', 'sykkuno', 'valkyrae',
    'mizkif', 'hasanabi', 'adinross', 'kai cenat'
  ];
  
  // Check in parallel batches of 10
  const live = [];
  for (let i = 0; i < candidates.length; i += 10) {
    const batch = candidates.slice(i, i + 10);
    const results = await Promise.allSettled(batch.map(async (u) => {
      try {
        const r = await fetch('https://api.tik.tools/webcast/room_id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
          body: JSON.stringify({ unique_id: u }),
          signal: AbortSignal.timeout(5000)
        });
        const d = await r.json();
        if (d.data?.alive && d.data?.room_id) {
          return { uniqueId: u, roomId: d.data.room_id };
        }
      } catch {}
      return null;
    }));
    
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        live.push(r.value);
      }
    }
  }
  return live;
}

discoverLiveRooms().then(live => {
  console.log(JSON.stringify(live));
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
