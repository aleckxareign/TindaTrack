# TindaTrack 🏪
**Sari-sari store manager** — benta, utang, at paninda tracker.

---

## Mga Kailangan (Requirements)
- [Node.js](https://nodejs.org) — i-download ang **LTS version**
- Terminal (Command Prompt or VS Code terminal)

---

## Paano I-run (Step by Step)

### 1. I-install ang Node.js
Pumunta sa https://nodejs.org at i-download ang **LTS** version. I-install tulad ng ibang programa.

### 2. I-open ang project sa VS Code
I-drag ang `tindatrack` folder sa VS Code, o i-open ang terminal at type:
```
cd path/to/tindatrack
```

### 3. I-setup ang Backend
Sa terminal, type ito isa-isa:
```bash
cd backend
npm install
node server.js
```
Dapat makita mo: `TindaTrack backend running on port 3001`

Huwag isara ang terminal na ito!

### 4. I-setup ang Frontend (bagong terminal)
I-open ng bagong terminal tab, tapos:
```bash
cd frontend
npm install
npm start
```
Awtomatikong magbubukas ang browser sa http://localhost:3000

---

## Folder Structure
```
tindatrack/
├── backend/
│   ├── server.js          ← Entry point ng backend
│   ├── db.js              ← Database setup (SQLite)
│   ├── routes/
│   │   ├── paninda.js     ← API para sa paninda
│   │   ├── sales.js       ← API para sa benta
│   │   └── utang.js       ← API para sa utang
│   └── uploads/           ← Nandito ang mga na-upload na larawan
│
└── frontend/
    └── src/
        ├── App.jsx         ← Main app + navigation
        ├── api.js          ← Lahat ng API calls
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Paninda.jsx
        │   ├── Benta.jsx
        │   └── Utang.jsx
        ├── components/
        │   └── UI.jsx      ← Reusable components
        └── context/
            └── ToastContext.jsx
```

---

## Para sa GitHub Portfolio
1. `git init` sa loob ng `tindatrack` folder
2. Gumawa ng `.gitignore` file na naglalaman ng:
```
node_modules/
backend/tindatrack.db
backend/uploads/
```
3. `git add .` → `git commit -m "Initial commit: TindaTrack sari-sari store app"` → i-push sa GitHub

---

## Tech Stack (para sa interview)
| Layer    | Technology |
|----------|------------|
| Frontend | React 18, CSS Variables |
| Backend  | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Images   | Multer (local file uploads) |
| Deploy   | Railway (backend) + Vercel (frontend) |
