# SOCOBO — design decisions

Living record of every design decision taken with the owner while the prototype (`prototype/socobo-menu.html`) is refined.
**This file is the reference for the real build.** Update it with every accepted change (add, change or remove the matching line; never leave it stale).
Convention: **[D]** = decided by the owner · **[A]** = assumption made by Claude, to confirm · **[?]** = open question.
UI language: French. Amounts: 2 decimals, no "MAD" suffix.

Prototype status: **v58** (one branch per version, stacked; `main` untouched). Phase: **design** (no Django code yet — see `CLAUDE.md` section 11).

---

## 1. Workstations (postes) and roles

| Poste | Name | Menu (in order) | Rules |
|---|---|---|---|
| 1 | Direction (DG) | everything (incl. À contrôler, Dépense, Historique opérations, Utilisateurs, Audit) | sees salaries, margins, cost prices; sets prices, ceilings, blocks; unblocks once (audited); reprints BL as COPIE |
| 2 | Contrôle | À contrôler, Dashboard, Point de vente › Stock produits, Oued, Carrière, Magasin › Gasoil / Huiles et graisses | read-only; marks items "Vu"; approves the day |
| 3 | Comptabilité et saisie | À saisir, Clients, Fournisseurs, Banque, Oued and Carrière (records them), Magasin (records Gasoil/Huiles), Point de vente › Stock produits | Clients full except ceiling/blocking/prices; Fournisseurs: add invoices only, **no supplier amounts**; sees Banque amounts [A] |
| 4 | Point de vente (Caisse) | Dashboard, À saisir, Point de vente (Caisse, Stock produits), Dépense | no prices/ceilings/unblocking; no invoices; BL printable **once**; can add expenses, cannot edit/delete [A] |
| 5, 6 | Usine, Maintenance | later | to be defined |

- [D] One workstation = one PC on the LAN; the prototype's "Changer de poste" button is a simulation only.
- [D] À saisir is kept in the Caisse menu even though not listed in the owner's last list [A].
- [D] The top bar (poste chip, bell, avatar) is hidden on the Caisse screen (full-screen POS).
- [D] Permissions enforced on the server, not only hidden in the UI.
- [D] **Deployment scope (owner decision)**: internal use only at the start — 4 PCs on the company LAN, all connected to the server (the NAS). No access from the internet.
- [D] **Client form**: a full-screen installed app (PWA: icon on the desktop, window without tabs or address bar), not a tab in a normal browser. An Electron/Tauri desktop wrapper is not needed [A].
- [D] Remote access is deferred; if needed later, via a VPN (e.g. Tailscale/WireGuard), never by opening a router port. Nothing is changed on the NAS until the owner approves.

## 2. Branding

- [D] Name **SOCOBO** (text only, no logo/icon anywhere). Sidebar: collapsed = empty at the top; expanded = wordmark "SOCOBO" (letter-spaced, bold, "BO" lighter).
- [D] Company details printed on the BL are editable in **Utilisateurs › Entreprise** (adresse, ville, téléphone, ICE, RC, IF). Current values are random placeholders.
- [?] Legal company name on cheques/effets (still "SOCOBO" as drawer).
- [D] **Visual comfort (v35)**: neutral page background, no coloured gradient. Light: page `#F3F4F6`, cards/sheets `#FFFFFF`, text `#1F2937`. Dark: page `#161A1F`, sheets `#1E2329`, text `#E5E7EB` (no pure white/black). Brand blue only for sidebar, buttons, headers and accents. Text/background contrast must stay ≥ 4.5:1 (WCAG).

## 3. Caisse (Point de vente)

Flow, all on one full page: **1 Client → 2 Camion → 3 Marchandise**, ticket on the right.
- [D] Search field (client name or truck plate) only on the first step; width = client cards area; **disappears once a client is chosen**; "Changer de client" returns to the first step.
- [D] Client cards show avatar initials, truck count, status chip (Actif / Plafond x % / Plafond dépassé / Client bloqué / Camion bloqué). Blocked = red.
- [D] Truck cards: plate, driver, capacity (m³); blocked truck red; a client with a single truck is auto-selected.
- [D] Walk-in client ("Client de passage", cash only): free plate/driver/capacity fields.
- [D] Product cards: icon, name, site, price per t and per m³ (or per mille), **"Reste : …" small at the bottom**. Products without a price are disabled ("Prix à renseigner").
- [D] **Quantity is automatic**: tapping a product with a chosen truck fills the truck's full capacity in m³ (no keypad). Several products share the capacity equally. Bricks (mille) and weight mode (tare/brut) open a keypad. A line can be edited by tapping it.
- [D] **Maximum 6 lines per BL.**
- [D] Payment: two big buttons **Espèces (default, always)** and **Crédit**; Crédit disabled for cash-only clients. Main button: "Encaisser · amount" / "Valider à crédit · amount".
- [D] On Encaisser/Valider: the sale is **recorded immediately**, the BL preview opens for review and printing; a fresh sale starts.
- [D] No "Imprimer BL" / "BL du jour" buttons on the Caisse screen.
- Blocking rules: see section 12.

## 4. BL (bon de livraison) — printed

