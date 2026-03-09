# Western Province Stamp Duty Digital Platform

A full-stack web application for managing stamp duty assessments, applications, and fee calculations for the Western Province Stamp Duty Department of Sri Lanka. The system provides separate portals for the public (external users) and department staff (internal users), with a complete workflow from application submission through assessment and opinion issuance.

---

## Features

### External Portal (Public)
- Self-registration and account approval by a Registrar
- Submit new stamp duty applications with multi-step form (property details, transaction info, document uploads)
- Track application status in real-time
- View official stamp duty opinions and deficiency notices
- Edit/resubmit amended applications
- Help desk and profile management
- Forgot password / password reset via email

### Internal Portal (Department Staff)
- Role-based dashboard with dedicated views per role
- Application queue management with regional distribution
- Stamp duty assessment and calculation tools
- Issue official opinion forms and deficiency notices
- Approve/reject/request amendments on applications
- Admin panel — manage users, roles, regions, and custom form fields
- Global search across all applications

### General
- Fully responsive — mobile, tablet, and desktop
- JWT-based authentication with token expiry
- Rate limiting on login and password reset endpoints
- Helmet security headers and structured request logging (Morgan)
- Email notifications at key workflow stages (Nodemailer)
- Sri Lanka Government emblem served locally (no external dependency)

---

## User Roles

| Role | Access Level |
|---|---|
| `ADMIN` | Full system access, user management, field configuration |
| `COMMISSIONER` | View all applications, users, and reports |
| `DC` (Deputy Commissioner) | Manage applications in assigned region, view assessors |
| `ASSESSOR` | Assess and process assigned applications |
| `REGISTRAR` | Approve external user registrations |
| External User | Submit and track own applications via external portal |

---

## Tech Stack

### Frontend
| Package | Version |
|---|---|
| React | 19.2 |
| Vite | 7.3 |
| React Router DOM | 7.13 |
| Framer Motion | 12.35 |
| React Icons | 5.6 |

### Backend
| Package | Version |
|---|---|
| Express | 5.2 |
| SQLite3 | 5.1 |
| bcryptjs | 3.0 |
| jsonwebtoken | 9.0 |
| nodemailer | 8.0 |
| helmet | 8.1 |
| morgan | 1.10 |
| express-rate-limit | 8.2 |
| express-validator | 7.3 |

---

## Project Structure

```
Stamp-Duty-Online-System/
├── public/
│   ├── emblem-sri-lanka.svg          # Sri Lanka government emblem (local)
│   ├── comprehensive-calculator.html # Standalone calculator page
│   ├── deficiency-calculator.html
│   └── stamp-duty-registration.html
├── src/
│   ├── context/
│   │   └── AppContext.jsx            # Global state (auth, applications, users)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.jsx   # Internal portal sidebar + mobile nav
│   │   │   └── ExternalLayout.jsx    # External portal sidebar + mobile nav
│   │   ├── features/
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── ApplicationDetail.jsx
│   │   │   ├── CommonDashboard.jsx
│   │   │   ├── DeficiencyCalculator.jsx
│   │   │   ├── OfficialDeficiencyNotice.jsx
│   │   │   ├── OfficialOpinionForm.jsx
│   │   │   ├── StampDutyCalculator.jsx
│   │   │   └── StampDutyRegistration.jsx
│   │   └── ui/
│   │       └── GlobalSearch.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── DepartmentLogin.jsx
│   │   │   ├── ExternalLogin.jsx
│   │   │   ├── ExternalRegistration.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── internal/
│   │   │   └── InternalPortal.jsx
│   │   ├── external/
│   │   │   ├── ExternalApplicationDetail.jsx
│   │   │   ├── ExternalDashboard.jsx
│   │   │   ├── HelpDesk.jsx
│   │   │   ├── MyProfile.jsx
│   │   │   ├── NewApplication.jsx
│   │   │   └── NewApplication.css
│   │   ├── LandingPage.jsx
│   │   └── NotFound.jsx
│   ├── services/
│   │   └── api.js                    # Axios API client
│   ├── styles/
│   │   ├── Auth.css
│   │   ├── Dashboard.css
│   │   └── LandingPage.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── index.js                      # Express app entry point + all API routes
│   ├── db.js                         # SQLite database setup & schema
│   ├── emailService.js               # Nodemailer workflow email helper
│   ├── securityMiddleware.js         # authenticateToken, authorize, maskUserData
│   ├── validators.js                 # express-validator schemas
│   └── package.json
├── docs/
│   └── SequentialFileNumbering.md    # Procedure for temp file number generation
├── .env.example                      # Environment variable reference
├── railway.toml                      # Railway deployment config
├── vite.config.js
├── eslint.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### 1. Clone the repository

```bash
git clone https://github.com/isuruthilanka/Stamp-Duty-Online-System.git
cd Stamp-Duty-Online-System
```

### 2. Install dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install && cd ..
```

