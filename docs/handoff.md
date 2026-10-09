# SOCOBO — Session handoff (state at v58, 2026-10-08)

Read this file together with `CLAUDE.md` (company, roles, engineering rules) and `docs/decisions.md` (every design decision, sections 1–36). Goal of this file: a new conversation continues **exactly** like the previous one, losing nothing.

## 1. Who and what
- Owner: Moroccan company (quarries Bouaanfir and Nfifa, crushing lines, brick factory "Usine Agglos", building materials, Chichaoua). He writes **Arabic** (with French UI terms); the UI is **French**.
- Deliverable in this phase: **single-file interactive HTML mockup** `prototype/socobo-menu.html` (vanilla JS, one IIFE, CSS variables, no backend, data resets on reload), published as a Claude **Artifact** at `https://claude.ai/artifact/HWoz8AUFA2ojcTcqNGwH2X` (latest published: **v58**). Real build later: Django + PostgreSQL + HTMX in Docker (Container Manager) on a Synology NAS, LAN only, nightly `pg_dump`, migrations, backup before any update.
- Phase = **DESIGN**. No Django, no Phase 0, no Codespaces until the owner says the design is finished.

## 2. Working protocol (follow exactly)
1. He sends notes/screenshots → **record them and propose, do not apply**. Apply only when he writes **"طبق" / "TABBIK" / "NAFFID"**. Real defects (bugs) may be fixed directly.
2. Reply in **Arabic**, keeping French UI terms as on screen; direct, honest, short; use **official French names**; correct French spelling yourself.
3. Be smart and organised: never put two buttons doing the same action; do not ask about "old operations" (demo data is symbolic; numbering for new operations starts at 1).
4. After each applied change: run the Playwright tests (0 PAGEERR), then **publish to the same Artifact URL** with a version label (v56, v57…) and give the link **in its own code block with the version number**.
5. Amounts: always 2 decimals, no "MAD" suffix; brick prices per brick with 3 decimals. Dates dd/mm/yyyy.
6. Do **not** create or merge PRs unless asked; he does not want GitHub steps. Branches are one per version, each stacked on the previous (`v41 … v55`), `main` untouched. Ask once "هل أحفظ vNN؟" only when new unsaved work exists.
7. **NAS: never touch it; never update DSM without a full backup and explicit approval.** Permissions must be enforced server-side in the real build.
8. Hosting is **Netlify**, not Vercel (see `CLAUDE.md` of the website repo).

## 3. Where things stand
- GitHub `therealaneer/socobo`: branch **v58** = everything through v58 (prototype, decisions §30–39, this handoff, `tests/e2e`).
- Artifact published: **v58**.
- Version history (design content in `docs/decisions.md`): v40 Personnel/Location/Charges · v41 styles, Paramètres · v42 custom period, m³/t, Rentabilité · v43 recipe per gâchée, price per brick · v44 Paramètres tabs, Magasin pièces de rechange · v45 Comptes, product order · v46 guided À saisir · v47 Retour button · v48 data entry from À saisir · v49 Carrière products and tout-venant stock · v50 Présences hours · v51 internal worker number M-0001 · v52 modal scroll lock · v53 single back button · v54 Facturation + BLE/BLC + REC · v55 Facturation Espèces: filter, Importer, Facturer, Tout facturer, free invoice · v56 Facturation Carrière (Espèces + Chèque merged, one gap-free series) and Usine Agglos (cement invoices imported), cards, direct invoicing without preview, m³ quantities, single bottom print button, oldest-first order everywhere, « Sable lavé concassé 0/5 », cement and adjuvant costed TTC · v57 prices TTC everywhere on screen, agreed client prices (`c.prix`, `pxHT`, `pxEd`, Caisse « Prix client »), « Tout vider », field alignment · v58 form with Mode first and round +, × close, Unité, live BL total, date typing fix, a print button under every table/statistic (`addPrintBtns`, `printBlock`, `.tprint`).

