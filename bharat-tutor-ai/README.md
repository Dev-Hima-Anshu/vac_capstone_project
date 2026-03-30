# BharatTutor AI

Minimal MVP: **resume analysis (Groq)**, **roadmap.sh embed + checklist (Firestore)**, and **Concept Circle video (Daily.co)** with **Firebase realtime chat**.

## One-click setup

1. **Clone / open this folder** (`bharat-tutor-ai`).

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   ```bash
   copy .env.example .env.local
   ```

   Fill in:

   | Variable | Where to get it |
   |----------|-----------------|
   | `GROQ_API_KEY` | [Groq Console](https://console.groq.com/keys) (server-only; never expose to client) |
   | `DAILY_API_KEY` | [Daily dashboard → Developers](https://dashboard.daily.co/developers) (server-only). Used by `/api/daily-room` to create/fetch rooms. |
   | `NEXT_PUBLIC_FIREBASE_*` | Firebase project → Project settings → Your apps → Web app config |

   If `GROQ_API_KEY` is missing, resume analysis still returns a **demo** JSON response so demos work in class.

4. **Firebase console (Auth + Firestore)**

   - Enable **Authentication → Sign-in method**:
     - **Email/Password** (login/register)
     - **Anonymous** (optional; guest mode)
   - Create a **Firestore** database (production mode is fine for submission if you add rules below).
   - In **Firestore → Indexes**: if the app errors asking for a composite index on `conceptRooms`, create the suggested index (usually `lastActiveAt` descending).

   **Why you might see console errors**

   - **`permission-denied`**: your **security rules** don’t allow the signed-in user to read/write the paths the app uses (`users/*`, `conceptRooms/*`, chat under `conceptRooms/{roomId}/messages/*`). Fix by pasting the rules below.
   - **`Unsupported field value: undefined`**: Firestore never allows `undefined` in writes. The app now strips `undefined` before sending; you should still avoid empty optional fields in the console.

   **Suggested dev rules** (tighten before any public launch):

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /conceptRooms/{roomId} {
         allow read: if request.auth != null;
         allow create, update: if request.auth != null;
         allow delete: if false;

         match /messages/{msgId} {
           allow read: if request.auth != null;
           allow create: if request.auth != null
             && request.resource.data.uid == request.auth.uid
             && request.resource.data.text is string
             && request.resource.data.text.size() > 0
             && request.resource.data.text.size() < 2000;
           allow update, delete: if false;
         }
       }
     }
   }
   ```

## Video: Daily.co (Concept Circle)

This app uses **[Daily.co](https://www.daily.co/)** Prebuilt (`@daily-co/daily-js`) for **mic, camera, and screen share**. You need a free Daily account and a **`DAILY_API_KEY`** in `.env.local`.

- Rooms are created (or reused) server-side via **`POST /api/daily-room`** with body `{ "roomName": "<your-app-room-id>" }`.
- Styling: Daily supports `theme` / CSS hooks in the JS SDK; see [Daily customization docs](https://docs.daily.co/guides/customize-ui).

Firebase text chat stays separate in the right sidebar.

5. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push the `bharat-tutor-ai` folder to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Add the same env vars (including `GROQ_API_KEY` and all `NEXT_PUBLIC_FIREBASE_*` keys).
4. Deploy — `npm run build` is already verified for this project.

## Project map

| Area | Location |
|------|-----------|
| Landing + upload | `src/app/page.tsx` |
| Resume API | `src/app/api/analyze-resume/route.ts` |
| Roadmap iframe + progress | `src/app/roadmap/page.tsx`, `src/components/roadmap/roadmap-embed.tsx` |
| Concept Circle (Daily + chat) | `src/app/room/[roomId]/page.tsx`, `src/components/concept-circle/`, `src/app/api/daily-room/route.ts` |
| Dashboard | `src/app/dashboard/page.tsx` |
| i18n strings | `src/lib/strings.ts` |
| Firebase helpers | `src/lib/firebase.ts`, `src/lib/user-doc.ts`, `src/lib/room-chat.ts` |

## Stack

Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui, Firebase Auth + Firestore, Groq API, `@daily-co/daily-js`, roadmap.sh (opens in new tab).
