# TindaTrack Cloud Setup Guide

## Step 1: Create a Supabase project (free)
1. Go to https://supabase.com and sign up
2. Click "New Project", give it a name, set a password
3. Wait for it to finish (1-2 mins)
4. Go to **SQL Editor** and paste everything from `supabase-schema.sql`, then click Run
5. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

## Step 2: Set up the Backend on Railway (free)
1. Go to https://railway.app and sign up with GitHub
2. Click "New Project > Deploy from GitHub repo" (upload backend folder or use GitHub)
3. Add these Environment Variables in Railway:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_KEY` = your service_role key
   - `PORT` = 3001
4. Deploy — Railway gives you a public URL like `https://tindatrack-backend.up.railway.app`

## Step 3: Set up Frontend on Vercel (free)
1. Go to https://vercel.com and sign up with GitHub
2. Import your frontend folder
3. Add these Environment Variables in Vercel:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Deploy — Vercel gives you a public URL

## Step 4: Install on Phone
- **Android**: Open the app URL in Chrome, tap the 3-dot menu > "Add to Home Screen"
- **iPhone**: Open in Safari, tap Share > "Add to Home Screen"

## Local Development
### Backend
```
cd backend
cp .env.example .env   # fill in your Supabase keys
npm install
npm run dev
```
### Frontend
```
cd frontend
cp .env.example .env   # fill in your Supabase keys
npm install
npm start
```
