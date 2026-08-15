# 🚀 Step-by-Step Free Deployment & Go-Live Guide

This guide details how to host **PRO-TRADER** 100% free on **Vercel** with a free **PostgreSQL Database** (Supabase or Neon), connect **Razorpay Payment Gateway**, and distribute mobile apps directly from your website.

---

## 1. Free Cloud Database Setup (Supabase / Neon)

Next.js serverless functions require a PostgreSQL database in cloud production. You can get a 100% free PostgreSQL database in under 2 minutes:

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and sign up for a free account.
2. Click **New Project** → set a password and region (e.g. India / Singapore).
3. Under **Project Settings** → **Database** → copy the `URI` string under **Connection string**.

### Option B: Neon PostgreSQL
1. Go to [neon.tech](https://neon.tech) and create a free project.
2. Copy the PostgreSQL connection string provided on the dashboard.

---

## 2. Deploy 100% Free on Vercel

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Go live ready build"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub.
   - Click **Add New Project** → Select your `PaperTrading CL` repository.

3. **Configure Environment Variables in Vercel**:
   Add the following variables under **Environment Variables** in Vercel Dashboard:

   | Variable Name | Description / Example |
   | ------------- | --------------------- |
   | `DATABASE_URL` | Your Supabase or Neon PostgreSQL connection URL |
   | `RAZORPAY_KEY_ID` | Your Razorpay Key ID (`rzp_live_...` or `rzp_test_...`) |
   | `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` |
   | `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhooks |
   | `NEXT_PUBLIC_APK_DOWNLOAD_URL` | Optional custom direct link for your `.apk` file |

4. **Deploy**:
   - Click **Deploy**. Vercel will build and launch your site with a free custom SSL domain (e.g., `pro-trader.vercel.app`).

5. **Run Prisma Migrations on Production**:
   In your local terminal connected to your cloud Postgres URL:
   ```bash
   npx prisma migrate dev --name init
   ```

---

## 3. Razorpay Payment Gateway Live Setup

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Switch to **Live Mode** (or **Test Mode** for testing).
3. Go to **Settings** → **API Keys** → **Generate Key**.
4. Copy the `Key ID` and `Key Secret` to your Vercel Environment Variables.
5. Go to **Settings** → **Webhooks** → **Add New Webhook**:
   - **Webhook URL**: `https://your-domain.vercel.app/api/subscription/webhook`
   - **Secret**: Set a secret key and add it to `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events**: Check `payment.captured` and `order.paid`.

---

## 4. Mobile Apps Direct Download Setup

Users can download the mobile app directly from your live website without needing Play Store or App Store approvals:

1. **Upload your compiled Android APK**:
   - Option A: Place your `.apk` file inside `public/downloads/pro-trader.apk`.
   - Option B: Host the `.apk` on Google Drive, GitHub Releases, or S3, and add the URL to `NEXT_PUBLIC_APK_DOWNLOAD_URL`.
2. **Direct Download Page**:
   - Your users can visit `https://your-domain.vercel.app/apps` to download the APK or install the Web PWA with one tap!
