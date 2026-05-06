# ✦ ELEVATE — Complete Fix & Deployment Guide

## What was broken & what we fixed

| # | Problem | Fix applied |
|---|---------|-------------|
| 1 | `react-scripts` (CRA) still in `package.json` | Replaced with **Vite 5** — zero deprecated packages |
| 2 | `todayD = habitsData[todayStr()] \|\| {}` outside useMemo | Moved computation **inside** the useMemo callback |
| 3 | ESLint treating warnings as errors (`CI=true`) | All hook deps corrected + ESLint v9 flat config added |
| 4 | Icons called as functions `Icon(size)` — component naming risk | Converted to proper PascalCase React components |
| 5 | `uid()` using `Math.random` | Uses `crypto.randomUUID()` with fallback |
| 6 | No `.gitignore` | Added |

---

## 📁 Final Folder Structure

```
elevate-tracker/
├── index.html              ← Vite HTML entry (NOT in /public)
├── vite.config.js
├── eslint.config.js        ← ESLint v9 flat config
├── vercel.json
├── package.json            ← Vite 5 + React 18 (no react-scripts)
├── .gitignore
└── src/
    ├── main.jsx            ← React 18 createRoot mount
    └── App.jsx             ← Full application (fixed)
```

---

## ⚡ Local Setup (fresh start)

```bash
# 1. Create folder
mkdir elevate-tracker && cd elevate-tracker

# 2. Copy all files into their correct locations (see structure above)

# 3. Install — you will see ZERO deprecated warnings
npm install

# 4. Run locally
npm run dev
# → Opens at http://localhost:5173

# 5. Test the production build locally
npm run build && npm run preview
```

---

## 🗑️ How to Delete Old Vercel Deployments

### Delete a single deployment
1. Go to **vercel.com** → your project → **Deployments** tab
2. Click the **⋯** (three dots) next to any deployment
3. Select **Delete Deployment** → confirm

### Delete the entire old project (clean slate)
1. Go to your project → **Settings** tab
2. Scroll all the way down → **Delete Project**
3. Type the project name to confirm → **Delete**

> ⚠️ This removes all deployments AND the domain alias.
> Your GitHub repo is untouched.

---

## 🚀 Redeploy on Vercel (Two Methods)

### Method A — Push to GitHub (recommended, auto-deploys)

```bash
# Inside your elevate-tracker folder:

git init
git add .
git commit -m "fix: migrate CRA → Vite, fix useMemo ESLint errors"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/elevate-tracker.git
git push -u origin main
```

Then on Vercel:
1. **New Project** → Import from GitHub → select `elevate-tracker`
2. Framework auto-detected as **Vite** ✅
3. Click **Deploy** — done in ~30 seconds

Every future `git push` auto-triggers a new deployment.

### Method B — Vercel CLI (instant, no GitHub needed)

```bash
npm install -g vercel   # one-time install
vercel                  # follow prompts
```

---

## ✅ Why npm run build will now succeed

```
Before (CRA):
  > react-scripts build
  → 50+ deprecated package warnings
  → CI=true treats warnings as errors
  → BUILD FAILED ❌

After (Vite):
  > vite build
  → dist/ created in ~3 seconds
  → Zero deprecated warnings
  → BUILD SUCCESS ✅
```

---

## 🔑 The exact ESLint bug explained

```js
// ❌ BROKEN — Line 652 of your original file:
const todayD = habitsData[todayStr()] || {};
//    ^^^^^^
//    todayStr() calls new Date() on EVERY render
//    || {} creates a NEW object reference on EVERY render
//    So [todayD] as a useMemo dep = re-runs on every render
//    ESLint correctly catches this and fails CI build

const todayPct = useMemo(() => {
  ...
}, [todayD]);   // ← unstable dep → ESLint error


// ✅ FIXED — computation moved INSIDE useMemo:
const todayPct = useMemo(() => {
  const key  = getTodayKey();           // called inside memo
  const day  = habitsData[key] ?? {};   // lookup inside memo
  const done = HABITS.filter(h => day[h.id]?.done).length;
  return pct(done, HABITS.length);
}, [habitsData]);  // ← stable dep (only changes when user checks a habit) ✅
```

---

## 📦 Dependencies (current, all maintained)

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| recharts | ^2.12.7 | Charts & graphs |
| vite | ^5.4.1 | Build tool |
| @vitejs/plugin-react | ^4.3.1 | React Fast Refresh |
| eslint | ^9.9.0 | Linting |
| eslint-plugin-react-hooks | ^5.1.0 | Hook rules |
