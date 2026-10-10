/* v78 : Documents — devis, bons de commande, registre */
const { chromium } = require('playwright'); const L = require('./lib.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
  await ctx.route(/^(mailto:|https:\/\/wa\.me)/, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => { fails++; console.log('PAGEERR', e.message); });
  await p.goto('file://' + process.cwd() + '/socobo-menu.html'); await p.waitForTimeout(600);
  const txt = async s => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
  await L.nav(p, 'documents'); await p.waitForTimeout(300);
  ok(/Documents/.test(await txt('#view-docs h1')), 'page Documents');
  const tabs = await p.evaluate(() => [...document.querySelectorAll('#docs-tabs button')].map(x => x.textContent.trim()).join('|')); ok(tabs === 'Devis|Bons de commande|Registre', 'onglets (' + tabs + ')');
  ok(await p.locator('#docs-body tbody tr').count() >= 4, 'devis d’exemple');
  const th = await p.evaluate(() => [...document.querySelectorAll('#docs-body thead th')].map(x => x.textContent.trim()).join('|')); ok(th === 'N° de devis|Date|Client|Valable jusqu’au|Total TTC|État|Actions', 'colonnes devis');
  ok(/Expiré/.test(await txt('#docs-body tbody')), 'état Expiré calculé');
  // nouveau devis
  await p.click('[data-dnew="dev"]'); await p.waitForTimeout(250);
  const cid = await p.evaluate(() => [...document.querySelectorAll('#dv-c option')].find(o => /Atlas/.test(o.textContent)).value);
  await p.selectOption('#dv-c', cid); await p.selectOption('[data-dk="0"]', 'g8'); await p.waitForTimeout(150);
  const pu = await p.inputValue('[data-dp="0"]'); ok(pu !== '' && pu !== '0', 'prix du client proposé (' + pu + ')');
  await p.fill('[data-dq="0"]', '100'); await p.fill('[data-dp="0"]', '200'); await p.waitForTimeout(100);
  ok(/TTC : 20 000,00/.test(await txt('#dv-tot')), 'total TTC calculé (' + await txt('#dv-tot') + ')');
  await p.click('#dv-save'); await p.waitForTimeout(350);
  const sh = await txt('.paper'); ok(/DEVIS/.test(sh) && /DEV-2026-0005|DEV-2026-000\d/.test(sh) && /Bon pour accord/.test(sh), 'feuille du devis');
  const no = (sh.match(/DEV-2026-\d{4}/) || [''])[0]; console.log('numéro', no);
  await p.screenshot({ path: 's99a.png' });
  // envoi
  await p.click('#dc-send'); await p.waitForTimeout(250);
  ok(/Envoyer le devis/.test(await txt('#modal h2')) && /atlastravaux/.test(await p.inputValue('#ds-to')), 'fenêtre d’envoi : e-mail du client');
  await p.click('#ds-ch [data-ch="wa"]'); await p.waitForTimeout(100); ok(/06 61 22 41 10/.test(await p.inputValue('#ds-to')), 'WhatsApp : mobile du client');
  await p.click('#ds-go'); await p.waitForTimeout(400);
  ok(/Envoyé/.test(await txt('.pmute')) || /Envoyé/.test(await txt('#modal')), 'devis marqué Envoyé');
  await p.click('#dc-ok'); await p.waitForTimeout(300); ok(/Accepté/.test(await txt('#modal')), 'devis Accepté');
  await p.click('#dc-close'); await p.waitForTimeout(200);
  // supprimer brouillon libère le numéro
  await p.click('[data-dnew="dev"]'); await p.waitForTimeout(250); await p.selectOption('#dv-c', cid); await p.selectOption('[data-dk="0"]', 'sa'); await p.fill('[data-dq="0"]', '10'); await p.click('#dv-save'); await p.waitForTimeout(300);
  const no2 = (await txt('.paper')).match(/DEV-2026-\d{4}/)[0]; await p.click('#dc-del'); await p.waitForTimeout(200); await p.click('#cd-yes'); await p.waitForTimeout(300);
  await p.click('[data-dnew="dev"]'); await p.waitForTimeout(250); await p.selectOption('#dv-c', cid); await p.selectOption('[data-dk="0"]', 'sa'); await p.fill('[data-dq="0"]', '10'); await p.click('#dv-save'); await p.waitForTimeout(300);
  ok((await txt('.paper')).match(/DEV-2026-\d{4}/)[0] === no2, 'numéro de brouillon supprimé réutilisé (' + no2 + ')'); await p.click('#dc-close'); await p.waitForTimeout(200);
  // bons de commande
  await p.click('[data-dtab="bc"]'); await p.waitForTimeout(250);
  ok(await p.locator('#docs-body tbody tr').count() >= 3, 'bons de commande d’exemple');
  await p.click('[data-dnew="bc"]'); await p.waitForTimeout(250);
  const sid = await p.evaluate(() => [...document.querySelectorAll('#bc-s option')].find(o => /Pièces Poids/.test(o.textContent)).value);
  await p.selectOption('#bc-s', sid); const ia = await p.evaluate(() => [...document.querySelectorAll('[data-bi="0"] option')].filter(o => o.value && o.value !== 'svc')[0].value);
  await p.selectOption('[data-bi="0"]', ia); await p.fill('[data-bq="0"]', '5'); await p.waitForTimeout(100); await p.click('#bc-save'); await p.waitForTimeout(350);
  const bsh = await txt('.paper'); ok(/BON DE COMMANDE/.test(bsh) && /BC-2026-/.test(bsh), 'feuille du bon de commande');
  await p.click('#dc-send'); await p.waitForTimeout(250); await p.click('#ds-go'); await p.waitForTimeout(400); ok(/Envoyé/.test(await txt('#modal')), 'BC Envoyé');
  await p.click('#dc-conf'); await p.waitForTimeout(300); ok(/Confirmé/.test(await txt('#modal')), 'BC Confirmé');
  const stock0 = await p.evaluate((id) => 0, ia);
  await p.click('#dc-recv'); await p.waitForTimeout(250); await p.fill('[data-rq="0"]', '2'); await p.click('#rc-save'); await p.waitForTimeout(400);
  ok(/Reçu partiellement/.test(await txt('#modal')), 'réception partielle');
  await p.click('#dc-recv'); await p.waitForTimeout(250); const rest = await p.inputValue('[data-rq="0"]'); ok(rest === '3', 'reste à recevoir = 3 (' + rest + ')'); await p.click('#rc-save'); await p.waitForTimeout(400);
  ok(/Reçu partiellement[^→]*→ Reçu\s*\d/.test(await txt('.pmute')), 'commande Reçu');
  await p.click('#dc-inv'); await p.waitForTimeout(300); ok(/Nouvel achat/.test(await txt('#modal h2')) && await p.locator('#bm-ll select').count() === 1, 'facture préremplie depuis la commande');
  await p.click('#bm-save'); await p.waitForTimeout(400);
  await p.click('[data-dtab="bc"]').catch(() => {}); await p.waitForTimeout(300);
  ok(/Facturé/.test(await txt('#docs-body')), 'commande Facturé');
  // registre
  await p.click('[data-dtab="reg"]'); await p.waitForTimeout(300);
  const types = await p.evaluate(() => [...document.querySelectorAll('#docs-f option')].map(o => o.textContent).join(',')); ok(/Devis/.test(types) && /Bon de livraison/.test(types), 'registre : types');
  await p.selectOption('#docs-f', 'Devis'); await p.waitForTimeout(250); ok(await p.locator('#docs-body tbody tr').count() >= 5, 'registre : filtre Devis');
  await p.fill('#docs-q', no2); await p.waitForTimeout(250); ok(await p.locator('#docs-body tbody tr').count() === 1, 'registre : recherche par numéro');
  await p.locator('[data-dreg]').first().click(); await p.waitForTimeout(250); ok(/DEVIS/.test(await txt('.paper')), 'registre : ouvre le devis'); await p.click('#dc-close'); await p.waitForTimeout(200);
  await p.selectOption('#docs-f', 'Bon de livraison'); await p.fill('#docs-q', ''); await p.waitForTimeout(250);
  await p.locator('[data-dreg]').first().click(); await p.waitForTimeout(250); ok(/BL-2026/.test(await txt('#modal')), 'registre : ouvre un BL');
  await p.screenshot({ path: 's99b.png' });
  // rôles
  await p.keyboard.press('Escape'); await p.click('#bl-x').catch(() => {}); await p.waitForTimeout(200);
  await p.click('#side-user', { force: true }); await p.click('[data-setrole="pdv"]'); await p.waitForTimeout(300);
  const navs = await p.evaluate(() => [...document.querySelectorAll('#nav .it .lb')].map(x => x.textContent.trim())); ok(!navs.includes('Documents'), 'Caisse : pas de Documents');
  await p.click('#side-user', { force: true }); await p.click('[data-setrole="compta"]'); await p.waitForTimeout(300);
  const navs2 = await p.evaluate(() => [...document.querySelectorAll('#nav .it .lb')].map(x => x.textContent.trim())); ok(navs2.includes('Documents'), 'Comptabilité : Documents visible');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); await b.close();
})();
