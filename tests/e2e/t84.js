/* Audit de l'ordre : toute colonne de dates doit être croissante (du plus ancien au plus récent) */
const { chromium } = require('playwright'); const L = require('./lib.js');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1500, height: 1300 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const bad = {};
  const scan = async (label) => {
    const res = await p.evaluate(() => { const out = []; document.querySelectorAll('section:not([hidden]) table, #ov:not([hidden]) table').forEach(t => { if (!t.offsetParent) return; const rows = [...t.querySelectorAll('tbody tr')]; for (let c = 0; c < 3; c++) { const ds = rows.map(r => { const td = r.children[c]; const m = td && td.innerText.trim().match(/^(\d\d)\/(\d\d)\/(\d{4})/); return m ? m[3] + m[2] + m[1] : null; }).filter(Boolean); if (ds.length >= 3) { const asc = ds.every((x, i) => i === 0 || x >= ds[i - 1]); if (!asc) out.push({ col: c, n: ds.length, first: ds[0], last: ds[ds.length - 1], head: (t.querySelector('thead th') || {}).innerText }); break; } } }); return out; });
    res.forEach(r => { bad[label + ' col' + r.col + ' [' + r.head + '] ' + r.first + '…' + r.last + ' n=' + r.n] = 1; });
  };
  for (const r of ['dg', 'compta', 'ctrl', 'pdv']) {
    if (r !== 'dg') { await p.click('#role-chip'); await p.click('[data-setrole="' + r + '"]'); await p.waitForTimeout(250); }
    const items = await p.evaluate(() => [...document.querySelectorAll('#nav [data-k]')].map(b => [b.dataset.k, b.dataset.s || '']));
    for (const [k, s] of items) { await L.nav(p, k, s || undefined); await p.waitForTimeout(80); await scan(r + ' ' + k + ':' + s);
      const n = await p.locator('section:visible [role="tab"]:visible, section:visible .tabs button:visible').count();
      for (let i = 0; i < Math.min(n, 12); i++) { const t = p.locator('section:visible [role="tab"]:visible, section:visible .tabs button:visible').nth(i); try { const tx = (await t.innerText()).trim(); await t.click({ timeout: 2000 }); await p.waitForTimeout(60); await scan(r + ' ' + k + ':' + s + ' > ' + tx); } catch (e) {} }
      await L.nav(p, k, s || undefined); }
  }
  console.log(Object.keys(bad).join('\n') || 'AUCUNE colonne de dates décroissante'); await b.close();
})();
