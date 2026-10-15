# SalesPilot — Sales Meeting & Visit Management System

## Overview

SalesPilot is a MERN-stack application for managing customer meetings, recording sales visits, tracking meeting outcomes, and assigning follow-up actions.

The project focuses on business logic, data modelling, meeting lifecycle transitions, role-based access control, and maintainable backend architecture.

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

### 4. Start the backend

From the `server` directory:

```bash
npm run dev
```

The backend runs on `http://localhost:5000`.

### 5. Start the frontend

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

## API Documentation

See [server/API.md](server/API.md) for the endpoint list, authentication requirements, and request conventions.

## Database Model

See [server/ER-DIAGRAM.md](server/ER-DIAGRAM.md) for the logical database relationships and collection descriptions.

## Decisions & Trade-offs

- **MERN stack:** Uses JavaScript across the frontend and backend, reducing context switching.
- **Layered backend:** Separates routing, request handling, business rules, and data access responsibilities.
- **Embedded visit sessions:** Preserves multiple check-in/check-out periods within one meeting without introducing another collection.
- **Separate follow-up collection:** Allows each follow-up to have an independent owner, due date, and completion status.
- **JWT authentication:** Supports stateless API authentication, while protected endpoints retrieve the current user to check current account and role information.
- **Simplified team model:** Uses a direct manager reference on each user instead of a more complex organizational hierarchy.
- **Testing strategy:** Uses HTTP-level tests and an isolated database to verify important business rules.
- **Production considerations:** Transactions, concurrency control, rate limiting, stronger request validation, audit retention, and more comprehensive authorization tests require additional hardening.

## Future Improvements

- Add a complete React interface for meeting and follow-up management.
- Add pagination, filtering, and search.
- Add more comprehensive automated tests and continuous integration.
- Improve audit logging and production security.
- Add deployment configuration and monitoring.

## Project Status

The project is developed incrementally, with emphasis on understanding and testing the underlying business logic before expanding the user interface.