# EMSR – Employee Management System

Modern employee management with role-based access, leave workflows, announcements, and clean UI. This README documents setup plus the recent implementations you requested, step by step.

## Quick Start
- Install dependencies: `npm install`
- Configure environment (optional):
  - `MONGO_URI` to point to your MongoDB (defaults to `mongodb://localhost:27017/emsr`)
  - `ADMIN_EMAIL` to set the initial admin email (defaults to `admin@company.com`)
  - `JWT_SECRET` for signing auth tokens (defaults to `secret_key`)
- Run the app: `npm start`
- Open: `http://localhost:5000/`

## Static Assets
- Public assets are served from the `public` folder: [server.js](file:///c:/Users/user/Desktop/EMSR/server.js#L13-L16)
- Place images under `public/img`; they are accessible via `/img/...`

## Implemented Updates (Step-by-Step)

### 1) Manager Approval Requires Comment
- Frontend: Each pending leave now renders a comment input next to Approve/Reject.
- Validation: Managers must enter a comment before processing a request.
- How to use:
  1. Login as Manager and open the Manager dashboard.
  2. Under Pending Requests, type a comment.
  3. Click Approve or Reject; the action will be blocked if comment is empty.
- References:
  - Frontend list + validation: [manager.js](file:///c:/Users/user/Desktop/EMSR/public/js/manager.js#L52-L91), [manager.js](file:///c:/Users/user/Desktop/EMSR/public/js/manager.js#L114-L143)
  - Backend enforcement: [manager.js (route)](file:///c:/Users/user/Desktop/EMSR/routes/manager.js#L19-L34)

### 2) Forgot Password Shows “Account doesn’t exist”
- Behavior: Password reset returns 404 if the email does not exist; UI displays a clear message.
- How to use:
  1. Open Reset Password page: `http://localhost:5000/forgot`
  2. Enter email, new password, and confirm.
  3. If the email is not found, the page shows “Account doesn’t exist”.
- References:
  - UI handling: [forgot.html](file:///c:/Users/user/Desktop/EMSR/views/forgot.html#L224-L273)
  - API route: [auth.js](file:///c:/Users/user/Desktop/EMSR/routes/auth.js#L68-L85)

### 3) Admin Password Stored in MongoDB (not .env)
- Seeding: On first run, a Super Admin user is created with a temporary hashed password in MongoDB.
- Reset Flow: Admin should set their real password via the Forgot Password page using the admin email.
- How to use:
  1. Ensure `ADMIN_EMAIL` is set if you want a custom admin email.
  2. Start the app; the seed creates the admin account.
  3. Go to `http://localhost:5000/forgot` and reset the admin password using that email.
- References:
  - Seeding logic: [server.js](file:///c:/Users/user/Desktop/EMSR/server.js#L33-L59)
  - Forgot API: [auth.js](file:///c:/Users/user/Desktop/EMSR/routes/auth.js#L68-L85)

### 4) Index Header Logo and Fallback
- Path fix: Index header now loads the logo from `/img/EM.png` (served from `public/img/EM.png`).
- Fallback: If the image fails to load, it hides cleanly and the text header remains.
- How to use:
  1. Place your logo at `public/img/EM.png`.
  2. Open `http://localhost:5000/` and confirm the logo shows next to “ELMS Portal”.
  3. If the file is missing, only text is shown to keep the header tidy.
- References:
  - Logo usage: [index.html](file:///c:/Users/user/Desktop/EMSR/views/index.html#L232-L237)
  - Asset location: `c:/Users/user/Desktop/EMSR/public/img/EM.png`

## Verification Checklist
- Manager approvals require comments and process correctly.
- Forgot Password:
  - Works for valid accounts.
  - Shows “Account doesn’t exist” for unknown emails.
- Admin account:
  - Seeded on startup.
  - Password reset via Forgot Password page.
- Index logo:
  - Loads from `/img/EM.png`.
  - Falls back to text if image missing.

## Deployment on Vercel
1. **Install Vercel CLI**: `npm install -g vercel` (or use npx).
2. **Login**: `vercel login`
3. **Deploy**: Run `vercel` in the project root.
4. **Environment Variables**:
   - Add your `MONGO_URI` and `JWT_SECRET` in the Vercel Project Settings > Environment Variables.
   - Do NOT use localhost for MongoDB; use MongoDB Atlas or another cloud provider.
5. **Configuration**:
   - `vercel.json` is configured to route all traffic to `server.js` running as a serverless function.
   - `server.js` exports the app module for Vercel compatibility.

## Routes Overview
- API:
  - Auth: `/api/auth/login`, `/api/auth/change-password`, `/api/auth/forgot-password` [auth.js](file:///c:/Users/user/Desktop/EMSR/routes/auth.js)
  - Manager: `/api/manager/leaves` (GET), `/api/manager/leaves/:id` (PUT) [manager.js](file:///c:/Users/user/Desktop/EMSR/routes/manager.js)
  - Admin, Employee routes available under `/api/admin`, `/api/employee`
- Views:
  - `/` → [index.html](file:///c:/Users/user/Desktop/EMSR/views/index.html)
  - `/login` → login page
  - `/forgot` → [forgot.html](file:///c:/Users/user/Desktop/EMSR/views/forgot.html)
  - `/manager-dashboard`, `/admin-dashboard`, `/employee-dashboard`

