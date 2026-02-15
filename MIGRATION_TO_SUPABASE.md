# 🏗️ Migration Guide: Local SQLite to Supabase

This guide will help you move your entire ESTOMMY database from your computer to Supabase and deploy it to Vercel.

## ✅ Step 1: Export Local Data (Done)
I have already run the export script for you. Your data is safely stored in `migration_temp_data.json` at the root of your project.

## 🛠️ Step 2: Set Up Supabase

1.  Go to [Supabase.com](https://supabase.com) and create a free project.
2.  Once the project is ready:
    *   Go to **Project Settings** (gear icon) -> **Database**.
    *   Find the **Connection String** section and select **URI**.
    *   Copy the URL. It looks like: `postgresql://postgres.[YOUR-ID]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
3.  Open your `.env` file and replace your old `DATABASE_URL` with this new one.
    *   **CRITICAL:** Make sure you replace `[PASSWORD]` with the actual database password you chose when creating the Supabase project.

## 🚀 Step 3: Push the Schema to Supabase

Run this command in your terminal to create the tables in Supabase:

```bash
npx prisma db push
```

## 📥 Step 4: Import Data to Supabase

Run the migration script I created to move your local data into Supabase:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-import.ts
```

## 🌍 Step 5: Deploy to Vercel

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  Add the following **Environment Variables** in Vercel:
    *   `DATABASE_URL`: (The Supabase connection string)
    *   `NEXTAUTH_SECRET`: (Generate a random string)
    *   `NEXTAUTH_URL`: (Your Vercel app URL, e.g., `https://estommy.vercel.app`)
    *   `CRON_SECRET`: (Your backup secret key)

## 📁 Cleanup

Once you have verified that everything is working in professional hosting, you can safely delete:
*   `migration_temp_data.json`
*   `scripts/migrate-export.ts`
*   `scripts/migrate-import.ts`
*   `prisma/dev.db` (the old local database)

---

**You are now running on production-grade infrastructure! 💎**
