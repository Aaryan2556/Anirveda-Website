# IPL Auction — Appwrite dev scripts

Schema-as-code and seed data for the IPL Auction **development** database.
The schema itself lives in `src/lib/iplAuction/repository/appwriteSchema.js`.

## One-time setup

1. In the Appwrite console (project from `VITE_APPWRITE_PROJECT_ID`), create a **server API key** with the
   scopes: `databases.read/write`, `tables.read/write`, `columns.read/write`, `indexes.read/write`, `rows.read/write`.
2. `cp .env.ipl.example .env.ipl.local` and fill it in. `.env.ipl.local` is git-ignored — never commit it,
   and never put the API key in a `VITE_` variable.
3. Use a **separate** database ID for IPL (default `ipl-auction-dev`). Set `PROTECTED_DATABASE_ID` to the
   existing site database so the scripts refuse to run against it.

## Commands

| Command | What it does |
|---|---|
| `npm run ipl:setup` | Creates the database, tables, columns and indexes that are missing. Safe to re-run; never alters or deletes. Reports differences. |
| `npm run ipl:seed` | Writes a fresh auction from the FICTIONAL mock data. Refuses if IPL rows exist. |
| `npm run ipl:seed -- --reset` | Deletes **every row in the IPL tables**, then seeds. Dev database only. |
| `npm run ipl:check` | Permission check (Phase 7): table permissions and row security; an anonymous client can read but cannot create, change or delete rows, directly or through a transaction; the API key is in no `VITE_` variable. Writes only throwaway rows under the fake auction ID `perm-probe` and removes them. Exit code 1 on any failure. |

## Creating an admin account

Only users with the label `ipladmin` can change the auction (enforced by table permissions).

1. Appwrite console → **Auth → Users → Create user** (email + password).
2. Open the user → **Labels** → add `ipladmin` → **Update**.
3. Sign in at `/ipl-auction/admin`.

## Pointing the app at Appwrite

Create `.env.local` (git-ignored) with:

```
VITE_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=<project id>
VITE_IPL_AUCTION_ADAPTER=appwrite
VITE_IPL_AUCTION_DATABASE_ID=ipl-auction-dev
# optional; defaults to the newest auction
VITE_IPL_AUCTION_ID=
```

Then `npm run dev`, open `/ipl-auction/admin` and sign in with an admin account. Without `VITE_IPL_AUCTION_ADAPTER=appwrite` the dev server
uses the local (browser-only) adapter. A **production build never uses the local adapter**: without `VITE_IPL_AUCTION_ADAPTER=appwrite`
and `VITE_IPL_AUCTION_DATABASE_ID` the IPL pages say the auction is unavailable (`repository/mode.js`).
