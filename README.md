# VAC Capstone — BharatTutor AI

Next.js app for resume analysis (Groq), learning roadmaps, and live **Concept Circle** discussions (**Daily.co** video + Firebase chat).

**Repository:** [github.com/Dev-Hima-Anshu/vac_capstone_project](https://github.com/Dev-Hima-Anshu/vac_capstone_project)

---

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** (comes with Node)

---

## How to run (recommended — from repo root)

This repo uses an **npm workspace**: the app lives in `bharat-tutor-ai/`, but you can install and run from the root folder.

### 1. Clone

```bash
git clone https://github.com/Dev-Hima-Anshu/vac_capstone_project.git
cd vac_capstone_project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy the example env file into the app folder:

**Windows (PowerShell or CMD):**

```bash
copy bharat-tutor-ai\.env.example bharat-tutor-ai\.env.local
```

**macOS / Linux:**

```bash
cp bharat-tutor-ai/.env.example bharat-tutor-ai/.env.local
```

Edit `bharat-tutor-ai/.env.local` and add:

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Real resume analysis ([Groq console](https://console.groq.com/keys)). If omitted, the API returns **demo** data. |
| `DAILY_API_KEY` | Concept Circle video ([Daily developers](https://dashboard.daily.co/developers)). Server-only. |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Auth + Firestore (see `bharat-tutor-ai/README.md` for rules). |

### 4. Start the dev server

From **repo root**:

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

### 5. Production build (optional)

```bash
npm run build
npm run start
```

---

## How to run (alternative — inside `bharat-tutor-ai` only)

```bash
cd bharat-tutor-ai
npm install
copy .env.example .env.local
npm run dev
```

---

## Project layout

| Path | Description |
|------|-------------|
| `bharat-tutor-ai/` | Next.js 15 app (App Router) |
| `package.json` (root) | Workspace scripts: `dev`, `build`, `start`, `lint` |

More detail (Firebase rules, features, deploy): see **`bharat-tutor-ai/README.md`**.

---

## Deploy (Vercel)

1. Import this repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `bharat-tutor-ai` *or* use the root `package.json` build commands (same as `npm run build` from root).
3. Add environment variables from `.env.example` in the Vercel project settings.

---

## License / academic use

Built for capstone / academic submission; adjust license as required by your institution.
