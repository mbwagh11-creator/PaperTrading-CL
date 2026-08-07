# PRO-TRADER

NSE options paper trading, journal & analytics — built with Next.js, TypeScript, Tailwind, and Prisma (SQLite).

## What's included

- ✅ Manual Paper Trading — Buy/Sell, Quantity, Entry, Stop Loss, Target, live P&L
- ✅ Trade Journal — every trade stored permanently, open or closed
- ✅ Performance Analytics — win rate, avg win/loss, profit factor, best/worst trade, calculated only from **closed** trades
- ✅ Symbol search/autocomplete against a real NSE instrument list (works with **no API key**)
- ✅ Upstox login flow + live price fetch — **ready, just needs your API keys once your account is approved**
- ⏳ Subscriptions — skipped for now, as requested

## 1. Setup (do this first, in VS Code's terminal)

```bash
# 1. Open this folder in VS Code, then in the integrated terminal:
npm install

# 2. Create the local database and tables
npx prisma migrate dev --name init

# 3. Run the app
npm run dev
```

Open **http://localhost:3000** in your browser.

That's it — no external accounts, no API keys, no payments needed to use the app right now. The database is a single file (`prisma/dev.db`) that lives in your project folder.

## 2. Project structure

```
pro-trader/
  prisma/
    schema.prisma        <- database schema (the Trade model)
  src/
    app/
      page.tsx            <- Dashboard
      trades/page.tsx      <- Manual Paper Trading screen
      journal/page.tsx     <- Trade Journal (full history table)
      analytics/page.tsx   <- Performance Analytics
      api/trades/           <- backend API routes (create/list/update/close trades)
    components/            <- reusable UI pieces (form, tables, navbar)
    lib/
      prisma.ts             <- database connection
      calculations.ts       <- P&L and analytics formulas (all in one place, easy to audit)
  .env                      <- DATABASE_URL lives here (already set up for you)
```

## 3. How the paper trading works right now

1. Go to **Paper Trading**, type a Symbol (pick it from the dropdown if it appears — this links it to live data), choose Buy or Sell, fill Quantity / Entry Price (+ optional SL/Target) → "Place Trade".
2. The trade appears under **Open Positions**. If it's connected to Upstox, click **"⚡ Fetch Live Price"** to pull the real price. Otherwise (or any time), type a price into "Update price" and hit **Update** — P&L recalculates instantly either way.
3. When you're done, type an **Exit price** and hit **Close Trade** — it's locked in as realized P&L and moves into the Journal/Analytics calculations.

## 4. Symbol search — works right now, no API key needed

The **Symbol** field on the Paper Trading page now searches a real list of NSE instruments (NIFTY, BANKNIFTY, and a starter list of liquid stocks + their options) as you type, and auto-fills the correct lot size. This list comes from Upstox's public instrument file, which needs no login at all.

Before using it the first time, go to **Paper Trading** and click **"Sync Symbol List"** once (top of the page). Re-click it any time you want fresh strikes/expiries (it's free to run as often as you like — it just downloads a public file).

## 5. Connecting live prices (once your Upstox account is approved)

Once your Upstox account is approved:

1. Go to https://upstox.com/developer/apps and create an app. Set the **Redirect URI** to exactly:
   `http://localhost:3000/api/auth/upstox/callback`
2. Copy the **API Key** and **API Secret** it gives you.
3. Open `.env` in this project and fill in:
   ```
   UPSTOX_API_KEY=your_key_here
   UPSTOX_API_SECRET=your_secret_here
   UPSTOX_REDIRECT_URI=http://localhost:3000/api/auth/upstox/callback
   ```
4. Restart `npm run dev`, go to **Paper Trading**, and click **"Connect Upstox"** — it'll take you to Upstox's own login page (enter your Upstox credentials there, never here), then bring you back automatically.
5. Once connected, any open trade whose symbol was picked from the search dropdown gets a **"⚡ Fetch Live Price"** button — click it to pull the real current NSE price instead of typing one in manually.

**Important:** Upstox access tokens expire every day at 3:30 AM IST — that's their rule, not something we can change. So you'll click "Connect Upstox" again each morning before trading. This is normal for every app built on Upstox, not a bug.

**Note on true real-time streaming:** what's built above is "pull the latest price on demand," which is simple and reliable. Continuous tick-by-tick WebSocket streaming (auto-updating without clicking) is a further step — happy to build it next once this base flow is working for you, since it needs a slightly different server setup.

## 5. Moving to production later (optional, when you're ready to deploy)

SQLite is great for local development but doesn't work well on serverless hosts like Vercel. When you're ready to launch:

1. Create a free Postgres database on Supabase or Neon.
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. Update `DATABASE_URL` in `.env` to your Postgres connection string.
4. Run `npx prisma migrate dev`.
5. Deploy to Vercel (free tier) — connect your GitHub repo and it builds automatically.

We'll also add subscriptions (Razorpay) at that stage.
