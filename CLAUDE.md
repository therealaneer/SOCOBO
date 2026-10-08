# SOCOBO — project guide for Claude

SOCOBO is the internal management software of a Moroccan building-materials company.
This file is the source of truth for context. Read it fully before writing any code.

## 1. The company

- Name: **SOCOBO**, based in **Chichaoua** (Morocco). Currency: **MAD** (Moroccan dirham).
- Activities:
  - **Quarries and crushing** on two sites: **Bouaanfir** and **Nfifa** (aggregates: tout-venant, grave, gravettes, sable…).
  - **Brick factory "Usine Agglos"** on the same premises as the company (briques 8/12 trous, hourdis, parpaings, pavés…).
  - **Sale of building materials** to account customers (BTP companies, cooperatives) and walk-in customers ("Client de passage", cash).
- The company also owns heavy machines (loaders, excavators, crushers, screen, brick press…) and buys fuel, spare parts and consumables from suppliers.

## 2. Users and infrastructure

- **About 5 users at the start**, on fixed PCs of the local network. About **50 workers** exist but they are employees (payroll/assignments), **not** users.
- Planned workstations ("postes"): 1 Direction (DG), 2 Contrôle, 3 Comptabilité et saisie, 4 Point de vente (Caisse). Later: 5 Usine, 6 Maintenance.
- **Server: a Synology NAS (DSM 7.2.2) inside the company**, address `192.168.1.10` on the local network. It shows as a DS920+ but is most likely **XPEnology on a standard server** (unofficial). Hardware: Intel Xeon E3-1220 v5 (4 cores), 16 GB RAM, plus an **external USB disk**. No cloud dependency: clients use the app through a web browser over the LAN.
- **The NAS is already in production as the employees' file server. Do not change anything on it** (settings, packages, shares, users, updates) without the owner's explicit approval. Anything we install must live in its own containers and its own folder, and must never touch the existing shares.
- **Deployment target: Docker (`docker-compose`) on Synology Container Manager.** The application must stay **portable**: it has to run unchanged on any other machine that has Docker (no dependency on DSM, Windows or a specific path).
- Data must never be lost: automatic backups, audit log and a tested restore procedure are mandatory (see section 8).
- The app must keep working if the internet is down.

## 3. Language and formatting rules

- **The UI is in French.** Code, identifiers, comments and commit messages are in English.
- The owner speaks Arabic. **Reply to him in Arabic**, keeping French UI terms as they appear on screen (Caisse, Dépense, Clôturer la journée…). Correct French spelling in UI text yourself.
- Amounts: **2 decimals always**, French number format (`1 234,56`), **no "MAD" suffix** in the UI. Money is `DecimalField(max_digits=14, decimal_places=2)`, never float.
- Dates `dd/mm/yyyy`, times `HH:MM`, time zone Africa/Casablanca.
- **Simplicity is non-negotiable**: every user sees only what they need; fewer clicks beats more features.

## 4. Source of truth for screens: `prototype/`

- `prototype/socobo-menu.html` is a **single-file interactive mockup (no database, no real auth, data resets on reload)**. Design decisions are recorded in **`docs/decisions.md`**, which is the build reference.
- It is the **reference for screens, flows, wording and business rules ONLY. It is NOT production code** — never copy its JavaScript architecture; re-implement properly.
- When the prototype and the owner's latest instructions differ, the owner's latest instructions win. Ask when unsure.

## 5. Modules (target scope)

