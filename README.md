# InternOps – Workforce Management & Intern Operations Platform

**InternOps** is an enterprise-grade workforce management system designed for the Uptoskills ecosystem. It provides hierarchical role management, attendance tracking, performance ratings, social task assignments, and comprehensive audit logging. The platform enforces strict role-based access control and ownership validation across every operation.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security](#security)
- [Uptoskills Integration](#uptoskills-integration)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

## Features

- **Role Hierarchy** – Strict five-tier structure: Admin, Senior TL, TL, Captain, Intern. Every role has bounded visibility into subordinate data.
- **Authentication & Authorization** – JWT-based access and refresh tokens with rotation, Argon2 password hashing, brute-force protection, and per-request RBAC + ownership validation.
- **Attendance Management** – Single and bulk attendance marking with remarks. Monthly statistics and immutable audit trails.
- **Performance Ratings** – Role-gated rating system (Captain rates Intern, TL rates Captain, etc.). Full rating history is preserved without overwrites.
- **Social Tasks** – Admins and Senior TLs create platform-specific tasks with deadlines. Interns upload proof screenshots; Captains/TLs verify submissions. Images are automatically purged after 24 hours.
- **Notifications** – In-app notifications for attendance, ratings, and task events with read/unread tracking.
- **Meetings** – Hierarchical meeting scheduling with attendee management.
- **Reports & Exports** – Attendance summaries, rating summaries, task completion statistics, and CSV export capabilities.
- **Audit Logging** – Every sensitive action (login, attendance change, rating creation, role modification, etc.) is permanently logged with actor, action, target, and timestamp.
- **Session Management** – Users can view and revoke active sessions; admins can revoke any user's sessions.
- **Uptoskills Integration Ready** – Dedicated module with service placeholders for future API synchronization.
- **Swagger Documentation** – Interactive OpenAPI 3.0 documentation available at /docs.

## Architecture

The platform follows a layered architecture:

- **Web Server Layer** – Fastify with plugins for CORS, Helmet, rate limiting, multipart uploads, and static file serving.
- **Middleware Layer** – Authentication, role-based access control, ownership validation, CSRF protection, input sanitization.
- **Route Layer** – Modular Fastify route plugins for each feature domain.
- **Service Layer** – Business logic for authentication, password reset, hierarchy management, and Uptoskills integration.
- **Repository Layer** – Raw SQL queries via the pg driver; no ORM is used.
- **Database Layer** – PostgreSQL with UUID primary keys, foreign keys, indexes, and soft-delete support.

## Technology Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Node.js, Fastify 4, JavaScript (CommonJS) |
| Frontend  | React, Vite, TailwindCSS, Axios, TanStack Query, Zustand |
| Database  | PostgreSQL (Neon serverless)        |
| Auth      | JWT, Argon2, refresh token rotation |
| Caching   | Redis (Upstash) – optional          |
| Docs      | Swagger (OpenAPI 3.0) via @fastify/swagger |
| Security  | Helmet, CORS, Rate Limiting, CSRF, Input Sanitization, Brute-Force Protection |
| DevOps    | Git, GitHub, PowerShell scripting   |

## Project Structure

\\\
InternOps/
├── backend/
│   ├── src/
│   │   ├── config/          # Database pool, Redis client, environment configuration
│   │   ├── middleware/       # auth, rbac, ownership, csrf, bruteForce, sanitize, directManager
│   │   ├── modules/          # Feature modules (auth, users, departments, hierarchy, attendance, ratings, social-tasks, proof-submissions, notifications, audit, uploads, analytics, meetings, sessions, reports, uptoskills)
│   │   ├── utils/            # Token generation, hierarchy helpers, audit logging, cron jobs
│   │   ├── services/         # Email service placeholder
│   │   └── app.js            # Fastify entry point
│   ├── migrations/           # SQL migration files
│   ├── seeds/                # Seed scripts (admin user)
│   └── package.json
├── frontend/                 # React + Vite application (independent)
├── docs/                     # Project documentation
├── scripts/                  # Utility PowerShell scripts
└── README.md
\\\

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+ (or a Neon database connection string)
- Git

### 1. Clone the Repository

\\\ash
git clone https://github.com/rajat-wyrm/InternOps.git
cd InternOps
\\\

### 2. Install Dependencies

\\\ash
# Backend
cd backend
npm install
cd ..

# Frontend (optional)
cd frontend
npm install
cd ..
\\\

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

\\\ash
cp backend/.env.example backend/.env
\\\

Edit ackend/.env and set the required variables (see [Environment Variables](#environment-variables)).

### 4. Run Database Migrations and Seed

\\\ash
cd backend
npm run migrate
npm run seed
\\\

The seed script creates a default administrator account:
- Email: dmin@internops.com
- Password: Admin@123

### 5. Start the Backend Server

\\\ash
npm run dev
\\\

The API server will start on http://localhost:5000. Swagger UI is available at http://localhost:5000/docs.

### 6. Start the Frontend (Optional)

\\\ash
cd frontend
npm run dev
\\\

The frontend runs on http://localhost:5173 and proxies API requests to the backend.

## Environment Variables

The following variables are defined in ackend/.env:

| Variable               | Description                                      | Required |
|------------------------|--------------------------------------------------|----------|
| PORT                 | Server port (default: 5000)                      | No       |
| DATABASE_URL         | PostgreSQL connection string                     | Yes      |
| JWT_SECRET           | Secret key for JWT signing                       | Yes      |
| JWT_EXPIRES_IN       | Token expiration duration (e.g., 7d)           | No       |
| API_KEY              | Internal API key for service-to-service calls    | No       |
| CORS_ORIGIN          | Allowed CORS origin (default: localhost:5173)    | No       |
| UPSTASH_REDIS_REST_URL| Redis connection URL (optional)                 | No       |
| UPSTASH_REDIS_REST_TOKEN| Redis authentication token (optional)        | No       |
| GOOGLE_CLIENT_ID     | Google OAuth client ID (future use)              | No       |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret (future use)          | No       |
| FAST2SMS_API_KEY     | Fast2SMS API key (future use)                    | No       |
| GROQ_API_KEY         | Groq AI API key (future use)                     | No       |
| OPENAI_API_KEY       | OpenAI API key (future use)                      | No       |
| GEMINI_API_KEY       | Google Gemini API key (future use)               | No       |
| DEEPSEEK_API_KEY     | DeepSeek API key (future use)                    | No       |
| HUGGINGFACE_TOKEN    | Hugging Face API token (future use)              | No       |
| EMAIL_API_KEY        | Email service API key (future use)               | No       |
| EMAIL_FROM           | Sender address for emails (future use)           | No       |
| UPTOSKILLS_BASE_URL  | Base URL for Uptoskills API (future use)         | No       |
| UPTOSKILLS_API_KEY   | API key for Uptoskills integration (future use)  | No       |

## API Documentation

Full interactive API documentation is available via Swagger UI at /docs when the server is running.

### Core Endpoints

| Method | Endpoint                              | Description                       | Roles                       |
|--------|---------------------------------------|-----------------------------------|-----------------------------|
| POST   | /api/auth/login                       | User login                        | Public                      |
| POST   | /api/auth/register                    | Register a new user (Admin only)  | Admin                       |
| POST   | /api/auth/refresh                     | Refresh access token              | Public                      |
| POST   | /api/auth/logout                      | Logout and revoke refresh token   | Authenticated               |
| POST   | /api/auth/forgot-password             | Request password reset            | Public                      |
| POST   | /api/auth/reset-password              | Reset password with token         | Public                      |
| GET    | /api/auth/csrf-token                  | Get CSRF token                    | Public                      |
| GET    | /api/users                            | List users (paginated)            | Admin                       |
| GET    | /api/users/me                         | Get current user profile          | Authenticated               |
| PATCH  | /api/users/me                         | Update own profile                | Authenticated               |
| PATCH  | /api/users/me/password                | Change own password               | Authenticated               |
| GET    | /api/users/:id                        | Get user by ID (ownership check)  | Hierarchy-based             |
| PATCH  | /api/users/:id/suspend                | Suspend a user                    | Admin                       |
| PATCH  | /api/users/:id/activate               | Activate a user                   | Admin                       |
| DELETE | /api/users/:id                        | Soft-delete a user                | Admin                       |
| POST   | /api/departments                      | Create a department               | Admin                       |
| GET    | /api/departments                      | List all departments              | Admin, Senior TL            |
| GET    | /api/hierarchy/my/direct-reports      | List direct reports               | Authenticated               |
| GET    | /api/hierarchy/my/team                | List entire team                  | Authenticated               |
| GET    | /api/hierarchy/my/chain               | List upward management chain      | Authenticated               |
| POST   | /api/attendance/mark                  | Mark single attendance            | Manager of target user      |
| POST   | /api/attendance/bulk                  | Bulk mark attendance              | Manager of target users     |
| GET    | /api/attendance/:userId               | View attendance records           | Hierarchy-based             |
| GET    | /api/attendance/:userId/stats         | Monthly attendance stats          | Hierarchy-based             |
| POST   | /api/ratings                          | Submit a rating                   | Manager of target user      |
| GET    | /api/ratings/:userId                  | View ratings for a user           | Hierarchy-based             |
| POST   | /api/tasks                            | Create a social task              | Admin, Senior TL            |
| GET    | /api/tasks                            | List all tasks                    | Authenticated               |
| POST   | /api/proofs/submit                    | Submit proof (multipart upload)   | Intern                      |
| PATCH  | /api/proofs/:id/verify                | Verify a proof submission         | Captain, TL, Senior TL      |
| GET    | /api/proofs/task/:taskId              | View proofs for a task            | Captain, TL, Senior TL, Admin |
| GET    | /api/proofs/my                        | View own proofs                   | Authenticated               |
| GET    | /api/notifications                    | List notifications                | Authenticated               |
| GET    | /api/notifications/unread-count       | Get unread notification count     | Authenticated               |
| POST   | /api/notifications/read-all           | Mark all notifications as read    | Authenticated               |
| PATCH  | /api/notifications/:id/read           | Mark a single notification as read| Authenticated               |
| DELETE | /api/notifications/:id                | Delete a notification             | Authenticated               |
| GET    | /api/audit                            | View audit logs                   | Admin                       |
| POST   | /api/uploads/avatar                   | Upload profile avatar             | Authenticated               |
| GET    | /api/analytics/overview               | User role distribution            | Admin, Senior TL            |
| GET    | /api/analytics/department-attendance  | Department attendance rate        | Admin, Senior TL            |
| GET    | /api/analytics/top-performers         | Top rated users by role           | Admin, Senior TL, TL        |
| GET    | /api/analytics/attendance-trends      | Attendance trends over months     | Admin, Senior TL            |
| POST   | /api/meetings                         | Create a meeting                  | Admin, Senior TL, TL        |
| GET    | /api/meetings                         | List meetings                     | Hierarchy-based             |
| GET    | /api/meetings/:id                     | Get meeting details               | Hierarchy-based             |
| PATCH  | /api/meetings/:id                     | Update meeting                    | Creator or Admin            |
| DELETE | /api/meetings/:id                     | Soft-delete meeting               | Creator or Admin            |
| POST   | /api/meetings/:id/attendees           | Add attendee to meeting           | Creator or Admin            |
| DELETE | /api/meetings/:id/attendees/:userId   | Remove attendee from meeting      | Creator or Admin            |
| GET    | /api/sessions/me                      | List own active sessions          | Authenticated               |
| DELETE | /api/sessions/me/:sessionId           | Revoke a session                  | Authenticated               |
| POST   | /api/sessions/me/revoke-all           | Revoke all own sessions           | Authenticated               |
| POST   | /api/sessions/admin/revoke-user/:userId| Revoke all sessions of a user   | Admin                       |
| GET    | /api/reports/attendance-summary       | Attendance summary by role        | Admin, Senior TL            |
| GET    | /api/reports/ratings-summary          | Rating summary by role            | Admin, Senior TL            |
| GET    | /api/reports/task-completion          | Task completion statistics        | Admin, Senior TL            |
| GET    | /api/reports/export/attendance-csv    | Export attendance CSV             | Admin, Senior TL            |
| GET    | /api/reports/export/ratings-csv       | Export ratings CSV                | Admin, Senior TL            |
| GET    | /api/reports/export/tasks-csv         | Export tasks CSV                  | Admin, Senior TL            |
| GET    | /api/uptoskills/sync-status           | Uptoskills sync status placeholder| Admin                       |
| GET    | /health                               | Basic health check                | Public                      |
| GET    | /health/db                            | Database health check             | Public                      |
| GET    | /health/full                          | Full health (DB + Redis)          | Public                      |

## Database Schema

The system uses PostgreSQL with UUID primary keys and soft-delete columns (deleted_at). Key tables include:

- users – User accounts with role, manager hierarchy, department, and suspension status.
- departments – Department names and creators.
- ttendance – Immutable attendance records with status (Present/Absent/Half-day) and remarks.
- atings – Permanent rating history with score (1-5), reviewer, and remarks.
- social_tasks – Task definitions with deadlines and target platforms.
- proof_submissions – Image uploads linked to tasks, with verification status.
- 
otifications – In-app notification messages per user.
- udit_logs – Complete history of all sensitive actions.
- meetings – Scheduled meetings with attendees.
- efresh_tokens – JWT refresh token store.
- login_attempts – Brute-force tracking table.

All tables use foreign keys and indexes for referential integrity and performance.

## Security

The platform implements multiple layers of security:

- **Authentication** – JWT access tokens (15 min) and refresh tokens (7 days) with rotation. Argon2 password hashing.
- **Authorization** – RBAC middleware checks user role; ownership middleware validates hierarchical access on every request.
- **Brute-Force Protection** – Login attempts are tracked per email and IP; accounts are temporarily locked after 5 failures within 15 minutes.
- **CSRF Protection** – All state-changing requests require an X-CSRF-Token header.
- **Rate Limiting** – General rate limiting (100 requests/min) and stricter limits on authentication routes (5 requests/min).
- **Helmet** – Sets secure HTTP headers (CSP, HSTS, XSS protection, etc.).
- **Input Sanitization** – Strips HTML tags and quotes from incoming data to prevent XSS and SQL injection.
- **File Upload Validation** – MIME type and extension whitelisting, unique filenames (UUID), size limits.
- **Audit Logging** – Immutable log of every sensitive action with actor, target, old/new values, IP, and user agent.

## Uptoskills Integration

A dedicated integration module (ackend/src/modules/uptoskills) provides placeholder service functions and an endpoint. Developers can implement the actual synchronization by filling in the following stubs:

- getInternsFromUptoskills()
- getDepartmentsFromUptoskills()
- syncUsers()
- syncAttendance()
- syncProjects()

All URLs and API keys are configured via environment variables (UPTOSKILLS_BASE_URL, UPTOSKILLS_API_KEY).

## Testing

The backend can be tested using the comprehensive PowerShell diagnostic script located in the project root. It verifies:

- Server health and connectivity
- Authentication flow (login, CSRF, token refresh)
- All protected endpoints with valid tokens
- Database connectivity and schema
- Middleware behavior (RBAC, ownership)

To run the test suite:

\\\powershell
# From the project root (C:\Users\rajat\InternOps)
.\scripts\full-test.ps1
\\\

## Deployment

### Production Considerations

- Set NODE_ENV=production in the .env file.
- Use a strong JWT_SECRET and rotate it periodically.
- Configure CORS_ORIGIN to the exact production frontend URL.
- Set up a process manager (e.g., PM2) to keep the Node.js server running.
- Use a reverse proxy (Nginx, Traefik) for SSL termination.
- Run migrations as part of the CI/CD pipeline.
- Regularly backup the PostgreSQL database.

### Sample PM2 Configuration

\\\ash
npm install -g pm2
pm2 start backend/src/app.js --name internops --env production
pm2 save
pm2 startup
\\\

## License

InternOps is proprietary software developed for the Uptoskills ecosystem. All rights reserved.

---

**Maintainers:** Rajat 
**Contact:** [GitHub Issues](https://github.com/rajat-wyrm/InternOps/issues)