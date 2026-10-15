# SalesPilot API Documentation

All protected endpoints require an `Authorization` header formatted as:
`Authorization: Bearer <jwt_token>`

---

## 1. Authentication APIs

### Register User
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "token": "<jwt_token>",
    "user": {
      "id": "67...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "employee"
    }
  }
  ```

### Login User
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "<jwt_token>",
    "user": {
      "id": "67...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "employee"
    }
  }
  ```

### Current User Session
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Access:** Protected
- **Response (200):**
  ```json
  {
    "success": true,
    "user": {
      "id": "67...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "employee"
    }
  }
  ```

---

## 2. User Management APIs (Admin Only)

### Create User
- **Method:** `POST`
- **Path:** `/api/users`
- **Access:** Protected (Admin only)
- **Request Body:**
  ```json
  {
    "name": "Alex Morgan",
    "email": "alex@salespilot.com",
    "password": "Password123!",
    "role": "employee",
    "manager": "<manager_id>"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "user": {
      "id": "67...",
      "name": "Alex Morgan",
      "email": "alex@salespilot.com",
      "role": "employee",
      "manager": "<manager_id>"
    }
  }
  ```

### List Users
- **Method:** `GET`
- **Path:** `/api/users`
- **Access:** Protected (Admin only)
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 2,
    "users": [
      {
        "_id": "67...",
        "name": "Alex Morgan",
        "email": "alex@salespilot.com",
        "role": "employee",
        "manager": {
          "_id": "67...",
          "name": "John Manager",
          "email": "john@salespilot.com"
        },
        "createdAt": "..."
      }
    ]
  }
  ```

---

## 3. Customer APIs

### List Customers
- **Method:** `GET`
- **Path:** `/api/customers`
- **Access:** Protected (employee, manager, admin)
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 1,
    "customers": [
      {
        "_id": "67...",
        "accountName": "Acme Corp",
        "contactPerson": "John Smith",
        "email": "john@acme.com",
        "phone": "+1 555-0100",
        "address": "123 Business Rd",
        "createdBy": "67..."
      }
    ]
  }
  ```

### Create Customer
- **Method:** `POST`
- **Path:** `/api/customers`
- **Access:** Protected (employee, manager, admin)
- **Request Body:**
  ```json
  {
    "accountName": "Acme Corp",
    "contactPerson": "John Smith",
    "email": "john@acme.com",
    "phone": "+1 555-0100",
    "address": "123 Business Rd"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "customer": {
      "_id": "67...",
      "accountName": "Acme Corp",
      "contactPerson": "John Smith",
      "email": "john@acme.com",
      "phone": "+1 555-0100",
      "address": "123 Business Rd",
      "createdBy": "67..."
    }
  }
  ```

---

## 3. Meeting Management APIs

### Create Meeting
- **Method:** `POST`
- **Path:** `/api/meetings`
- **Access:** Protected
- **Request Body:**
  ```json
  {
    "customer": "<customer_id>",
    "assignedTo": "<user_id>",
    "purpose": "Product Demonstration",
    "scheduledStart": "2026-11-20T10:00:00.000Z",
    "scheduledEnd": "2026-11-20T11:00:00.000Z",
    "location": "Client HQ / Online",
    "notes": "Agenda notes"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "meeting": {
      "_id": "67...",
      "status": "scheduled",
      "purpose": "Product Demonstration",
      "scheduledStart": "2026-11-20T10:00:00.000Z",
      "scheduledEnd": "2026-11-20T11:00:00.000Z",
      "location": "Client HQ / Online",
      "customer": "<customer_id>",
      "assignedTo": "<user_id>",
      "createdBy": "<user_id>",
      "visits": []
    }
  }
  ```