- [D] **A6 portrait (105 × 148 mm)**, black and white, thin lines (style of the owner's invoice reference).
- Layout: SOCOBO + company details (top left); "BON DE LIVRAISON", N°, date and time (top right); client + truck + driver and **Total TTC** (second row); table DÉSIGNATION · PRIX HT · QTÉ · TOTAL HT with vertical rules and 6 fixed rows; Sous-total HT, TVA (20 % or "sans TVA"), **Total TTC**; Mode de paiement; signature boxes (driver, company stamp).
- [D] **Printed once.** After the first print the button becomes "BL déjà imprimé" for non-DG. The DG can reprint: sheet marked "COPIE n° N", written to Audit.
- [D] The DG opens any past BL from Historique opérations (BL number is clickable).
- [D] Lists of BLs (dashboard) are **read-only, no print/preview** of a BL.

## 5. Dépense (cash expenses)

- [D] Records every money outflow from the caisse. **Dépense is now a sub-section of Point de vente** (Caisse · Produits · Stock produits · Dépense), no longer a top-level menu.
- Fields: amount, category (Gasoil, Réparation, Pièces, Salaire / avance, Nourriture, Transport, Autre) [A], beneficiary, note; time and user automatic.
- [D] Today's list with a blue total row; the caisse user can only add. [A] DG sees any day and can edit/delete (audited).
- [D] Top cards on the page: Espèces encaissées, Dépenses, **Reste**.

## 6. Dashboard (poste Caisse)

- [D] Period: **Aujourd'hui / Hier** only.
- [D] Cards: **Espèces encaissées** (click → read-only list of the cash BLs: time, BL, client, goods, quantity, amount, totals + quantities), **Dépense** (click → list), **Reste** (the largest) = cash − expenses of the day [A: no opening balance; every day starts at 0]. No "Crédit" card, no "Total des ventes".
- Also: quantities sold per product (m³, t, briques), stats (BL count, trucks, average ticket, peak hour, best client), sales per hour (cash/credit), top clients with totals row.
- [D] Every table with amounts has a **totals row**; every page has an **Imprimer** button (statistics).
- DG dashboard: separate (financial); to be defined.

## 7. Catalogue Produits

- [D] Sold **per tonne and per m³** (aggregates; price per m³ = price per t × density) or **per mille** (bricks, hourdis…). Products: Tout-venant 0/80, Grave 0/31,5, Gravette 8/16, Gravette 15/25, Sable lavé concassé 0/5 (renamed from « Sable 0/4 » in v56) (quarries Bouaanfir/Nfifa); Brique 8 trous, Brique 12 trous, Hourdis 16, Parpaing 20, Pavé autobloquant (Usine Agglos). Prices of Parpaing and Pavé: to be set.
- [D] Quarry→factory transfers (sand, gravel) are valued at the **selling price**; cement arrives bulk, by tonne.
- [D] Recipes per mille (sand t, gravette t, cement kg) are **placeholders** until the owner confirms; marked "Indicative".
- [D] Optional **stock initial (t)** per quarry product (empty = stock not tracked); remaining = initial − sold (m³ converted with density). Bricks: remaining = ready stock of the factory.

## 8. Clients

- [D] Fields: name, type (société/particulier), category, city, phone, ICE/CIN, **TVA mode (HT or 20 %)**, delay (days), **credit ceiling**, payment modes, trucks (plate, type, capacity m³, driver).
- [D] Truck types: 8/4, 6/4, Solo, Canter, Tracteur, + "add another".
- [D] Statuses: Actif, Plafond x %, Plafond dépassé, Bloqué (client or truck).
- Invoices generated from BLs (client-level), collections by cheque/effet/cash/transfer; the received cheques/effets tracking tab is **later**.
- [D] Cards (Clients list): Total clients (active), Total vente, Reste à encaisser, Échéance 7 jours — each opens a details window. Client sheet: Total vente, Vente facture, Total encaissé, Reste dû, Prochaine échéance.
- [D] Buttons "Bloquer/Débloquer" red/green, "Encaisser" green.

## 9. Fournisseurs and Banque

- [D] One unified invoice table per supplier: Date · N° facture (BL number below, smaller) · Montant · Échéance · Mnt réglé · Réglé par (e.g. "chq 12344, lcn 456774") · Date règlement · Status · Reste · Action. Totals row (blue) under every table with amounts.
- [D] Statuses: Payé (light green), **À venir** (not "À échoir"), Impayé; row tints applied everywhere (Payé green, Émis orange, Annulé red).
- [D] No separate "Règlements" tab. Supplier list has a filter "not settled".
- [D] Purchase invoice has a **destination**: Général / Carrière / Usine.
- [D] Cheque/effet printing: preview then print; the supplier is usually the beneficiary; **place = always CHICHAOUA**; a third button to fill a cheque **without a supplier**; a cheque amount can exceed the open balance (confirmed).
- [D] Suivi chèque columns: Numéro · Fournisseur · Facture · Date facture · Montant · Échéance · Encaissement · Status · Action; KPI cards are clickable. Statuses: Disponible / Émis / Payé / Annulé / Perdu / Impayé.
- [D] Sticky table headers everywhere.
- [D] **Banque** has two sub-sections: **Chèques émis** (formerly *Suivi chèque*) and **Chèques reçus** (cheques received from customers or other third parties, tracked like the issued ones). Official accounting wording: *Chèques émis / Chèques reçus*.
- [D] **Chèques reçus**: fields n°, bank, drawer (customer or other third party), amount, received date, due date (or "à vue"), invoice/BL reference. Life cycle: **En portefeuille → Remis en banque → Encaissé** or **Impayé** (reason: provision insuffisante, sans provision, signature, périmé, opposition…, can be re-presented) ; or **Endossé** to a supplier ; or **Annulé**. Each change is dated, noted and audited (history). KPIs: en portefeuille, à échéance sous 7 jours, remis en banque, encaissés, impayés. Accountant records, Contrôle reads.

## 10. Magasin (formerly Stock)

- [D] Menu **Magasin** has 3 sub-sections: **Pièces de rechange** (to be designed), **Gasoil**, **Huiles et graisses**. Hidden from the Caisse poste.
- [D] **Produits** (stock of finished products) moved out of Magasin: it is now **Point de vente › Stock produits**, visible to **all 4 postes**. Caisse sees quantities only; the others also see the sale price.
- [D] Gasoil and Huiles share the same screen: KPI cards (stock, entrées, consommation, coût), tabs **Stock / Entrées / Consommation / Par machine**, period filter (Ce mois / Mois précédent / Tout), totals row under every table.
- [D] **Gasoil**: 2 tanks, **Citerne Bouaanfir** (capacity 20 000 L [A]) and **Citerne Nfifa** (15 000 L [A]); per-tank stock, minimum threshold alert, tank-overflow check on entry, "% plein". "Par machine" shows litres, cost, hours and **litres per hour**.
- [D] **Huiles et graisses**: list of products (Huile moteur 15W40, Huile hydraulique HV46, Graisse industrielle…) each with a unit (L, kg, Fût, Bidon, Unité), minimum threshold and unit price; **« + Nouveau produit »** adds any other oil, grease or lubricant.
- [D] **Saisie du jour** (Gasoil and tracked-by-machine oils): one table listing **every machine (Machines) and every truck (Parc)**; the accountant copies the daily paper sheet from the atelier manager, types the quantity in front of each consumer (blank = nothing consumed), optional counter hours, tank pre-filled from the machine's site (changeable); live remaining stock per tank; **one « Enregistrer tout »**. No « copy yesterday » button.
- [D] **Saisie du jour has two tabs, Bouaanfir and Nfifa**: each tab lists only the machines/trucks served by that tank, so each person fills their own part and cannot change the tank (no Citerne column). **Usine Agglos machines are served by Bouaanfir.** A badge on each tab counts filled lines; values are kept when switching tabs; one « Enregistrer tout » saves both. Oils use the same tabs. The modal fits the screen and the save button stays visible.
- [D] **Fiche per product / per tank**: click a name in the Stock tab. Shows stock, threshold, average cost, value, entrées/consommation of the period, and tabs **Mouvements** (with running **Solde** from the initial stock, totals row), **Par machine** (only for products tracked by machine, not greases) and **Fournisseurs** (deliveries, quantity, amount, last and average price). Buttons: + Entrée and Inventaire (pre-selected on that product), **Modifier** (name, unit, threshold, tank capacity). Same page for each tank (Citerne Bouaanfir, Citerne Nfifa).
- [D] **Greases** (and any product created with "Suivi par machine = Non") are tracked by **quantity only**: entries, daily consumption, cost and stock, **no machine/truck**. Oils (15W40, HV46…) stay tracked per machine.
- [A] Trucks come from **Parc** and later also from **Location** (equipment/truck rental). Placeholder list of company trucks until those sections are designed. **Location** will be a full section for renting out equipment and trucks, tracked in every detail (to be designed).
- [D] À saisir is **not touched for now** (the "Sorties de gasoil du jour" link to the Saisie du jour screen is deferred until À saisir is redesigned).
- [D] Movements: **Entrée** (date, tank/product, supplier, bon/facture n°, quantity, unit price HT) and **Sortie** (through Saisie du jour: date, tank/product, machine or truck, quantity, counter hours optional). A sortie larger than the stock is refused. **Inventaire**: enter the measured quantity; the gap is recorded as an entrée/sortie with reason "Inventaire" (audited).
- [D] Valuation: **weighted average cost (CMUP)** per tank/product; every sortie is valued at the average cost of the moment; the cost is meant to feed the machine costs [A: link to Machines costs not yet built].
- [D] **Who records**: the accountant (Poste 3) records everything; the DG can too. Contrôle sees read-only. Caisse sees nothing here.
- [D] **Prices**: Gasoil/Huiles prices and costs are visible to **DG, Contrôle and Comptabilité** (not Caisse). This is an exception to the earlier rule "accountant sees no cost prices"; it applies to fuel, oils and spare parts [A]. Salaries, margins and factory costs stay DG only.

## 11. Parc (formerly Machines)

- [D] Quarry machines and factory machines, **hours meter**, maintenance **by hours or by days**, interventions, parts replaced, costs, failures.
- [D] Recurring part alert: the same part replaced **3+ times within 180 days** → warning, with a "cause" field on each intervention.
- Maintenance status: ok / soon / late (late if over the due hours/date). Cost per hour = total cost / hours metered.
- Menu badge: count of late maintenances.

- [D] The former **Machines** section is renamed **Parc**: machines **and trucks** (new type *Camion*, with a capacity in m³ for tipper trucks). Crushers and screens stay in Parc with their hours, maintenance and parts. The empty "Parc" menu entry is removed (merged). Rented machines/trucks will live in **Location** (later).

## 11b. Oued (extraction of Tout-venant)

- [D] Two sites: **Bouaanfir (Saaidate)** and **Nfifa**. Tout-venant is extracted by an engine and carried by trucks to the crushing site.
- [D] **Saisie du jour** (one table, recorded by the accountant from the site manager's paper): per truck the **number of trips** (quantity = trips × truck capacity, **in m³**), per engine and per rented truck the **hours**. Rows: own engines/trucks from Parc + rented ones. One « Enregistrer tout »; re-saving a date replaces it.
- [D] **Rented equipment** comes from the **Location** fleet (paid by the hour, price differs per owner, total paid at month end or on request). Oued shows hours × rate and a "Location par propriétaire" statement.
- [D] Tabs: Journal, Camions, Engins, Coûts. KPIs: trips, m³ extracted, hours, **cost per m³** = fuel (Magasin) + rent (from Location fleet) + maintenance of own equipment + **labour of the employees and drivers assigned to the oued** (monthly salary ÷ 26 per day, from Personnel; shown to the DG only, others see the cost without labour).

## 11c. Carrière (crushing and production lines)

- [D] Section name **Carrière** (the owner calls a line "Machine"). Lines: **Bouaanfir · Ancien Machine**, **Bouaanfir · Nouveau Machine**, **Nfifa · Machine**. Each line is linked to its crusher(s) and screen from **Parc**.
- [D] **Quantities are the sales** (m³ sold in the Caisse), not an estimate of production. No campaigns, no pile survey for now (owner decision: keep it simple).
- [D] **Saisie du jour** per line: hours, Tout-venant consumed (m³), products in progress (tags, several allowed), optional stop (cause + minutes).
- [D] **Sales per line in Bouaanfir without any extra Caisse step**: a product may come from both lines. Rule: if only one line ran that day, all its sales go to it; if both ran, the accountant may enter "dont Nouveau Machine (m³)" per product, otherwise it is split **pro rata of hours**; with no record, the product's **main line** (catalogue field *Ligne principale*). Nfifa: all sales to its single line.
- [D] Tabs: Journal, Ventes, Arrêts, Équipements. KPIs: hours, Tout-venant consumed, sales of the line, sales ÷ Tout-venant (indicative: part of the material is lost with washing and soil).
- [D] Costs of Oued/Carrière: visible to **DG, Contrôle and Comptabilité**, not to the Caisse (same rule as Gasoil). Accountant records, Contrôle read-only, Caisse sees neither section.

## 11d. Stock illimité

- [D] **Quarry products** (Tout-venant, Grave, Gravettes, Sable… everything not made by Usine Agglos) have an **unlimited stock**: the Caisse shows "Stock illimité" and never blocks a sale for lack of stock; only sold quantities are tracked. Bricks, hourdis, etc. keep their computed stock.
- [D] Catalogue: quarry products no longer have an initial stock field; they have a **Ligne principale** (Ancien Machine / Nouveau Machine for Bouaanfir, Machine Nfifa). A product belongs to one site only (no sand at both sites). Placeholder data: Gravette 8/16 and 15/25 moved to Bouaanfir.

## 12. Credit, blocking and VAT rules

- [D] Credit ceiling exceeded blocks **Crédit** only (cash still allowed). Warning from 80 % of the ceiling.
- [D] DG can block a **client** or a **truck** (two kinds), with a reason; blocks all sales, shown from the start in the Caisse. DG can lift it **once** (mandatory reason, audited, one operation).
- [D] VAT: client mode **HT** (no VAT) or **20 %**; BL shows HT, VAT, TTC.
- [D] Cash sale → status Facturé (paid at counter); credit sale → À facturer → invoice.

## 13. Usine Agglos

- [D] Production counted **daily for the whole factory** (not per machine); **daily breakage** recorded. Bricks **dry first** (default 7 days, configurable) then are sold; stock ready = initial + net production dried − sales.
- [D] Materials: sand and gravel from the quarry (internal transfers), cement bulk; consumption = theoretical from recipes, or actual if entered.
- [D] Cost per mille = materials + labour (salary/26 × days assigned to the factory) + electricity (Δ kWh × tariff, **factory sub-meter**) + factory machine maintenance + purchases tagged "Usine". **No overhead allocation.** Margin per product.
- [?] kWh tariff (1,50 placeholder), cement price per t (1 050 placeholder), drying days (7), real recipes, final product list.
- Screens: Tableau de bord · Saisie du jour · Matières · Produits finis · Coûts et marge · Paramètres.

## 14. Personnel

- [D] Sub-sections: **Employés** (list + fiche), **Présences** (daily sheet), **Alertes**, **Statistiques**, **Paie** (DG only). 26 working days/month. Salaries and pay visible to the **DG only**; the accountant records everything else (new employee, presences, hours).
- [D] **Fiche employé**: full name, CIN (+ expiry), birth date, phone, address, person to contact, family situation and children, CNSS n°, RIB, position, usual assignment (Usine Agglos / Carrière / Oued / Bureau) and site (Bouaanfir / Nfifa / Usine / Siège), **contract** (CDI, CDD, ANAPEC, Saisonnier, Journalier; start, end; end of trial period), driving licence expiry, next medical visit, active/left. Tabs: Profil, Contrat et documents, Absences, Heures supplémentaires.
- [D] **Alertes**: automatic reminders (contract end 30 d, trial end 15 d, CIN 60 d, licence 60 d, medical visit 30 d) + **personal reminders with a date set by the owner** (title, date, days before, optional employee). Count shown as a badge on Personnel.
- [D] **Présences** (daily, one save): assignment of the day, status (Présent / Absence non justifiée / Absence justifiée / Maladie avec certificat / Accident de travail / Congé payé / Congé sans solde), lateness (minutes), **overtime hours ×125 % and ×150 %**, supporting document (type, received yes/no). Sunday = rest day, only hours worked are entered.
- [D] **Overtime hour rate = monthly salary × 12 ÷ (52 × 44)**, i.e. salary divided by 44 weekly hours; the multipliers 125 % (working days) and 150 % (Sunday, holidays, night) are **example values to confirm** (editable by the DG in Paie).
- [D] **Statistiques** (Aujourd'hui / Ce mois / Mois précédent / Tout): attendance rate, absences by type, non-justified, lateness, overtime, absenteeism per month, per-employee table with an assiduity bar; DG sees the cost of unpaid absences and overtime value.
- [D] **Paie** (estimate): base salary − unpaid days (salary ÷ 26) + overtime = net estimate; excludes CNSS, AMO and IR [A].
- [D] **Links**: the daily assignment feeds the cost of Usine Agglos (cost per mille) and of **Oued** (salary ÷ 26 per day worked by the employees/drivers assigned to the oued, per site). Even though employees are paid monthly, labour cost is split automatically per day. Absent employees are not counted.

## 15. À saisir / À contrôler / Clôture

- [D] Recurring tasks per poste: daily, weekly, monthly, quarterly, yearly; undone tasks **stay pending** (late). Mandatory tasks (owner decides which) **block the day closure**; none mandatory yet. Current catalogue = examples.
- [D] "Clôturer ma journée" per poste; the DG can reopen (audited).
- [D] **À contrôler** (Contrôle poste): per-day items in order (BL grouped by client, supplier invoices, payments, factory production, assignments, machine interventions, closures), "Marquer vu" per item and per section; **Approuver la journée** only when all seen.
- [?] Which tasks are mandatory; whether Poste 2 gets more sections later.

## 16. Calculation rules summary

- Money `Decimal` 2 places; VAT on HT; price per m³ = price per t × density (tv 1,7 · gr 1,8 · gravettes 1,5 · sable 1,6) [A].
- **Reste (caisse) = cash received − cash expenses** (same day).
- Cost per mille, margin, drying and stock: see section 13.
- Totals row under every summable table; blue header and total rows; sticky headers.

## 18. Interface rules (v40)

- [D] **Buttons**: no more black. Primary buttons, selected tabs and selected chips use a vivid blue (`--act`).
- [D] **Key card**: in every statistics page the most important figure is shown in a colour card (blue gradient); alerts use the yellow card.
- [D] **Periods**: every statistics page offers **Aujourd'hui · Ce mois · Mois précédent · Tout** (the older pages keep the global Période bar).
- [D] **Print buttons (v58, replaces the page-level « Imprimer cette page » of v40–v56)**: there is **no print button for a whole page**. Instead a small « Imprimer » button sits **under every table that has a totals row** and **under every statistics card** (chart or bars). It prints **only that table or statistic**: SOCOBO header, page title, subtitle (tab, period, filter), the table title, then the table with its totals row and without the « Actions » column. It prints **all rows of the current filter**, not only the rows shown (« Afficher plus » is expanded first). KPI number cards have no button. Tables inside windows, line-entry tables of forms, Paramètres and Audit have none.

- [D] **Chronological order (v56, principle for the whole application)**: every list, table and statement that is ordered by time or by number is shown **from the oldest to the newest** (invoice numbers 1, 2, 3…, dates increasing, statements with a running balance, audit log). Lists capped to the last N items (last 40 entries, last 30 BL…) keep the **latest N**, shown oldest first. Only rankings by amount or importance (best clients, biggest categories) and selectors (period chips) keep their own order.

## 19. Location (renting trucks and engines from owners)

- [D] A **loueur** is also a **supplier** (category *Location*): created from Location, appears in Fournisseurs, and the account is shared (validated statements = invoices, payments = règlements).
- [D] Sub-sections: **Loueurs** (list + fiche), **Décomptes** (monthly statements for all loueurs), **Rendement**.
- [D] **Fleet of a loueur**: unit (truck with capacity m³, or engine), **price per hour** (differs per owner), **who pays fuel** (us / the loueur), **who pays repairs** (us / the loueur), usual site. Add a unit in a few clicks.
- [D] **Hours** come from Oued › Saisie du jour (and a manual "heures hors oued" for other uses). Gross = hours × price.
- [D] **Deductions**: fuel we supply (taken from Magasin › Gasoil; rented units whose fuel is ours appear in the fuel Saisie du jour) and **repairs done in our garage / spare parts we give him** when they are his responsibility. Net HT = gross − deductions; TVA per loueur; TTC.
- [D] **Décompte** per month: provisional until the month ends, then **validated** (creates the invoice in the supplier account). **Règlements** (virement, espèces, chèque) are allocated to the oldest invoices; balance = billed − paid. Paid "at month end or on request".
- [D] **Rendement per unit**: hours, utilisation (hours ÷ working days × 8 h), trips and m³ for trucks, cost per hour and per m³.
- [A] Spare parts link to Magasin › Pièces de rechange when that section is designed.

## 20. Charges (general company expenses)

- [D] New top-level section **Charges**: everything the company spends **outside** cash expenses (Dépense), fuel and oils (Magasin), rent of machines (Location), maintenance of the Parc and salaries.
- [D] Sub-sections: **Tableau de bord**, **Journal**, **Récurrentes**, **Budgets**, **Coûts globaux**.
- [D] **Charge**: date, **13 categories with sub-categories** (loyers, énergie et eau, télécoms, assurances, honoraires, impôts et taxes, frais bancaires, bureau et entretien, déplacements, publicité, personnel hors salaires, sécurité et environnement, divers), beneficiary (linked to the supplier list), n° of the piece, **HT, TVA (20/14/10/7/0) and TTC**, **cost centre** (Siège, Bouaanfir, Nfifa, Usine Agglos, Parc, Général), payment mode, status Payé / À payer with due date. Edit by DG and accountant, delete by DG, audited.
- [D] **Dashboard**: total TTC (key card, with change vs previous period), HT, recoverable VAT, amount to pay (overdue highlighted), 6-month trend, next due dates, split by category, by cost centre and top beneficiaries, budget alerts.
- [D] **Récurrentes**: monthly / quarterly / annual charges (rent, electricity, insurance, accountant, guarding, CNSS part patronale, professional tax…); equivalent monthly and yearly fixed charges; "Générer ce mois" creates the due charge; pause/resume.
- [D] **Budgets**: monthly budget per category (set by the DG), actual vs budget, % consumed, statuses (dans le budget / attention ≥ 90 % / dépassé) and an alert on the dashboard.
- [D] **Coûts globaux**: one page with all costs of the company by nature (charges, fuel, oils, rental, Parc maintenance, caisse expenses, labour [DG only]) and their share.
- [A] Amounts are examples. Not included: purchases of factory materials, depreciation.

## 22. Interface and Paramètres (v41)

- [D] **Période bar** (Du/Au) in the header only on Dashboard, Historique, Fournisseurs and Clients; hidden elsewhere. In daily screens the **Jour** selector sits in the top bar.
- [D] **À contrôler**: approved days green, partially checked days amber; "Éléments vus" and "Approbation de la journée" turn green when complete.
- [D] **Section titles** are visible bars with count badges everywhere; **tabs** are bordered and visible, never floating.
- [D] **Key colour card** (blue): Clients → Reste à encaisser; Fournisseurs → Reste à payer. Other dashboards to be chosen by the owner.
- [D] **Print**: total rows readable (dark text on pale background).
- [D] **Usine › Saisie du jour**: one product row (Hourdis 12/20K) plus an "Ajouter" button for other types.
- [D] New **Paramètres** section (DG only) centralising all settings: Entreprise, Prix et tarifs, Usine, Personnel, Magasin, Charges, Banque, Location, Listes. Entreprise moved out of Utilisateurs (which keeps roles, tasks, accounts). Old screens link to Paramètres. Values are examples until real data is given.

## 23. Période personnalisée, Caisse m³/t, Rentabilité (v42)

- [D] **Périodes**: every period bar gets a **Personnalisé** tab with Du/Au dates and ‹ › arrows (one day = Du equal to Au). No future dates; Au cannot precede Du. Print follows the chosen period.
- [D] **Caisse**: client, truck and product cards are bordered; the chosen truck and product show a clear selected state. A switch **Vendre en : m³ (default) / Tonne** applies to each sale; the price of the chosen unit is highlighted. Densities (t/m³) are set in Paramètres › Prix et tarifs and convert t ↔ m³. Bricks stay per mille.
- [D] **Oued › Journal**: the Gasoil total now equals the sum of the day rows (it ignored fuel given to rented machines).
- [D] New **Rentabilité** section (DG only): result per centre (Bouaanfir, Nfifa, Usine Agglos) = sales − direct costs (labour, fuel, oils, net rental, Parc maintenance, own charges); then general costs (head office, general charges, caisse expenses) allocated pro rata to sales or left unallocated (Paramètres › Rentabilité). Gross and net result, margin, profit per m³ extracted (quarries) and per mille (factory).
- [D] **Internal sales**: quarry materials used by the factory are charged to the factory at the quarry's cost per m³ (+ optional markup %), credited to the quarry, and cancel out at company level. Consumption per mille is a parameter (example values).
- [A] Not included yet: purchases of cement and other factory materials, depreciation. Point de vente has no centre of its own because its sales are already counted under the producing centre. All figures are examples.

## 24. Prices per brick and recipe per batch (v43)

- [D] **Bricks are priced and costed per single brick**, never per thousand: sale price, cost of a brick, margin per brick, profit per brick. Brick prices show 3 decimals (1,450); other amounts keep 2. Quantities stay in bricks. Factory employees keep their monthly salary (salary ÷ 26 per day).
- [D] **Recipe per batch (gâchée)** of the mixer, not per thousand. Mixer capacity is a setting (example 800 kg, Paramètres › Usine). One recipe per product: sable concassé 0/5 (kg), gravette 3/8 (kg), adjuvant (kg), ciment vrac (kg) with its **grade CPJ 55 or CPJ 65**, and water (litres, no cost). Total without water must not exceed the mixer capacity.
- [D] **Bricks per batch** is a per-product field, shown "À renseigner" until the owner provides it. Until then the cost of that product's brick is "À renseigner" and its margin is partial. Recipe values are examples marked "Indicative".
- [D] **Daily entry (Usine › Saisie du jour)** gets a "Gâchées" column. Consumption = batches × recipe; if batches are empty and bricks per batch is known, batches = production ÷ bricks per batch. Materials in stock: sable 0/5 (t), gravette 3/8 (t), CPJ 55 (t), CPJ 65 (t), adjuvant (kg). Cement prices per grade and adjuvant price per kg are in Paramètres › Prix et tarifs. Water is not tracked.
- [D] **Densities** (t/m³) per quarry product are in Paramètres › Prix et tarifs and convert t ↔ m³.
- [D] **Rentabilité**: the factory's sand and gravel come from the recipe consumption (converted to m³ with the densities) and are charged at the quarry's cost per m³ (+ optional markup); cement and adjuvant are costed at purchase prices. The old "m³ per mille" setting is removed.
- [A] Examples used (kg per batch): brique 8 trous 420/290/80 CPJ 55/1,5; brique 12 trous 400/280/100 CPJ 55/1,5; hourdis 16 340/240/190 CPJ 65/3. Demo history uses hidden bricks-per-batch values to generate batches. All to be replaced by real figures.

## 25. Paramètres in one page, Point de vente order, Pièces de rechange (v44)

- [D] **Paramètres** is a single sidebar entry without sub-menu. The page has tabs: Entreprise, Prix et tarifs, Usine, Personnel, Magasin, Charges, Rentabilité, Banque, Location, Listes and **Utilisateurs** (Postes, Tâches à saisir). Utilisateurs is removed from the sidebar. DG only. Audit stays in the sidebar.
- [D] **Point de vente** order: Caisse, Dépense, Stock produits (Produits last, for DG and accountant).
- [D] **Magasin › Pièces de rechange**: same engine as Gasoil and Huiles (stock, weighted average cost, Entrées, Sorties, Par machine, Inventaire, fiche per item). Each reference has a group (Filtres, Courroies, Freinage, Électricité, Hydraulique, Joints, Roulements, Godets), a threshold and a unit.
- [D] **Purchases are tracked per item with quantity and price.** Every spare-parts invoice is entered **with its lines** (one line per item). The same form is used from Fournisseurs (destination "Pièces de rechange") and from Magasin (button "+ Facture (entrée)", which asks for the supplier first). Saving records the invoice at the supplier (amounts due, due date) and enters each line in stock at its price.
- [D] **Exits** record the item, quantity, **who received it** and **where it was installed** (Parc machine, rented equipment, or "Hors machine"). The quantity cannot exceed the stock. The exit is stamped with the user and cannot be edited. For an own machine, the exit adds the part and its cost to a "Pièces sorties du magasin" intervention of that machine in Parc (same day exits are grouped), so the cost reaches Parc, Charges › Coûts globaux and Rentabilité once.
- [D] **Caisse (Point de vente role) gets a Magasin section** (Pièces de rechange, Huiles et graisses, Gasoil): it sees only the available quantity and a status (Disponible / Stock faible / Épuisé) and can only record exits. No entries, no inventory, no prices, no value, no supplier. Its recent exits (30 days) are listed without cost. Contrôle sees everything read-only, with prices. Server-side enforcement of these limits is required in the real build.
- [D] **Opening stock** is entered once through Inventaire when going live. The demo references and quantities are examples.
- [A] Not yet: low-stock alert in À saisir, link of exits on rented machines to the owner's statement, spare-parts photos.

## 26. Accounts and product order (v45)

- [D] **Utilisateurs › Comptes** (Paramètres, DG only): one account per person. Table with name, identifier, Poste, state (Actif / Désactivé), last access. Button **+ Nouvel utilisateur**: full name (suggested from Personnel), identifier (3+ characters, unique), Poste (one of the four roles, with a summary of what it sees), phone, temporary password (generated, shown once, to be changed at first login).
- [D] Actions per account: modify (name, Poste, phone), reset password, deactivate / activate. **An account is never deleted** (the audit log keeps the name). The last active Direction account cannot be deactivated or change Poste. One account per person, no duplicate names. All actions are audited.
- [D] Only the DG creates and manages accounts; the accountant cannot.
- [A] The prototype has no real login. Real authentication (hashed passwords, sessions, forced change at first login) is built in Django.
- [D] **Product order** (Point de vente › Produits, DG only): drag handle plus ▲ ▼ buttons; saved immediately and audited. New products go last. Reordering is disabled while the search or site filter is active. **The same order applies everywhere**: Caisse cards, Stock produits, Usine (add-a-product list), Paramètres. The Caisse no longer sorts by most sold.

## 27. À saisir: guided day for the accountant (v46)

- [D] **À saisir** (Comptabilité et saisie, also the DG preview) is now a **guided, ordered day** instead of a flat list. Day chips (today, yesterday, day before) show what remains. Numbered sections with a progress badge (n / total), green when complete:
  1. **Production**: Présences du personnel; Oued Bouaanfir; Oued Nfifa; Carrière (Ancien Machine, Nouveau Machine, Machine Nfifa); Usine Agglos production.
  2. **Magasin**: Gasoil citerne Bouaanfir; Gasoil citerne Nfifa; Huiles et graisses; Pièces de rechange (invoices received).
  3. **Comptabilité**: supplier invoices, payments and collections, invoicing of the day's BL.
  4. **À échéance**: weekly, monthly, quarterly and annual tasks (cheques, bank statement, CNSS, VAT, annual documents), late ones first.
- [D] **Automatic detection**: a task is "Saisi" (green) as soon as the data exists for that day (Oued, Carrière, Usine, gasoil exits per tank, oil exits, parts invoice lines, presences). Otherwise buttons **Ouvrir** (goes to the right screen and tab) and **Rien à signaler** (or **Fait** for accounting tasks), stamped with time and user.
- [D] A top card shows the day progress bar (blue, then green when everything is entered). Closing the day stays as before.
- [A] Pdv tasks keep their own short list (Caisse, Magasin, Production, Parc). Which tasks are mandatory is still to be decided (Utilisateurs › Tâches à saisir).

## 28. Back button on every page (v47)

- [D] A **Retour** button sits at the top left of every page (header), with the keyboard shortcut **Alt + ←**. It returns to the previous screen exactly as visited (menu page and sub-tab, supplier, client or machine detail). It is disabled on the first screen.
- [D] On a page with an inner detail view (Magasin item, Location, Personnel…), **Retour first closes the detail** and returns to its list, then to the previous screen.
- [D] The history is per session and cleared when the Poste changes. Not available while a dialog is open.

## 29. Data entry from À saisir (v48)

- [D] The accountant **enters the day's data directly from À saisir**. The button **Saisir** opens the entry form on top of the page (no navigation); after saving, the task turns green and the page is refreshed. A done task shows **Modifier**.
- [D] Production tasks: **Présences et heures supplémentaires** (one table: present, absent, late, overtime ×1,25 / ×1,5, daily assignment); Oued Bouaanfir and Nfifa; Carrière (3 lines); Usine production with batches and breakage. Magasin tasks: Gasoil per tank, **Huiles** (litres) and **Graisses** (kg) as separate tasks, Pièces de rechange invoices.
- [D] A task is green only when **real data exists** for that day. When nothing happened, the accountant uses **Aucune activité** and picks a reason (stop, breakdown, weather, holiday or rest, nothing consumed, other) with an optional note; it is recorded with user and time. No silent "nothing to report". Présences has no such shortcut.
- [D] "Marquer vu" and "Approuver la journée" stay in À contrôler, for Contrôle only.
- [A] Requests listed as "etc." (counter readings of machines, hours of rented machines, parts exits) are not tasks yet: rented machine hours are already in the Oued entry, parts exits are recorded by Caisse. To confirm.

## 30. Carrière: products and tout-venant stock (v49)

- [D] Carrière products are managed **per line** (add, rename, remove) in the Carrière entry.
- [D] **Tout-venant consumed** is computed from the **feed trucks × number of loads** (the accountant picks the truck and types the number of loads). The **stock pile ("tas")** = Oued input − Carrière draw.

## 31. Présences: hours and daily assignment (v50)

- [D] The Présences table has a **Heures travaillées** column (replaces the H. sup ×1,25 column); the overtime column is simply **H. sup**.
- [D] The default daily assignment is **Carrière**; **Atelier** is an extra option.

## 32. Internal worker number (v51)

- [D] Every worker has an **internal sequential number** (`M-0001`…), generated automatically, never typed. The CNSS number stays a separate field.

## 33. Modal scroll lock (v52)

- [D] While a dialog is open, the page behind it does not scroll (scroll lock on the page, `overscroll-behavior: contain` on the dialog).

## 34. One back button (v53)

- [D] Only the **global Retour** button exists; the in-page back buttons are hidden. Retour also closes an inner detail view first.

## 35. Facturation (v54, refined in v55, restructured in v56)

- [D] A **Facturation** menu item (after Point de vente; visible to DG, Comptabilité, Contrôle) with **two** sub-sections: **Carrière** (the former Espèces and Chèque merged) and **Usine Agglos**. Invoices are a **document layer separate from sales**: nothing here changes the Caisse, the daily takings or sold quantities.
- [D] **Numbering**: one **automatic sequential series per sub-section, continuing across days, no gaps, whatever the payment mode**: Carrière `FC-2026-0001` (cash, cheque, effet and transfer invoices share the same series), Usine Agglos `FA-2026-0001`. A cancelled invoice keeps its number (never reused). A refused invoice (validation error) never consumes a number.
- [D] Invoice lines show **prices HT in every sub-section**; **TVA and TTC are at the foot**. Amount in French words on the print; reprint is marked **Duplicata**.
- [D] **Quantities**: m³ for quarry products (a BL weighed in tonnes is converted with the densities of Paramètres › Prix et tarifs, the unit price becomes a price per m³, the total stays the same); **briques / hourdis / parpaings are counted per piece**; cement purchases are in tonnes. The unit "t" is no longer offered in the invoice forms.
- [D] **Top of every sub-section**: a visible blue **« + Créer une facture »** button (it becomes « Fermer la nouvelle facture » while open). The creation form is **closed by default** and opens only on that button. After **Facturer** the invoice goes straight to **Factures émises** (no preview window, printing is done from the table), the form stays open and empty (client, date, payment mode kept) to enter the next one; **Vider** empties and closes it.
- [D] **Carrière cards** (TTC, period chips Aujourd'hui · Ce mois · Mois précédent · Tout · Personnalisé, default « Tout », by invoice date, cancelled invoices excluded): **Total facturé** (key card), **Total espèces facturé**, **Total chèque facturé** (chèque and effet), **Total virement facturé**.
- [D] **Carrière payment modes**: Espèces, Chèque, Effet, Virement. Chèque and effet: the piece number is entered **once** and the cheque is **created automatically in Banque › Chèques reçus**, the **Statut comes from Suivi des chèques**. Virement: reference. Espèces: no payment field. « Client de passage » is offered for Espèces only.
- [D] **Carrière › import of cash BL**: filter **Jour** or **Période (Du / Au)**; the BL table stays empty until **Importer** loads the cash BL copies of that filter. Importer never duplicates a BL already in the list and never re-imports an invoiced BL; a BL removed with **Supprimer** comes back (fresh, as issued by Caisse) at the next Importer. **Éléments retirés** restores the edited copy.
  - Columns: N° BL, Client, Immatriculation, Quantité, Désignation, Prix unitaire TTC, Total TTC (v57: prices are TTC on screen). Per row: **Modifier** (inline), **Supprimer** (only from Facturation), **Imprimer**, **Facturer** (one BL = one invoice, created directly, toast with the number).
  - **Tout facturer (n)**: one invoice **per BL, exactly as edited**, consecutive numbers, a confirmation lists them before creating. **Facturer la sélection**: groups the ticked BL, one invoice per client, created directly. **Both buttons are hidden while there is nothing left to invoice** (empty table or everything already invoiced); **Facturer la sélection** is disabled until a BL is ticked. Their invoices have payment mode Espèces.
- [D] **Factures émises** (both sub-sections), oldest first: N° de facture, Date, Client, BL, Mode de règlement, N° de la pièce, Total HT, Total TTC, Statut, Actions (Carrière); the same without BL, mode and piece for Usine Agglos.
- [D] **Usine Agglos cards**: **Total facturé** (key card) and **Total ciment acheté** (TTC, period chips). Quantities in briques (or m³).
- [D] **Usine Agglos › Factures de ciment importées**: button **« Importer facture fournisseur »** lists the invoices of the suppliers of category **Ciment** (Fournisseurs) not yet imported. Importing is a **link, not a copy**: the invoice stays in the supplier account (its status Payée / À venir / En retard follows the payments there), it cannot be imported twice, and **Retirer** only removes the link. Table: N° de facture, Date, Fournisseur, Désignation, Quantité (t, when known), Total TTC, Statut, with a total row. **Exception to the rule « the accountant sees no supplier amounts »**: DG, **Comptabilité** and Contrôle all see this card and table; Comptabilité and DG import and remove, Contrôle reads. [A] Demo supplier « Ciments du Sud SARL » (category Ciment) added for the example.
- [D] After issue an invoice can be **edited** (prices entered HT) and **cancelled** by **DG and Comptabilité**. Each edit creates a version (v2, v3…) with history, **visible to DG and Contrôle only** (version badge and Historique, oldest first). **Annuler** (reason required) keeps the invoice listed as "Annulée"; its BL return to "à facturer". Every change is audited. Caisse sees no Facturation.
- [?] Cement purchase invoices tagged « Usine » are also counted in « Achats destinés à l'usine » of the factory cost, while the cement consumed is costed from the recipes: check there is no double counting before the real build.

## 36. Caisse BL numbering and client receipt (v54)

- [D] New BL use two series: **`BLE-2026-00001`** (espèces) and **`BLC-2026-00001`** (crédit), each starting at 1. Numbers on the demo data are symbolic.
- [D] Every client payment (Encaissement) produces a **Reçu d'encaissement `REC-2026-00001`**: client and company copies, amount in digits and French words, mode and reference, **"Sous réserve d'encaissement"** for chèque and effet, balance remaining after the payment, **Duplicata** on reprint. A **Reçu** button sits on each payment in the client file.
- [A] In the prototype the REC number is assigned lazily the first time a receipt is opened; in the real build it is assigned when the payment is recorded.

## 37. v56 summary

- [D] Facturation restructured into **Carrière** and **Usine Agglos** (§35). Top-bar print button removed; chronological order principle (§18). « Sable 0/4 » renamed « Sable lavé concassé 0/5 » (§7).
- [D] **Factory cost, materials with a supplier invoice in TTC**: cement (CPJ 55, CPJ 65) and adjuvant are costed at the **invoice price TTC**. Paramètres › Prix et tarifs fields are labelled « TTC » and the cost lines of Usine and Rentabilité say « TTC ». Electricity, maintenance, labour and the sand and gravel transferred from the quarry are unchanged. [A] The example values (cement 1 050 per tonne…) are now read as TTC prices, not converted; replace them with the real invoice prices.

## 38. Prices TTC, agreed client prices, Tout vider (v57)

- [D] **Prices are shown and typed TTC everywhere on screen**: Produits (a single « Prix TTC » column replaces « Prix HT » and « Prix TTC (20 %) »; the product form takes the price TTC per t, per m³ or per brick), Caisse (cards show TTC per t and per m³ or per brick; the ticket shows only **Total TTC**, no HT or TVA lines; the brick price box reads « Prix TTC »), the printed A6 BL (columns Prix TTC and Total TTC, only the Total TTC sum), Historique des pesées, and all of Facturation (BL table, creation form, edit of a BL or an invoice, « Tout facturer » confirmation, BL print). The column « Total HT » is removed from the table « Factures émises ». Internally the HT price is still stored and derived (÷ 1,20, or ÷ 1,00 for an HT-exempt client) for VAT and accounting.
- [D] **The printed invoice keeps HT, TVA and TTC** (a legal requirement); everything else on screen is TTC.
- [D] **An HT-exempt client** (TVA mode « HT ») has TTC = HT: the Caisse shows him the price without VAT.
- [D] **Agreed client prices (« Prix convenus »)**: in the client file (new-client form and a new tab « Prix convenus » of the client file). Each line = a product + a price **TTC**: per m³ and/or per t for quarry products (if only one is given the other is derived with the density), per brick for bricks. Button « + Ajouter un prix » adds another product, × removes a line. A product can appear once per client. **Only the DG sets and changes these prices**; Comptabilité and the others read them. Changes are written to Audit.
- [D] **In the Caisse**, when the client is chosen, the cards, the quantity panel and the ticket use his agreed price, with a green « Prix client » tag on the card. Products without an agreed price keep the normal price. Past BL never change.
- [D] **« Tout vider »** (Facturation › Carrière, next to « Facturer la sélection » and « Tout facturer », red, shown only when un-invoiced BL are in the table): after a confirmation it removes all un-invoiced BL of the filter from the list (invoiced BL stay). The Point de vente is unchanged; the removed BL are under « Éléments retirés » with « Restaurer ». Written to Audit.
- [D] **Alignment**: the fields of a form row (Client, N° de facture, Date…) all start on the same line whatever the hints under them; in the inline edit of a BL, the unit « m³ » sits beside the quantity and all fields share one centre line.
- [?] Example value: Atlas Travaux SARL has an agreed price Gravette 8/16 at 190,00 TTC per m³ (normal 198,00).

## 39. Facturation form, units, live totals, dates (v58)

- [D] **« Créer une facture » (Carrière)**: the first field is **Mode de règlement** (Espèces, Chèque, Effet, Virement), then Client, N° de facture, Date on one line. The chosen mode shows its extra fields on a second line (cheque or effet: N°, Banque, Échéance; virement: référence). « + Ajouter un client » is replaced by a round **« + »** button beside the client list (tooltip « Ajouter un client »). Usine Agglos keeps Client, N° de facture, Date.
- [D] **Close button**: a **×** at the top right of the form (and the Escape key) closes it and drops the draft. « Vider » empties the fields but keeps the form open.
- [D] **Units in Facturation**: « m³ » and **« Unité »** (replaces « briques »: it covers bricks, hourdis and parpaings). Quantities by the piece read « 1 000 unités ». Usine Agglos defaults to Unité, Carrière to m³. The Caisse and the factory pages keep the word « briques ».
- [D] **Live total**: while a BL is edited in the table, the line « Total TTC » and the table total change at every keystroke (decimal comma or point accepted).
- [D] **Date fields**: typing a date by hand or picking it in the calendar works in the Jour / Période filter of Facturation and in the day field of the top bar (Présences, Saisie du jour, À contrôler, Dépense); the field is no longer redrawn while it is being typed.
- [D] « Factures émises » gets a **totals row** (Total TTC of the non-cancelled invoices) so that its table can be printed.

## 21. Open questions

1. Legal name on bank documents.
2. Tariffs and recipes (section 13).
3. Which À saisir tasks are mandatory.
4. Magasin › Pièces de rechange design (link with Location repairs).
5. Opening cash balance for the caisse (assumed none).
6. Real company details (address, ICE, RC, IF).
7. DG dashboard content.
8. Overtime multipliers (125 % / 150 %) and what the CNSS/AMO/IR payroll must include.
9. Real recipes, bricks per batch, mixer capacity, cement and adjuvant prices.
10. Real spare-parts references, thresholds and opening stock.
11. Real budgets per charge category, real rented fleet and prices per hour.

## 40. v59 — Saisie des dates au clavier

- Les champs date (barre du haut : Présences, Saisie du jour, À contrôler, Dépense ; période « Personnalisé » ; filtre Facturation) restent actifs pendant la saisie : le champ n'est jamais redessiné tant que l'utilisateur tape. La période « Personnalisé » s'applique quand la saisie s'arrête (≈ 1 s), à la sortie du champ ou avec Entrée.

## 41. v61 — Factures émises

- Le tableau « Factures émises » n'a plus les colonnes **BL** et **Statut**. Une facture annulée reste visible en ligne rouge (et sans boutons Modifier/Annuler).

## 42. v62 — Importer facture fournisseur et briques facturables (Usine Agglos)

- [D] **Importer facture fournisseur** works in two steps: (1) the list of **Ciment** suppliers with a search field and the number of invoices still to import; (2) the invoices of the chosen supplier, with a « select all » box and a back button. An invoice already imported is no longer offered, so it cannot be imported twice.
- [D] At import, **Type de brique** is optional (default « À définir »). It can be defined or changed later with the **Définir / Modifier** button of the imported-invoices table; the tonnes of an invoice can be split between several brick types, the rest stays « Non attribué ». New column **Type de brique** in that table.
- [D] **Ciment par pièce (kg)** is a per-product setting in Paramètres › Usine (empty = « À renseigner »). It is independent of the gâchée recipe, which stays for cost and stock only. [A] Example values are marked EXAMPLE until replaced.
- [D] Cement is one pool: CPJ 55 and CPJ 65 are not distinguished here.
- [D] New card **Briques facturables**: per brick type, cement attributed (t), cement per piece, **pieces billable = tonnes × 1000 ÷ cement per piece**, pieces billed, remaining. A factory invoice (page Usine Agglos only) line with unit « Unité » and the product name reduces the remainder immediately; cancelled invoices do not count. Unattributed tonnes are shown on a « Non attribué » row. Not affected by the period chips.

## 43. v63 — Cartes de la page Usine Agglos

- [D] Row 1: **Total ciment acheté** (all imported invoices, TTC), **Total ciment facturé** (cost of the cement in the bricks already billed = billed pieces × cement per piece × average price per tonne of the invoices attributed to that type), **Reste à facturer** (acheté − facturé, unattributed tonnes included), then **Total facturé** (sales of the factory, as before). The three cement cards are not affected by the period chips.
- [D] Row 2: one thin card per brick type that has cement attributed: **Qté reste à facturer** (pieces) and, under a thin line, **Qté facturé**. Types without attributed cement show no card (they stay in the « Briques facturables » table).

## 44. v64 — Supprimer une facture, ordre des sections Usine Agglos

- [D] Every issued invoice (Carrière and Usine Agglos) has **Modifier · Annuler · Imprimer · Supprimer** (Historique for DG and Contrôle only). **Supprimer** is the permanent deletion, for **DG and Comptabilité**, with an explicit irreversible confirmation, also available on a cancelled invoice. It is written to Audit. The BL of a deleted invoice return to « à facturer » (Carrière); the billed pieces of a deleted factory invoice return to « Qté reste à facturer ».
- [D] **Numbering**: the number of a **deleted** invoice is reused (the next invoice takes the smallest free number, per type); the number of a **cancelled** invoice is never reused. The list is ordered by invoice number.
- [D] Usine Agglos page order: cards, **Factures de ciment importées**, then **Factures émises**. The « Briques facturables » table is removed (the thin cards replace it); a thin card **Non attribué** shows the tonnes still to attribute.
- [D] Archiving a factory product returns its attributed cement tonnes to « Non attribué »; Paramètres › Usine (Ciment par pièce) and the Définir window follow the active factory products automatically.

## 45. v65 — Facture imprimée en A4

- [D] The printed invoice (Carrière and Usine Agglos) is an **A4 portrait** sheet on one page: **SOCOBO** and the city at the left, large **FACTURE** with N° at the right; company line under a blue rule; **Facturé à** block beside Date and Règlement; table with blue header (N°, Désignation with the BL, Quantité, Prix unitaire HT, Total HT); totals at the right with **Total TTC** in a blue bar; amount in words; **Signature et cachet** box; footer (phone, address, ICE/RC/IF) at the bottom of the page. Unit price HT with 2 decimals. [A] Company details are examples; no logo, bank account or payment terms until provided.

