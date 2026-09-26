# Phase 8 — Final UI/UX

**Status:** ⬜ Not started · **Depends on:** Phases 4, 5, 6, 7 stable
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

- [ ] All screens built; `DevPanels.jsx` no longer used in production routes.
- [ ] A full rehearsal auction on real devices (admin laptop, projector, 8+ phones) with no functional regressions.
- [ ] `npm run test:ipl` and `npm run build` pass; no engine, adapter or Function files changed in this phase.

## Handoff notes

_(fill in when done)_