### 3. Configure environment variables

Copy `.env.example` to `server/.env` and fill in the values:

```bash
cp .env.example server/.env
```

```env
PORT=5001
NODE_ENV=development
JWT_SECRET=your_strong_jwt_secret_here

# CORS — comma-separated allowed origins
ALLOWED_ORIGINS=http://localhost:5173

# Email (Nodemailer)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@example.com
```

### 4. Run in development

Start both the frontend and backend concurrently in separate terminals:

```bash
# Terminal 1 — frontend (Vite dev server on http://localhost:5173)
npm run dev

# Terminal 2 — backend API (Express on http://localhost:5001)
cd server && node index.js
```

The Vite dev server proxies all `/api` requests to `http://localhost:5001`, so no CORS issues in development.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite frontend dev server (HMR) |
| `npm run build` | Build frontend for production to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the codebase |
| `npm start` | Start the Express server (production) |
| `npm run watch:push` | Auto-commit and push changes on file save (`fswatch`) |

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Staff login (rate limited) |
| `POST` | `/api/forgot-password` | Trigger password reset email (rate limited) |

### Users
| Method | Endpoint | Roles |
|---|---|---|
| `GET` | `/api/users` | ADMIN, COMMISSIONER |
| `GET` | `/api/assessors` | DC, ADMIN, COMMISSIONER |
| `POST` | `/api/users` | ADMIN |
| `PATCH` | `/api/users/:id` | ADMIN |
| `DELETE` | `/api/users/:id` | ADMIN |

### External Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/external-users` | List (ADMIN, REGISTRAR) |
| `POST` | `/api/external-users/register` | Public self-registration |
| `POST` | `/api/external-users/:id/approve` | Approve registration (ADMIN, REGISTRAR) |

### Applications
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications` | List applications (filtered by role/region) |
| `POST` | `/api/applications` | Submit new application |
| `PATCH` | `/api/applications/:id` | Update status, assign, issue opinion, etc. |
| `POST` | `/api/applications/check-duplicate` | Duplicate detection |

### Fields
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/fields` | Get custom form fields |
| `POST` | `/api/fields` | Add custom field (ADMIN) |
| `DELETE` | `/api/fields/:id` | Remove custom field (ADMIN) |

---

## Routing

| Path | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Public landing page |
| `/login` | `ExternalLogin` | External user login |
| `/register` | `ExternalRegistration` | Public self-registration |
| `/forgot-password` | `ForgotPassword` | Password reset request |
| `/department-login` | `DepartmentLogin` | Internal staff login |
| `/internal/*` | `InternalPortal` | Protected staff portal (role-based) |
| `/external` | `ExternalDashboard` | External user dashboard |
| `/external/new-application` | `NewApplication` | Multi-step application form |
| `/external/edit-application/:id` | `NewApplication` | Edit/resubmit application |
| `/external/view-application/:id` | `ExternalApplicationDetail` | View application + opinion |
| `/external/help` | `HelpDesk` | Help & contact info |
| `/external/profile` | `MyProfile` | User profile management |

---

## Deployment

The application is deployed on **Railway** and configured via `railway.toml`:

```toml
[build]
buildCommand = "npm install && npm run build && cd server && npm install"

[deploy]
startCommand = "node server/index.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

In production, the Express server serves the React `dist/` build as static files and handles all SPA routing via a catch-all route.

**Railway project:** [196dc16b-dbf9-490a-abfb-235ea4baa01d](https://railway.com/project/196dc16b-dbf9-490a-abfb-235ea4baa01d)

---

## Database

SQLite is used as the database (`server/database.sqlite`). The schema is auto-initialized on first run via `server/db.js`.

**Tables:**
- `users` — internal staff accounts (roles, regions, designations)
- `external_users` — public registrants (pending approval flow)  
- `applications` — stamp duty applications with full JSON payload and status workflow
- `fields` — custom dynamic form fields configured by Admin

> The database file is excluded from version control via `.gitignore`.

---

## Branches

| Branch | Purpose |
|---|---|
| `main` | Production-ready code, auto-deployed to Railway |
| `clean-architecture` | Refactored clean folder structure (context / layout / features / ui) |

---

## License

Private — Western Province Stamp Duty Department, Sri Lanka.
