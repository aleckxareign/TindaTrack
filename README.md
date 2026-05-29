<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:639922,100:2d6a0a&height=220&section=header&text=TindaTrack&fontSize=60&fontColor=ffffff&fontAlignY=40&desc=Sari-Sari%20Store%20Management%2C%20Modernized&descAlignY=58&descColor=d4f7a0" />

</div>

<div align="center">

![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20PWA-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Made With Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F%20for%20Mom-ff69b4?style=for-the-badge)

</div>

---

## 🏪 The Story Behind TindaTrack

My mom runs a small **sari-sari store** from our home — one of the millions of neighborhood convenience stores that form the backbone of everyday Filipino life. For years, she managed everything the traditional way: handwritten receipts, a worn notebook for tracking utang (credit), and mental math for daily earnings.

The problem? Notebooks get lost. Entries get smudged. It's impossible to know at a glance how much you earned this month, who owes what, or which products are running low. When a neighbor asks *"Magkano na ba utang ko?"*, she'd have to flip through pages to find the answer.

**TindaTrack** was built to solve exactly that — a simple, fast, and reliable store management app designed for the real needs of a Filipino sari-sari store owner. No complicated setup. No expensive hardware. Just a smartphone and an internet connection.

---

## ✨ Features

### 📦 Inventory Management (Paninda)
- Add, edit, and delete products with names, prices, stock counts, and photos
- Organize products by category: **Matamis, Biskwit, Chichirya, Inumin, Panglaba, Condiments, Hygiene, Iba Pa**
- Filter products by category with a single tap
- Multi-select delete for bulk inventory cleanup
- Automatic image compression — photos are resized and compressed before upload to save storage

### 🧾 Sales Recording (Benta)
- Record sales in seconds by selecting items from your inventory
- Add multiple items per transaction with quantity controls
- Supports three payment types: **Cash, GCash, and Utang**
- When marked as Utang, automatically logs the debt under the customer's name
- View sales history filtered by **today, this week, or this month**
- Multi-select delete for removing incorrect entries

### 💸 Utang (Credit) Tracker
- Track customers who owe money with running balances
- Select which products were taken on credit directly from the inventory list
- Record partial or full payments and watch the progress bar fill up
- Full transaction history per customer
- Automatically celebrates when a customer is fully paid 🎉
- Multi-select delete to manage records

### 📊 Dashboard
- At-a-glance view of today's earnings and this month's total revenue
- Total outstanding utang across all customers
- Top 3 best-selling products this month
- Quick-action buttons for the most common tasks

### 🔄 Real-Time Sync Across Devices
- Built on **Supabase Realtime** — any change made on one device instantly appears on all others
- Family members can use the app simultaneously without data conflicts
- Works on phone, tablet, and desktop

### 📱 Installable PWA
- Add to home screen on **Android and iPhone** — works like a native app
- No app store needed
- Fast load times with offline-ready architecture

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL via Supabase |
| **Real-time** | Supabase Realtime (WebSockets) |
| **Storage** | Supabase Storage |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Railway |
| **PWA** | vite-plugin-pwa, Workbox |

---

## 🗄️ Database Schema

```sql
paninda        -- Product inventory
  id, name, price, stock, img, category, created_at

sales          -- Sales transactions
  id, total, payment, created_at

sale_items     -- Line items per sale
  id, sale_id, paninda_id, name, price, qty, subtotal, created_at

utangs         -- Credit accounts per customer
  id, name, amount, paid, created_at

utang_history  -- Payment and credit history
  id, utang_id, type, amount, note, created_at
```

---

## 🚀 Running the Project

### Prerequisites
- Node.js v18+ (or v22+ with Vite)
- A free [Supabase](https://supabase.com) account

### 1. Clone the Repository
```bash
git clone https://github.com/aleckxareign/TindaTrack.git
cd TindaTrack
```

### 2. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Storage** → create a bucket named `paninda-images` → set it to **Public**
4. Go to **Settings → API** and copy your **Project URL**, **anon key**, and **service_role key**

### 3. Set Up the Backend
```bash
cd backend
cp .env.example .env
```
Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=3001
```
```bash
npm install
npm run dev
```

### 4. Set Up the Frontend
```bash
cd frontend
cp .env.example .env
```
Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
```bash
npm install
npm start
```

Frontend runs at `http://localhost:3000` · Backend runs at `http://localhost:3001`

---

## ☁️ Deploying to Production

### Frontend → Vercel
1. Push the repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
5. Deploy

### Backend → Railway
1. Create a new project at [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PORT`
5. Generate a public domain under **Settings → Networking**

---

## 📱 Installing on Mobile

**Android (Chrome):**
> Open the app URL → tap the 3-dot menu → *Add to Home Screen*

**iPhone (Safari):**
> Open the app URL → tap the Share button → *Add to Home Screen*

---

## 🌍 Real-World Impact

Sari-sari stores are more than just convenience shops — they are community institutions. There are an estimated **1.2 million** sari-sari stores across the Philippines, most run by women managing their households simultaneously. These stores operate on thin margins where every peso counts and every unpaid utang matters.

TindaTrack was built with these realities in mind:
- **Simple enough** for someone who isn't tech-savvy
- **Fast enough** for use in the middle of serving customers
- **Reliable enough** to replace a notebook
- **Accessible enough** to work on any smartphone with no installation

---

## 👩‍💻 Developer

**Aleckxa Reign D. Bugtong**
BS Computer Science Student

> *"I built this for my mom, but I hope it helps every nanay, ate, and lola running their own tindahan."*

[![GitHub](https://img.shields.io/badge/GitHub-aleckxareign-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aleckxareign)

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:639922,100:2d6a0a&height=100&section=footer" />

<sub>⭐ If this project helped you or inspired you, please leave a star — it means a lot!</sub>

</div>
