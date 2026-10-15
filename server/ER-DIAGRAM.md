# SalesPilot Entity-Relationship (ER) Diagram & Data Model

SalesPilot uses MongoDB with Mongoose schemas. Below is the logical data model and entity relationships.

## Entity Relationship Overview

```mermaid
erDiagram
    USER ||--o{ CUSTOMER : "creates"
    USER ||--o{ MEETING : "assigned to / creates"
    USER ||--o{ FOLLOW_UP : "owns / creates"
    USER ||--o{ USER : "manages (manager -> employee)"
    
    CUSTOMER ||--o{ MEETING : "has"
    
    MEETING ||--o{ VISIT : "contains (embedded array)"
    MEETING ||--o{ REOPEN_HISTORY : "contains (embedded array)"
    MEETING ||--o{ FOLLOW_UP : "triggers (1 to many)"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password "hashed with bcrypt"
        string role "employee | manager | admin"
        ObjectId manager FK "points to User (_id)"
        Date createdAt
        Date updatedAt
    }

    CUSTOMER {
        ObjectId _id PK
        string accountName
        string contactPerson
        string email
        string phone
        string address
        ObjectId createdBy FK "points to User (_id)"
        Date createdAt
        Date updatedAt
    }

    MEETING {
        ObjectId _id PK
        ObjectId customer FK "points to Customer (_id)"
        ObjectId assignedTo FK "points to User (_id)"
        ObjectId createdBy FK "points to User (_id)"
        string purpose
        Date scheduledStart
        Date scheduledEnd
        string location
        string notes
        string status "scheduled | confirmed | checked_in | in_progress | paused | completed"
        string outcome "interested | follow_up_required | proposal_requested | not_interested | unable_to_meet"
        Array visits "Embedded visit sessions"
        Array reopenHistory "Embedded reopen records"
        Date createdAt
        Date updatedAt
    }

    VISIT {
        ObjectId _id PK
        Date checkInAt
        Date checkOutAt
        Object checkInLocation "{ latitude, longitude }"
        Object checkOutLocation "{ latitude, longitude }"
        string reasonForLeaving
    }

    REOPEN_HISTORY {
        ObjectId _id PK
        ObjectId reopenedBy FK "points to User (_id)"
        Date reopenedAt
        string reason
        string previousOutcome
    }

    FOLLOW_UP {
        ObjectId _id PK
        ObjectId meeting FK "points to Meeting (_id)"
        string description
        ObjectId owner FK "points to User (_id)"
        ObjectId createdBy FK "points to User (_id)"
        Date dueDate
        string status "pending | completed"
        Date completedAt
        Date createdAt
        Date updatedAt
    }
```

---

## Collections & Modeling Details

### 1. `users` Collection
- Represents system accounts with role-based access.
- Role values: `employee`, `manager`, `admin`.
- Self-referencing `manager` field links an employee to their direct manager.
- Indexed on `email` (unique).

### 2. `customers` Collection
- Holds client accounts and points of contact.
- Indexed on `accountName` for sorted listings.

### 3. `meetings` Collection
- Core lifecycle document containing scheduled intervals, current status, and outcome.
- **Embedded Visits Subdocuments (`visits`):**
  - Allows multiple visit sessions per meeting (e.g. initial check-in, temporary checkout, return check-in, and final completion).
  - Preserves check-in and checkout timestamps, location coordinates, and reasons for temporary departure.
- **Embedded Reopen History (`reopenHistory`):**
  - Tracks manager reopen actions, recording the manager ID, timestamp, explanation, and previous outcome.
- Indexed on `{ assignedTo: 1, scheduledStart: 1 }`.

### 4. `followups` Collection
- Action items generated from meetings with outcome `follow_up_required`.
- References the originating meeting and the assigned owner.
- Indexed on `{ owner: 1, status: 1, dueDate: 1 }` for team and user workload queries.
