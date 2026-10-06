# SOCOBO — design decisions

Living record of every design decision taken with the owner while the prototype (`prototype/socobo-menu.html`) is refined.
**This file is the reference for the real build.** Update it with every accepted change (add, change or remove the matching line; never leave it stale).
Convention: **[D]** = decided by the owner · **[A]** = assumption made by Claude, to confirm · **[?]** = open question.
UI language: French. Amounts: 2 decimals, no "MAD" suffix.

Prototype status: **v34** (merged in `main`). Phase: **design** (no Django code yet — see `CLAUDE.md` section 11).

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

- [D] Sold **per tonne and per m³** (aggregates; price per m³ = price per t × density) or **per mille** (bricks, hourdis…). Products: Tout-venant 0/80, Grave 0/31,5, Gravette 8/16, Gravette 15/25, Sable 0/4 (quarries Bouaanfir/Nfifa); Brique 8 trous, Brique 12 trous, Hourdis 16, Parpaing 20, Pavé autobloquant (Usine Agglos). Prices of Parpaing and Pavé: to be set.
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
- [D] **Print button under every page of statistics** ("Imprimer cette page"). The printout is organised: SOCOBO header, section title, subtitle with the tab and the period, date and user of printing, indicators, then the tables with their totals.

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

## 21. Open questions

1. Legal name on bank documents.
2. Tariffs and recipes (section 13).
3. Which À saisir tasks are mandatory.
4. Magasin › Pièces de rechange design (link with Location repairs).
5. Opening cash balance for the caisse (assumed none).
6. Real company details (address, ICE, RC, IF).
7. DG dashboard content.
8. Overtime multipliers (125 % / 150 %) and what the CNSS/AMO/IR payroll must include.
9. Real budgets per charge category, real rented fleet and prices per hour.
