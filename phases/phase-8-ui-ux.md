# Phase 8 — Final UI/UX

**Status:** ✅ Done (2026-09-29) · **Depends on:** Phases 4, 5, 6, 7 stable
**Goal:** replace the functional test pages with the final premium interface. **Presentation only**: rules, data and sync are done and must not change here.

## Guardrails (to keep integration safe)

- Pages use only hooks (`useAuction`, `useAuctionActor`, `useAuctionCommand`, `useConnectionStatus`) and engine selectors/rules. If a screen needs a new number, add a **selector with a test**; don't calculate it in JSX.
- Don't change the engine, adapters or Function. If a design needs new behaviour, it goes back to the owning phase through the contract change process.
- Keep the IPL routes lazy-loaded, and keep the loading-screen skip for `/ipl-auction`.
- Fictional data stays labelled as fictional, even in the polished design.

## Visual direction (from `Claude.md` §15–16)

Dark background, white typography, orange accent (reuse the existing Tailwind `primary` `#C9872B` and `tertiary` `#0F0F0F`), thin borders, strong hierarchy, technical data labels, restrained gradients and glass, large player photography, clean data visualisation, broadcast feel.
Avoid: generic dashboard templates, rounded cards everywhere, heavy shadows, big animations, clutter. Framer Motion is already installed; use it sparingly.

## Screens

| Screen | Route | Notes |
|---|---|---|
| Lobby | `/ipl-auction` | Event info, sign in, links by role. |
| Admin console | `/ipl-auction/admin` | Hammer controls (SOLD / UNSOLD / Undo) always visible; safe confirmation for destructive actions; keyboard shortcuts. |
| Participant dashboard | `/ipl-auction/play` | Phone-first: bid button, purse and max bid always visible; squad and needs; market. |
| Big screen (recommended) | `/ipl-auction/screen` | Read-only projector view: current player, photo, stats, live bid, bidder, SOLD animation, team purses. |
| Summary | `/ipl-auction/summary` | Final squads, spend, role mix, most expensive buys. |

Components to design: current-player hero (photo + stats by role), live bid panel, bid ladder / history, team purse strip, squad composition (role and overseas meters), market table, activity feed, auction summary.

## Tasks

1. Design tokens and a small IPL component set under `src/components/IPLAuction/ui/` (extend Tailwind; no new UI library without approval).
2. Build the screens above, one at a time, replacing `DevPanels.jsx` usage.
3. Player images: placeholders for fictional players. Real photos only with confirmed usage rights (from the Phase 4 decision).
4. Accessibility: contrast, focus states, `aria-live` on bid and SOLD announcements, reduced-motion support.
5. Performance: lazy-load images; keep the participant page fast on phones.
6. Remove or hide dev-only UI (reset button, local-adapter banner) from production builds.

## Definition of done

- [x] All screens built; `DevPanels.jsx` removed.
- [ ] A full rehearsal auction on real devices (admin laptop, projector, 8+ phones) with no functional regressions.
- [x] `npm run test:ipl` (165/165) and `npm run build` pass; no engine rule, adapter or Function file changed (one new selector with tests).

## Handoff notes

**Design decision (owner, 2026-09-29): replicate the existing Anirveda website's UI, no new visual language.** So the IPL screens use only the site's existing Tailwind tokens and patterns, with no config change and no new dependency: black / `tertiary` backgrounds, Bebas Neue headings in `primary`, Abel/Lato text in `secondary`, rounded-3xl pill buttons (as on the home page), `bg-tertiary` cards with `border-amber-600/30` (as on the events page), MockRBI-style tables, the gold ❖ divider, lucide icons, the site `Navbar` on the lobby.