## 4. Prototype architecture (for patching)
- Router `go(k, sub)`; `ROLES` (dg, ctrl, compta, pdv) with `menu` maps; `visibleMenu()`, `roleAllows()`; `VIEWHOOKS['view-x']` render hooks; `ALLV` list of views; `vm` map menu key → view id; `menu` array (`{k,l,i,sub}`), icons in `ic`.
- Modals: `openModal(html, cls)` / `closeModal()` / `docModal(title, body, sub, after, opts)` (printable paper); `hostOpen` moves a page node into a modal; MutationObserver on `#ov` re-renders pages after a modal closes; `html.mlock` scroll lock; global back `NAVH` (`navPush/goBack`).
- Helpers: `$`, `esc`, `num`, `mad`, `nf2/nf3/nf0`, `dfmt`, `iso`, `parseIso`, `TODAY`, `audit(act,obj,detail)`, `toast`, `kpiH`, `sum2`, `payOf(row)`, `rateOf(client)`, `clientModal(null)`, `CHR` (Chèques reçus), `COMPANY`.
- v54–v56 additions: Facturation module (search `Facturation : Carrière`): `FINV, FBL, FSEQ, FCI, fMake, fPaper, fPrint, fInvEdit, fInvAnn, fHist, fImp, fFact, fMkEsp, fGo, fCar, fAgg, fCards, fCiImport, renderFact`; Caisse `BLSEQ` (BLE/BLC) in `pdvEmit`; receipts `recNo, recDoc, PAYREG` (button `data-recp` in `payLine`).
- Editing method used so far: Python patch scripts that `rep(old, new)` with an assertion that `old` occurs exactly once, applied to the HTML (nothing written until all assertions pass). Keep a copy before big edits.

## 5. Tests
- `tests/e2e/lib.js` (`nav(p, key, sub)`), `t55.js` (full regression), `t70–t74.js`, `t77–t78.js` (back button, BLE/BLC, REC…; t77 already timed out on v55), `t80.js` (Facturation Carrière), `t81.js` (Usine Agglos and cement import), `t82.js` (bottom print button, oldest-first order), `t83.js` (clicks every tab of every screen, all roles), `t84.js` (audits every table: date columns must increase), `t85.js` (one print bar per page), `t86.js` (TTC prices, agreed client prices, Tout vider, alignment), `t87.js` (v58 form, Unité, live total, dates, print buttons). They open `file://<cwd>/socobo-menu.html`, so copy the prototype next to them or run from a folder containing it. Playwright with Chromium at `/opt/pw-browsers/chromium`. Expect **0 `PAGEERR`**. Earlier tests (t38–t69) were not copied; recreate similar checks per feature.

## 6. Open items / backlog
- He will send, for each dashboard, which **key cards** he wants (pending).
- Open questions are in `docs/decisions.md` §21 (mandatory À saisir tasks, real company data, real recipes/prices, spare parts references, budgets, rented fleet, overtime multipliers…). The "etc." extra daily tasks (machine counter readings…) are not tasks yet (§29).
- Whether **Point de vente** should be a profit centre.
- Facturation: Usine Agglos has no payment field (his original spec had none) — he may ask otherwise.
- Selectors keep today-first order (period chips, day chips « Aujourd'hui · Hier · Avant-hier ») — to confirm with him whether they must also read oldest first.
- Possible double counting of cement in the factory cost (purchases tagged Usine + recipes), see decisions §35.
- REC number is assigned lazily in the demo (assigned at payment time in the real build).
- Real build items already decided are in `CLAUDE.md` §§8–10.

## 7. First message to paste in the new conversation
> اقرأ `CLAUDE.md` و`docs/handoff.md` و`docs/decisions.md` في مستودع therealaneer/socobo (الفرع v56)، وانسخ `prototype/socobo-menu.html` كأساس للعمل. أكمل بنفس البروتوكول بالضبط: أسجّل ملاحظاتي وتقترح دون تطبيق، وتطبّق فقط عند كتابة «طبق»، وتنشر المعاينة في نفس رابط الـArtifact مع رقم النسخة. آخر نسخة منشورة v58.

- v59 : correctif des champs date (voir decisions §40) ; test `tests/e2e/t88.js`. Cause : Chrome met transitoirement `document.activeElement` à BODY pendant l'événement `change` d'un champ date, donc ne pas se fier à `:focus` pour décider de ne pas redessiner.

- v62 : import fournisseur en 2 étapes, type de brique par facture de ciment (optionnel), « Ciment par pièce (kg) » dans Paramètres › Usine, carte « Briques facturables » (decisions §42) ; test `tests/e2e/t89.js`.
- v63 : cartes Usine Agglos (ciment acheté / facturé / reste + Total facturé, cartes fines par type) — decisions §43.
- v64 : Supprimer une facture (numéro réutilisé), sections Usine Agglos réordonnées, tableau Briques facturables retiré, carte Non attribué — decisions §44 ; test `tests/e2e/t90.js`.
- v65 : facture imprimée au format A4 (decisions §45), aperçu à l’écran en feuille A4 portrait (210 x 297, ratio 1,414). Non poussé sur GitHub.
- v67 : correctif — les `textarea` héritent maintenant la couleur et la police (le message de relance était illisible : texte clair sur fond clair).

