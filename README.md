# Junior QA Online Exam Platform

A simple deployable Next.js + Firebase exam portal for Junior QA testers.

## Features
- Email-only magic link login
- Examinee access to timed exam
- Multiple-choice and essay questions
- Submission confirmation screen
- Admin dashboard to edit exam settings and questions
- Firestore-based submissions storage

## Suggested stack
- Frontend: Next.js
- Auth: Firebase Authentication (Email link / passwordless)
- Database: Cloud Firestore
- Hosting: Firebase Hosting or Firebase App Hosting

## Firestore structure
- `settings/currentExam`
  - title
  - description
  - durationMinutes
  - passingScore
  - questions[]
- `users/{uid}`
  - email
  - name
  - role
  - createdAt
- `submissions/{docId}`
  - userId
  - email
  - answers
  - score
  - createdAt

## Firebase setup
1. Create a Firebase project.
2. Enable **Authentication**.
3. Enable **Email/Password** provider.
4. Enable **Email link (passwordless sign-in)**.
5. Add your local and production domains to **Authorized domains**.
6. Create **Cloud Firestore** in production or test mode.
7. Replace `.env.example` values with your Firebase config in `.env.local`.

## Local run
```bash
npm install
npm run dev
```

## Deploy options
### Option 1: Firebase App Hosting
Good for Next.js projects and GitHub integration.

### Option 2: Vercel + Firebase
Deploy the Next.js app to Vercel and keep Firebase for auth/database.

## GitHub upload
```bash
git init
git add .
git commit -m "Initial commit - Junior QA exam platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/junior-qa-exam-platform.git
git push -u origin main
```

## Important notes
- The `NEXT_PUBLIC_ADMIN_EMAILS` env variable controls which signed-in emails can access `/admin`.
- For stronger security, update `firestore.rules` to match your real admin emails or use custom claims later.
- Before first real use, save the default exam from `/admin` so Firestore has a `settings/currentExam` document.
