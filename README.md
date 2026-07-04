<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ICT Super Apps

Monorepo: Vite + React (frontend) + Node.js/Express (backend) + Capacitor (Android).

## Run Locally

**Prerequisites:** Node.js (>= 20 recommended)

### Frontend (Vite)
1. Install dependencies:
   `npm install`
2. Create `.env` (see `.env.example`) and set:
   - `VITE_API_BASE_URL` (example: `http://localhost:8080`)
3. Run:
   `npm run dev`

### Backend (Express)
1. Install backend deps:
   `npm run backend:install`
2. Create `backend/.env` (see `backend/.env.example`) and set required variables (JWT, LDAP, Postgres, Pomon).
3. Run:
   `npm run backend:dev`

### Android (Capacitor)
- Build and sync Android project:
  `npm run build:mobile`
- Build debug APK (cross-platform):
  `npm run build:apkdebug`

### Backend Smoke Test (Remote)
Use the interactive script to login and verify protected endpoints:
- `powershell -File scripts/test-backend.ps1`
