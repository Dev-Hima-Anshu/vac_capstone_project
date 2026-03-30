# BharatTutor AI

Minimal MVP: **resume analysis (Groq)**, **roadmap.sh embed + checklist (Firestore)**, and **Jitsi Concept Circle** with **Firebase realtime chat**.

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
   | `NEXT_PUBLIC_FIREBASE_*` | Firebase project → Project settings → Your apps → Web app config |

   If `GROQ_API_KEY` is missing, resume analysis still returns a **demo** JSON response so demos work in class.

4. **Firebase console (Auth + Firestore)**

   - Enable **Authentication → Sign-in method → Anonymous**.
   - Create a **Firestore** database (production mode is fine for submission if you add rules below).

   **Suggested dev rules** (tighten before any public launch):

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /conceptRooms/{roomId}/messages/{msgId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null
           && request.resource.data.uid == request.auth.uid
           && request.resource.data.text is string
           && request.resource.data.text.size() < 2000;
       }
     }
   }
   ```

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
| Concept Circle (Jitsi + chat) | `src/app/circle/[topic]/page.tsx`, `src/components/concept-circle/` |
| Dashboard | `src/app/dashboard/page.tsx` |
| i18n strings | `src/lib/strings.ts` |
| Firebase helpers | `src/lib/firebase.ts`, `src/lib/user-doc.ts`, `src/lib/room-chat.ts` |

## Stack

Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn/ui, Firebase Auth + Firestore, Groq API, `@jitsi/react-sdk`, roadmap.sh (iframe).