1. **Caisse (Point de vente)**: choose client → truck → goods; quantity pre-filled from the truck capacity (m³) or weight; payment **Espèces (default)** or **Crédit**; issue the BL; **A6 portrait BL printed once**. Max 6 lines per BL. Remaining stock shown on each product card.
2. **Dépense**: cash expenses taken out of the caisse (category, beneficiary, note); daily total.
3. **Dashboard** per role. Caisse dashboard: Espèces encaissées, Dépense, **Reste** (cash − expenses), quantities sold per product, today/yesterday only.
4. **Clients**: account customers, trucks, VAT mode (HT or 20 %), credit ceiling, blocking (client or truck), invoices (from BLs), collections (cheque, effet, cash, transfer).
5. **Fournisseurs**: purchase invoices (destination Général/Carrière/Usine), payments allocated to invoices, due dates, statuses (Payé / À venir / Impayé).
6. **Banque**: cheque and effet tracking (Disponible/Émis/Payé/Annulé/Perdu/Impayé), cheque books, printing on pre-printed cheque/effet forms.
7. **Magasin** (replaces "Stock"): spare parts, oils, fuel, plus product quantities.
8. **Machines**: hours meter, maintenance plans (by hours or days), interventions, parts replaced (recurring-part alert: 3+ times in 180 days), costs.
9. **Usine Agglos**: daily production and breakage per product, materials (sand, gravel, cement bulk by tonne), drying days before sale (configurable), electricity sub-meter, cost per mille and margin per product.
10. **Personnel**: employees, monthly salary (26 working days/month), daily assignments (usine / carrière / bureau / absent).
11. **À saisir / À contrôler / Clôture de la journée**: recurring tasks (daily, weekly, monthly, quarterly, yearly) the data-entry person must complete; mandatory tasks block the day closure; the controller marks every item "Vu" and approves the day.
12. **Utilisateurs**: workstations, permissions, tasks catalogue, company settings (address, ICE, RC, IF printed on BLs).
13. **Audit**: who did what and when, for every sensitive action.

## 6. Roles and permissions (initial)

| Poste | Role | Sees | Restrictions |
|---|---|---|---|
| 1 | **DG** | Everything | Only role that sees salaries, margins, cost prices; sets prices, credit ceilings, blocks/unblocks (including one-time audited override); reprints a BL (marked COPIE) |
| 2 | **Contrôle** | À contrôler, Dashboard | Read-only; marks items "Vu", approves the day |
| 3 | **Comptabilité / saisie** | À saisir, Clients, Fournisseurs, Banque, Magasin | Clients fully, but cannot change ceiling or blocking; suppliers: can add invoices, **sees no supplier amounts** (one exception: the cement supplier invoices imported in Facturation › Usine Agglos); no salaries/margins/cost prices |
| 4 | **Caisse** | Dashboard caisse, Caisse, Dépense, Magasin (quantities only), À saisir | Cannot change prices or ceilings; cannot unblock; sees no invoices; **BL printable once only**; cannot edit/delete past records |

Permissions must be **enforced on the server**, never only hidden in the UI. Later roles: Usine, Maintenance.

## 7. Key business rules to preserve

- Credit ceiling exceeded blocks **Crédit** sales only (cash still allowed); a DG block on a client or truck blocks all sales. The DG can unblock **once**, with a mandatory reason, written to the audit log.
- Cash sales are recorded as paid/invoiced; credit sales go to "À facturer" and into invoices.
- Customer types: société / particulier; supplier/customer identity (ICE/CIN) rules as in the prototype.
- Factory internal accounting: cost per mille = materials + labour (salary/26 × days assigned) + electricity (Δkwh × tariff) + factory machine maintenance + purchases tagged "Usine". No overhead allocation for now.
- Products sold per tonne, per m³ (price per m³ derived), or per mille (bricks). Recipes per mille are placeholders until the owner confirms.
- A day can be **closed** per workstation; closed days are locked; only the DG can reopen (audited).
- **Prices**: every price and amount on screen is **TTC** (the only HT/TVA detail is on the printed invoice). A client can have **agreed prices** (TTC, set by the DG only) that replace the normal prices at the Caisse.
- **Printing**: no whole-page print. A « Imprimer » button sits under every table with a totals row and under every statistics card; it prints only that block, all its rows.
- **Order**: every list or table ordered by time or number is shown **oldest first** (invoice numbers 1, 2, 3…, dates increasing). Rankings by amount are the only exception.
- Colour/status conventions (Payé green, Émis orange, Annulé red, etc.), blue header rows and blue total rows: follow the prototype. **Every table with amounts has a totals row.**