### List Meetings
- **Method:** `GET`
- **Path:** `/api/meetings`
- **Access:** Protected (Role-filtered: Employee sees own meetings; Manager sees team; Admin sees all)
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 1,
    "meetings": [...]
  }
  ```

### Get Meeting By ID
- **Method:** `GET`
- **Path:** `/api/meetings/:id`
- **Access:** Protected (Role & team scoped)

### Update Meeting
- **Method:** `PATCH`
- **Path:** `/api/meetings/:id`
- **Access:** Protected (Only allowed when meeting status is `scheduled`)

---

## 4. Meeting Lifecycle APIs

### Confirm Meeting
- **Method:** `PATCH`
- **Path:** `/api/meetings/:id/confirm`
- **Access:** Protected (Assigned employee, or manager/admin)
- **Precondition:** Meeting status must be `scheduled`
- **Response (200):** Status transitions to `confirmed`.

### Check In (Start or Resume Visit)
- **Method:** `POST`
- **Path:** `/api/meetings/:id/check-in`
- **Access:** Protected (Assigned employee, or manager/admin)
- **Precondition:** Meeting status must be `confirmed` or `paused`. No open visit.
- **Request Body (Optional):**
  ```json
  {
    "location": {
      "latitude": 28.5355,
      "longitude": 77.3910
    }
  }
  ```
- **Response (200):** Status transitions to `checked_in`. Appends new entry to `visits`.

### Start Meeting
- **Method:** `PATCH`
- **Path:** `/api/meetings/:id/start`
- **Access:** Protected (Assigned employee, or manager/admin)
- **Precondition:** Meeting status must be `checked_in`.
- **Response (200):** Status transitions to `in_progress`.

### Check Out (Temporary Checkout / Pause OR Complete)
- **Method:** `POST`
- **Path:** `/api/meetings/:id/check-out`
- **Access:** Protected (Assigned employee, or manager/admin)
- **Precondition:** Meeting status must be `in_progress`.
- **Request Body (Temporary Checkout / Pause):**
  ```json
  {
    "pause": true,
    "reasonForLeaving": "Customer stepped out for lunch; returning at 3 PM"
  }
  ```
  *Response (200):* Status transitions to `paused`. `checkOutAt` and `reasonForLeaving` recorded on current visit.
- **Request Body (Final Completion):**
  ```json
  {
    "pause": false,
    "outcome": "follow_up_required",
    "reasonForLeaving": "Meeting concluded",
    "followUp": {
      "description": "Send updated quotation",
      "owner": "<user_id>",
      "dueDate": "2026-11-25T17:00:00.000Z"
    }
  }
  ```
  *Allowed outcomes:* `interested`, `follow_up_required`, `proposal_requested`, `not_interested`, `unable_to_meet`.
  *Response (200):* Status transitions to `completed`. Follow-up record created in `FollowUp` collection if required.

### Reopen Meeting
- **Method:** `PATCH`
- **Path:** `/api/meetings/:id/reopen`
- **Access:** Protected (Manager of team or Admin)
- **Precondition:** Meeting status must be `completed`.
- **Request Body:**
  ```json
  {
    "reason": "Client requested re-negotiation of scope"
  }
  ```
- **Response (200):** Status transitions back to `scheduled`. Record appended to `reopenHistory`.

---

## 5. Follow-up APIs

### List Follow-ups
- **Method:** `GET`
- **Path:** `/api/follow-ups`
- **Access:** Protected (Employee sees own assigned; Manager sees team; Admin sees all)
- **Response (200):**
  ```json
  {
    "success": true,
    "count": 1,
    "followUps": [
      {
        "_id": "67...",
        "meeting": { "purpose": "...", "status": "completed", "outcome": "..." },
        "description": "Send revised proposal",
        "owner": { "name": "...", "email": "..." },
        "dueDate": "2026-11-25T17:00:00.000Z",
        "status": "pending",
        "completedAt": null
      }
    ]
  }
  ```

### Complete Follow-up
- **Method:** `PATCH`
- **Path:** `/api/follow-ups/:id/complete`
- **Access:** Protected (Owner, team manager, or admin)
- **Response (200):** Status transitions to `completed`, `completedAt` timestamp recorded.

---

## 6. System Health

### Health Check
- **Method:** `GET`
- **Path:** `/api/health` (also accessible at `/health`)
- **Access:** Public
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "SalesPilot API is running"
  }
  ```
