# SalesPilot — Sales Meeting & Visit Management System

## Overview

SalesPilot is a MERN-stack application for managing customer meetings, recording sales visits, tracking meeting outcomes, and assigning follow-up actions.

The project is designed around a simple question:

> **What needs to happen before, during, and after a sales meeting?**

An employee can create customers and manage assigned meetings. Managers can oversee their team and reopen completed meetings when necessary. Admins manage users and have full visibility.

The project focuses on business logic, data modelling, meeting lifecycle transitions, role-based access control, and maintainable backend architecture.

### Follow the main workflow

```text
Register / log in
        ↓
Create or select a customer
        ↓
Schedule a meeting
        ↓
Confirm → Check in → Start → Check out
                              ↓
                       Complete or pause
                              ↓
                    Record outcome / follow-up
```

For a guided API walkthrough, start with the [API endpoint list](#api-documentation).

## Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT
- **Password Security:** bcryptjs
- **Testing:** Vitest, Supertest, mongodb-memory-server

## Architecture

The application follows a layered backend architecture:

1. Routes define API endpoints.
2. Middleware handles authentication and authorization.
3. Controllers process requests and format responses.
4. Services enforce business rules.
5. Mongoose models define database structures.
6. MongoDB stores application data.

The React frontend communicates with the Express backend through REST APIs. The frontend never connects directly to MongoDB.

## Main Features

- User registration and login
- Role-based access for employees, managers, and admins
- Customer and meeting management
- Meeting confirmation and lifecycle transitions
- Check-in and check-out timestamp recording
- Multiple visit sessions for a single meeting
- Meeting outcome recording
- Follow-up assignment and completion
- Manager reopening of completed meetings with a reason and history
- Automated API and business-rule tests

## Database Collections

- **Users:** account details, role, and manager relationship
- **Customers:** customer accounts and contact information
- **Meetings:** schedule, assignee, status, outcome, visit sessions, and reopening history
- **FollowUps:** action description, owner, due date, and completion status

## Local Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or a compatible MongoDB instance
- Git

### 1. Install frontend dependencies

```bash
cd client
npm install
```

### 2. Install backend dependencies

```bash
cd ../server
npm install
```

### 3. Configure environment variables

Create `server/.env`:

```dotenv
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=1d
```

Never commit real credentials to source control.

### 4. Create initial Admin account (Bootstrap)

To securely bootstrap the first Admin user without exposing public admin registration endpoints:

```bash
cd server
npm run create-admin <admin_email> <admin_password> "System Admin"
```

Alternatively, define `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` and execute `npm run create-admin`.

This script hashes the password with bcrypt, assigns the `admin` role, and ensures safe initialization. Once logged in, the Admin can use the **User Management** screen to create and manage Sales Employees and Sales Managers.

### 5. Start the backend

From the `server` directory:

```bash
npm run dev
```

The backend runs on `http://localhost:5000`.

### 6. Start the frontend

In a separate terminal:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Running Tests

From the `server` directory:

```bash
npm test
```

Tests use an isolated in-memory MongoDB database. They should not require the development database to be modified.

## Deployment Guide

This guide covers deploying SalesPilot in a decoupled production architecture:
1. **Database:** Managed MongoDB cluster (e.g., MongoDB Atlas).
2. **Backend Web Service:** Node.js/Express service (e.g., Render, Railway, Fly.io, Heroku, or AWS/DigitalOcean).
3. **Frontend Application:** Static React site (e.g., Vercel, Netlify, Render Static, or Cloudflare Pages).

---

### Step 1: MongoDB Database Setup (MongoDB Atlas)

1. **Create an Atlas Cluster:**
   - Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a free (M0) or dedicated cluster in your target region.
2. **Configure Database Credentials:**
   - Navigate to **Security** → **Database Access**.
   - Create a database user (e.g., `salespilot_app`) with **Read and write to any database** privileges and a strong password.
3. **Configure Network Access (IP Whitelist):**
   - Navigate to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - For dynamically hosted server platforms (Render, Railway, Fly.io), add `0.0.0.0/0` (Allow Access from Anywhere), or specify your server's static egress IP.
4. **Obtain Connection String:**
   - Click **Connect** → **Drivers** → **Node.js**.
   - Copy the URI, replacing `<password>` and specifying your database name (e.g., `salespilot`):
     ```text
     mongodb+srv://salespilot_app:<password>@cluster0.abcde.mongodb.net/salespilot?retryWrites=true&w=majority
     ```

---

### Step 2: Backend Deployment (Node.js & Express)

Deploy the `server/` directory as a Node.js Web Service on your chosen hosting provider (e.g., Render, Railway, AWS ECS).

#### Service Settings:
- **Root Directory:** `server`
- **Environment:** Node.js (v18, v20, or v22 recommended)
- **Build Command:** `npm install`
- **Start Command:** `npm start` (executes `node server.js`)

#### Backend Environment Variables:

| Variable | Description | Example / Default |
| --- | --- | --- |
| `PORT` | Listening port assigned automatically by host | `5000` |
| `NODE_ENV` | Runtime environment | `production` |
| `MONGO_URI` (or `MONGODB_URI`) | Atlas MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing and verifying tokens | Strong random 32+ char string |
| `JWT_EXPIRES_IN` | Token validity duration | `1d` |
| `CLIENT_URL` | Allowed frontend origin for CORS (comma-separated if multiple) | `https://your-salespilot-frontend.vercel.app` |

> [!NOTE]
> `server/src/app.js` automatically allows `CLIENT_URL`, localhost development ports, and health checks while restricting untrusted origins in production.

#### Verify Backend Deployment:
Once deployed, check the public health check endpoint:
```bash
curl https://<your-backend-domain>/api/health
```
Expected response:
```json
{
  "success": true,
  "message": "SalesPilot API is running",
  "timestamp": "2026-10-16T..."
}
```

---

### Step 3: Frontend Deployment (React + Vite)

Deploy the `client/` directory as a Static Site (e.g., on Vercel, Netlify, or Render Static).

#### Build & Output Settings:
- **Root Directory:** `client`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Publish / Output Directory:** `dist`

#### Frontend Environment Variables:

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of your deployed backend service (without trailing slash) | `https://your-backend-domain.onrender.com` |

> [!CAUTION]
> In Vite, all environment variables prefixed with `VITE_` are bundled directly into client-facing JavaScript. **Never put database credentials, JWT secrets, or private keys in the frontend environment.**

#### SPA Routing Fallback:
Because SalesPilot is a Single Page Application (SPA), client-side routes like `/register` and `/login` require fallback rewrites so browser refreshes do not produce 404s:
- **Vercel:** Automatically handled by `client/vercel.json`.
- **Netlify:** Automatically handled by `client/public/_redirects`.

---

### Step 4: Initial Admin Account Provisioning (Bootstrap)

Once the backend and database are live, initialize the system administrator account:

**Option A — Via SSH / Web Service Shell:**
Open the web console on your backend provider and execute:
```bash
npm run create-admin admin@yourcompany.com "SecurePass123!" "System Administrator"
```

**Option B — One-Time Environment Trigger:**
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the backend environment variables, trigger `node src/scripts/createAdmin.js`, and remove the credentials from the environment once created.

---

### Step 5: Post-Deployment Smoke Test Checklist

Follow this checklist to verify your end-to-end production deployment:

1. **Verify Health Check:**
   - Open `https://<backend-url>/api/health` in a browser or terminal.
   - Confirm HTTP 200 with `success: true`.
2. **Access Frontend Application:**
   - Navigate to `https://<frontend-url>/` in your browser.
   - Verify the login screen renders with proper CRM styling.
3. **Log in as Administrator:**
   - Log in using your bootstrapped Admin credentials.
   - Confirm that the top navigation bar displays the user name and `Admin` badge.
   - Verify that the browser address bar cleanly displays root `/`.
4. **Provision Team Users:**
   - Open **User Management** in the navbar.
   - Create a Sales Employee account and a Sales Manager account.
5. **Create Customer & Schedule Meeting:**
   - Switch to **Customers** tab → click **+ Add Customer Account** → save a client record.
   - Switch to **Meetings** tab → click **+ Schedule Meeting** → select the customer, set date/time, and save.
6. **Execute Meeting Lifecycle Actions:**
   - Confirm the meeting (`Confirm Meeting`).
   - Simulate visit start (`Check In` → `Start Meeting`).
   - Conclude meeting (`Complete Meeting` with outcome and follow-up).
7. **Verify Follow-up Creation:**
   - Switch to **Follow-ups** tab → confirm the generated follow-up task is listed and can be marked completed.

## API Documentation

The backend is a JSON REST API. Unless an endpoint is marked **Public**, send the JWT returned by registration or login in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

The complete request and response examples are in [server/API.md](server/API.md). The quick reference below helps you find the right endpoint without opening the full document.

### Start here: health and authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Check that the server is running |
| `POST` | `/api/auth/register` | Public | Register an employee account |
| `POST` | `/api/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Protected | Restore and validate the current session |

Example login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"jane@example.com\",\"password\":\"Password123!\"}"
```

### Users and customers

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/users` | Admin | Create an employee, manager, or admin |
| `GET` | `/api/users` | Admin | List users and manager relationships |
| `GET` | `/api/customers` | Protected | List customers visible to the current user |
| `POST` | `/api/customers` | Protected | Create a customer |

### Meeting management

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/meetings` | Protected | Schedule a meeting |
| `GET` | `/api/meetings` | Protected | List meetings according to the user's role |
| `GET` | `/api/meetings/:id` | Protected | View one meeting |
| `PATCH` | `/api/meetings/:id` | Protected | Edit a scheduled meeting |

### Meeting lifecycle

Use these endpoints in order. The server validates the allowed status transition, the user's role, and whether the user is assigned to the meeting.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `PATCH` | `/api/meetings/:id/confirm` | `scheduled` → `confirmed` |
| `POST` | `/api/meetings/:id/check-in` | Start or resume a visit |
| `PATCH` | `/api/meetings/:id/start` | `checked_in` → `in_progress` |
| `POST` | `/api/meetings/:id/check-out` | Pause a visit or complete the meeting |
| `PATCH` | `/api/meetings/:id/reopen` | Reopen a completed meeting (manager/admin) |

When checking out permanently, the request can include an outcome and a follow-up:

```json
{
  "pause": false,
  "outcome": "follow_up_required",
  "followUp": {
    "description": "Send updated quotation",
    "owner": "<user_id>",
    "dueDate": "2026-11-25T17:00:00.000Z"
  }
}
```

### Follow-ups

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/follow-ups` | Protected | List follow-ups visible to the current user |
| `PATCH` | `/api/follow-ups/:id/complete` | Owner, manager, or admin | Mark a follow-up as completed |

### Roles at a glance

| Role | Typical responsibility |
| --- | --- |
| `employee` | Manage assigned meetings, customers, visits, and follow-ups |
| `manager` | See team activity, manage relevant meetings, and reopen completed meetings |
| `admin` | Manage users and access all application data |

If an endpoint returns `401`, log in again or send a valid token. A `403` usually means the token is valid but the role or ownership rules do not allow the requested action.

## Database Model

See [server/ER-DIAGRAM.md](server/ER-DIAGRAM.md) for the logical database relationships and collection descriptions.

## Decisions & Trade-offs

This section explains what the project assumes today, where it takes a shortcut, and what should change before production use.

| Decision | Why it is useful now | Production improvement |
| --- | --- | --- |
| **MERN stack** | JavaScript is used across the client and server, which keeps the project approachable and reduces context switching. | Add stricter TypeScript or schema validation as the domain and team grow. |
| **Layered backend** | Routes, controllers, services, and models have separate responsibilities, making business rules easier to test. | Add request/response schemas, centralized error handling, structured logs, and tracing. |
| **Embedded visit sessions** | Visit sessions are stored inside a meeting, so pause/resume behavior does not require another collection. | Review document size and write contention at scale; move visits to a separate collection if meetings become very large or highly concurrent. |
| **Separate follow-up collection** | Follow-ups have their own owner, due date, status, and completion timestamp. | Add indexes, pagination, reminders, and a background job/queue for notifications. |
| **JWT in browser storage** | Stateless JWT authentication is simple for this prototype and works well with the React client. | Prefer short-lived access tokens with refresh-token rotation and an `HttpOnly`, `Secure`, `SameSite` cookie strategy. |
| **Direct manager reference** | A `manager` field on a user is enough for a small, single-organization team model. | Introduce organization/team boundaries and a more explicit permission model for multiple tenants or complex reporting lines. |
| **Role-based authorization** | Employee, manager, and admin roles cover the current workflows clearly. | Add policy-based authorization, exhaustive negative tests, and audit logs for sensitive actions. |
| **MongoDB Atlas-compatible persistence** | MongoDB matches the document-shaped meeting and visit data and is easy to run during development. | Configure backups, monitoring, indexes, connection limits, retry behavior, and a tested disaster-recovery process. |
| **Free-tier deployment can sleep** | A free Render service keeps costs at zero for a demo or hobby deployment. | Use an always-on paid service for reliable latency, or accept the cold-start trade-off and monitor it honestly. |
| **Minimal validation and operations** | The current implementation focuses on core meeting rules and HTTP-level tests. | Add rate limiting, stronger input validation, security headers, dependency scanning, CI/CD, metrics, alerting, and load testing. |

### Intentional shortcuts

- Registration is available as a public employee onboarding path; the bootstrap script is used to create the first admin.
- Meetings and follow-ups currently use straightforward list endpoints rather than pagination and advanced search.
- The health endpoint is intentionally lightweight and does not perform a write.
- The test suite uses `mongodb-memory-server`, so tests remain isolated from the development database.

These choices keep the project easy to understand and demonstrate, but they should be revisited before handling sensitive, high-volume, or business-critical workloads.

## Future Improvements

- Add a complete React interface for meeting and follow-up management.
- Add pagination, filtering, and search.
- Add more comprehensive automated tests and continuous integration.
- Improve audit logging and production security.
- Add deployment configuration and monitoring.

## Project Status

The project is developed incrementally, with emphasis on understanding and testing the underlying business logic before expanding the user interface.