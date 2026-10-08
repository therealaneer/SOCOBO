# SOCOBO — Session handoff (state at v55, 2026-10-08)

Read this file together with `CLAUDE.md` (company, roles, engineering rules) and `docs/decisions.md` (every design decision, sections 1–36). Goal of this file: a new conversation continues **exactly** like the previous one, losing nothing.

## 1. Who and what
- Owner: Moroccan company (quarries Bouaanfir and Nfifa, crushing lines, brick factory "Usine Agglos", building materials, Chichaoua). He writes **Arabic** (with French UI terms); the UI is **French**.
- Deliverable in this phase: **single-file interactive HTML mockup** `prototype/socobo-menu.html` (vanilla JS, one IIFE, CSS variables, no backend, data resets on reload), published as a Claude **Artifact** at `https://claude.ai/artifact/HWoz8AUFA2ojcTcqNGwH2X` (latest published: **v55**). Real build later: Django + PostgreSQL + HTMX in Docker (Container Manager) on a Synology NAS, LAN only, nightly `pg_dump`, migrations, backup before any update.
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
- GitHub `therealaneer/socobo`: branch **v55** = everything through v55 (prototype, decisions §30–36, this handoff, `tests/e2e`).
- Artifact published: **v55**.
- Version history (design content in `docs/decisions.md`): v40 Personnel/Location/Charges · v41 styles, Paramètres · v42 custom period, m³/t, Rentabilité · v43 recipe per gâchée, price per brick · v44 Paramètres tabs, Magasin pièces de rechange · v45 Comptes, product order · v46 guided À saisir · v47 Retour button · v48 data entry from À saisir · v49 Carrière products and tout-venant stock · v50 Présences hours · v51 internal worker number M-0001 · v52 modal scroll lock · v53 single back button · v54 Facturation + BLE/BLC + REC · v55 Facturation Espèces: filter, Importer, Facturer, Tout facturer, free invoice.

## 4. Prototype architecture (for patching)
- Router `go(k, sub)`; `ROLES` (dg, ctrl, compta, pdv) with `menu` maps; `visibleMenu()`, `roleAllows()`; `VIEWHOOKS['view-x']` render hooks; `ALLV` list of views; `vm` map menu key → view id; `menu` array (`{k,l,i,sub}`), icons in `ic`.
- Modals: `openModal(html, cls)` / `closeModal()` / `docModal(title, body, sub, after, opts)` (printable paper); `hostOpen` moves a page node into a modal; MutationObserver on `#ov` re-renders pages after a modal closes; `html.mlock` scroll lock; global back `NAVH` (`navPush/goBack`).
- Helpers: `$`, `esc`, `num`, `mad`, `nf2/nf3/nf0`, `dfmt`, `iso`, `parseIso`, `TODAY`, `audit(act,obj,detail)`, `toast`, `kpiH`, `sum2`, `payOf(row)`, `rateOf(client)`, `clientModal(null)`, `CHR` (Chèques reçus), `COMPANY`.
- v54/v55 additions: Facturation module (search `Facturation : Espèces`): `FINV, FBL, FSEQ, fMake, fPaper, fPrint, fInvEdit, fInvAnn, fHist, fImp, fFact, fMkEsp, fGo, renderFact`; Caisse `BLSEQ` (BLE/BLC) in `pdvEmit`; receipts `recNo, recDoc, PAYREG` (button `data-recp` in `payLine`).
- Editing method used so far: Python patch scripts that `rep(old, new)` with an assertion that `old` occurs exactly once, applied to the HTML (nothing written until all assertions pass). Keep a copy before big edits.

## 5. Tests
- `tests/e2e/lib.js` (`nav(p, key, sub)`), `t55.js` (full regression), `t70–t79.js` (back button, Facturation Espèces/Chèque/Agglos, BLE/BLC, REC, Importer). They open `file://<cwd>/socobo-menu.html`, so copy the prototype next to them or run from a folder containing it. Playwright with Chromium at `/opt/pw-browsers/chromium`. Expect **0 `PAGEERR`**. Earlier tests (t38–t69) were not copied; recreate similar checks per feature.

## 6. Open items / backlog
- He will send, for each dashboard, which **key cards** he wants (pending).
- Open questions are in `docs/decisions.md` §21 (mandatory À saisir tasks, real company data, real recipes/prices, spare parts references, budgets, rented fleet, overtime multipliers…). The "etc." extra daily tasks (machine counter readings…) are not tasks yet (§29).
- Whether **Point de vente** should be a profit centre.
- Facturation: Usine Agglos has no payment field (his original spec had none) — he may ask otherwise.
- REC number is assigned lazily in the demo (assigned at payment time in the real build).
- Real build items already decided are in `CLAUDE.md` §§8–10.

## 7. First message to paste in the new conversation
> اقرأ `CLAUDE.md` و`docs/handoff.md` و`docs/decisions.md` في مستودع therealaneer/socobo (الفرع v55)، وانسخ `prototype/socobo-menu.html` كأساس للعمل. أكمل بنفس البروتوكول بالضبط: أسجّل ملاحظاتي وتقترح دون تطبيق، وتطبّق فقط عند كتابة «طبق»، وتنشر المعاينة في نفس رابط الـArtifact مع رقم النسخة. آخر نسخة منشورة v55.