**Done**
- `components/IPLAuction/ui/controls.jsx` (Page, PageHeader with the Anirveda logo, Panel, Button/ButtonLink, Tabs, StatTile, Tag, Divider, Spinner, `table` and `inputClass` tokens) and `ui/auction.jsx` (status + connection, fictional/local notices, player photo with initials fallback and lazy images, player hero with stat grids, current lot, latest/recent sales, up next, activity, role meters, teams table, purse strip, team squad card). `DevPanels.jsx` removed; admin and team components moved onto these.
- Screens: **Lobby** `/ipl-auction`; **Admin** (hammer panel beside the player, "on the block" banner on other tabs, links to all screens, styled sign-in); **Team dashboard** (phone-first; purse / max next / squad pinned at the top); **Big screen** `/ipl-auction/screen` (projector: player hero, SOLD overlay for 6 s, up next, last and recent sales, purse strip); **Summary** `/ipl-auction/summary` (totals, most expensive buys, squads with minimums).
- SOLD overlay only for purchases newer than any seen (purchase `seq`), so opening the page, UNDO or a cancelled sale never re-announces an old sale; an undone sale leaves the screen.
- Accessibility: `aria-live` on sales (polite) and the big-screen SOLD (assertive, screen-reader text); focus-visible rings; Framer Motion only on the SOLD overlay, with `reducedMotion="user"`; `motion-safe` pulse on the LIVE badge.
- Dev-only UI: the local-mode notice and "Reset local data" exist only with the local adapter, which production builds never use (Phase 7). Fictional data stays labelled everywhere.

**Verified (headless Chrome, local mode, 2026-09-29):** 15/15 scripted checks: lobby; admin start → next player → price below base disables SOLD with the engine's reason → valid SOLD; the big screen in another tab shows the SOLD overlay and hides it after 6 s; UNSOLD → Undo reopens the lot without re-announcing; the team sees its purchase; no horizontal scroll at 390 px on lobby, team (live + market), summary and admin; **no console errors** (only React Router's existing future-flag warnings). Screenshots reviewed for every screen at desktop and phone width.

**Owner changes (2026-09-29, after the first Phase 8 pass)** — these replace the screen list above where they differ:
- **Team dashboard = one team.** The team comes only from its link (`/ipl-auction/play?team=<id>`); no picker, no "switch team", no Teams tab (other teams' purses), no Up next. Tabs: Live, Market, History. Without a valid link it says to use the link from the organisers. The admin's Auction controls list each team's link to send out.
- **Admin-only screens.** Big screen is `/ipl-auction/admin/screen` behind the same sign-in as the console (`admin/RequireAdmin.jsx`), opened from the console header. The public summary page is gone; its "most expensive buys" is in the admin Summary tab. The lobby only describes the event and links to no screen.
- **Price calculator** in the hammer panel: −/+ buttons step 20 lakhs below ₹5 Cr and ₹1 Cr from ₹5 Cr (`lib/iplAuction/priceSteps.js`, tested); typing a price still works. Input aid only, not an engine rule.
- Note: hiding screens is a UI restriction. Auction rows stay `read("any")` at the database, so anyone with API know-how can still read them; making reads private would need team logins (Phase 7 note).

**Merged `main` redesign + team logins (2026-09-29)**
- `main` (new site design: obsidian/gold palette, Inter / Space Grotesk / JetBrains Mono, new Nav) merged into the IPL branch. The IPL UI set (`ui/controls.jsx`, `ui/auction.jsx`) now uses the redesign's concrete colours (`obsidian-*`, `gold`, slate text), rounded-xl/2xl glass panels, monospace labels and buttons. (The redesign's `bg-card` / `border-border` / `text-muted-foreground` tokens are not defined in `tailwind.config.cjs`, so the IPL pages don't use them.)
- **Team login.** A team account is an Appwrite user with the label `teamLabel(teamId)` (`auth/teamAuth.js`, tested; shown per team in the admin Teams tab). `/ipl-auction/play` asks for sign-in and shows only that team; `?team=` is ignored for teams (admins may use it to preview; local mode keeps it). Lobby has a Team login button; "IPL Auction" added to the site navbar MORE menu (desktop `Nav.jsx` and phone `HamburgerNav.jsx`).
- Verified in headless Chrome with the real `.env.local` (Appwrite dev DB): navbar entry, lobby, team login form, `?team=` does not open a team without login, big screen asks for admin login; and in local mode the +/− ladder 200 → … → 480 → 500 → 600 → 700, SOLD overlay, no Up next / Teams tab / other teams on the team view, no sideways scroll at 390 px. The only console entry is Appwrite's expected 401 for "not signed in".

**Left for the owner**
- Create one Appwrite user per team with its login label (admin Teams tab lists them).
- Rehearsal on real devices (admin laptop, projector, 8+ phones) against the Appwrite dev database; this also covers the Phase 6 multi-device and Wi-Fi-drop checks.
- Keyboard shortcuts for the hammer were left out on purpose: a stray key press during a live auction could open or close a lot. Add them only if the organisers want them.
- Real player photos only with confirmed usage rights (`image` URL per player); fictional players show initials.