## 8. Engineering principles

- **Stack (proposed, pending owner approval in the architecture PR): Django + PostgreSQL**, server-rendered templates (+ HTMX). Do not introduce other frameworks without asking.
- **Runtime**: `docker-compose` with (at least) a `web` service (Django served by Waitress or Gunicorn) and a `db` service (PostgreSQL). Configuration only through environment variables / `.env` (never committed); data in named volumes or bind mounts under one dedicated folder, so that moving to another machine = copy the compose file, the `.env` and restore a backup. Images pinned to explicit versions. `restart: unless-stopped` so the stack comes back after a reboot.
- **No-DSM-update rule (see section 10).**
- Every schema change goes through **migrations**. Never edit the database by hand.
- Every sensitive action writes an **append-only audit entry** (user, time, action, object, before/after).
- **Backups** (the NAS is unofficial hardware: assume it can fail or be broken by an update at any time):
  1. nightly `pg_dump` run by a **DSM Task Scheduler** job (`docker exec` into the `db` container), kept as dated files with daily/weekly/monthly retention;
  2. a copy of every dump on the **external USB disk**;
  3. an **encrypted copy outside the NAS itself** (another machine or a cloud storage), so that losing the NAS and its USB disk does not lose the data;
  4. a documented restore procedure, **tested on another machine** regularly; a failed backup must raise a visible alert.
  Never ship a feature that deletes data without soft-delete or confirmation.
- **Tests**: automated tests for all money/stock calculations (balances, VAT, margins, cost per mille, stock). A failing test blocks merging.
- Small, reviewable pull requests; one module at a time; deploy to a **test instance first**, back up before every production update.
- Never commit secrets (`.env`, passwords, backups, real customer data).
- No dead code, no speculative features. Prefer the simplest thing that satisfies the written rules.

## 9. Working agreement with the owner

- **Session continuity: read `docs/handoff.md` first** (current state, protocol, architecture of the prototype, tests, backlog).

- The owner sends notes in batches; **record them, propose, and apply only when he writes "طبق" / "TABBIK" / "NAFFID"**.
- Ask for missing business facts (tariffs, recipes, product list, legal name on bank documents) instead of inventing them. Placeholder values must be visibly marked as such.
- Open questions still pending: internal kWh tariff, drying days (7 assumed), final product list, legal company name on cheques/effets, real company details (address, ICE, RC, IF).

## 10. DSM / NAS safety warning

- **NEVER update DSM (or any NAS system package, Container Manager included) without (a) a complete verified backup of the database and the application data AND (b) the explicit approval of the owner.** The system is probably XPEnology: an update can render it unbootable and take the file server and SOCOBO down together.
- Do not change storage, network, users, shared folders or scheduled tasks on the NAS beyond what the approved deployment plan lists. Prepare everything as files in this repository (compose file, backup scripts, written procedures) and let the owner apply them.
- Until the owner explicitly says otherwise, treat the NAS as **read-only for us**: development and testing happen elsewhere.

## 11. Current phase: DESIGN (decided by the owner)

We are **still in the design phase**. We keep refining the prototype (published as a Claude Artifact for preview) and we **do not start any Django code** until the owner states explicitly that the design is finished.

- **Deferred until the owner says the design is finished**: Phase 0 (project skeleton, Docker, database, authentication, audit, backups) and the preview environment (GitHub Codespaces). Do not prepare them in the meantime.
- **After every accepted change to the prototype**: publish the preview, then upload the new version of `prototype/socobo-menu.html` to GitHub on a **branch + Pull Request** (never directly on `main`), and record the change in `docs/decisions.md` in the same PR.
- **`docs/decisions.md`** is updated with every design decision (sections, fields, roles, calculation rules): add, change or remove the matching line; never leave it stale.
- **End of every session**: commit and push all pending work, and report the state of the open Pull Requests.
