# TECHNICAL ANNEX: DEVIATIONS FROM ORIGINAL PLAN AND CURRENT STATE

**LAST UPDATED:** 2026-10-02
**OBJECTIVE:** To document in a structured format (Machine and Human-readable) the final state of the Architecture, Database, and Frontend after all phases, highlighting design modifications over the original Product Requirements Document (PRD). This document acts as the ultimate source of truth prioritized over legacy PRDs.

---

## 1. BACKEND ARCHITECTURE (CURRENT STATE)
- **Architectural Pattern:** Evolved from a classic MVC (Model-View-Controller) scheme to **Clean Architecture / Domain-Driven Design (DDD)**.
- **Implementation:** 
  - Explicit *UseCases* are utilized (e.g., `ManageFormConfigUseCase`, `SubmitFormUseCase`, `ReserveFormSpotUseCase`) to isolate core business logic.
  - **Dependency Injection (DI):** All controllers receive their use cases via constructor injection, and use cases receive their database repositories. This decouples Prisma from the controller layer.
- **Prisma ORM:** Stabilized on **Prisma v5** (avoiding experimental edge/v6 features). Dynamic model queries (e.g., `this.prismaClient[formIdentifier]`) are executed enforcing a strict key mapping rule (`lowerCamelCase`).

## 2. ROLE-BASED ACCESS CONTROL (RBAC)
### 2.1. Hierarchical Evolution
- **Original Plan:** System actors were limited to `ADMIN` and `ANALYST`.
- **Current Implementation (Deviation):** Introduced a strict three-tier hierarchy:
  - `SUPERADMIN`: Has universal bypass privileges. Can create users, assign form access permissions, and modify form configurations.
  - `ADMIN`: Cannot manage users, but can edit form configurations (`PATCH /api/forms/.../config`) and soft-delete submissions. Must be explicitly assigned form access.
  - `ANALYST`: Read-only access to submissions. Cannot edit configurations or soft-delete records. Must be explicitly assigned form access.
### 2.2. Pivot Table Authorization
- A new table `UserFormAccess` acts as a pivot linking a `UserId` to a specific `form_identifier`.
- Express Middleware (`auth.ts`) dynamically intercepts requests to `/api/forms/:form_identifier/*`, querying the pivot table to authorize or reject `ADMIN` and `ANALYST` requests globally before reaching controllers.

## 3. DATA MODEL MODIFICATIONS (`FormConfig`, Folios, and Reservations)
### 3.1. Separation of Visibility and Security
- **Original Plan:** A form was activated/deactivated or made public/private using a single boolean flag.
- **Current Implementation (Deviation):** 
  - `is_active` (Boolean): Defines if the form accepts or rejects incoming submissions (`POST`).
  - `is_listed` (Boolean): Defines if the form appears in the public directory on the main portal page (`/`).
  - `public_password` (String?): Handles password authentication. A form can be listed, active, and require a password simultaneously.

### 3.2. Capacity Management & Expiration (Reservations)
- Forms now support a `max_submissions` limit and a `reservation_window_minutes`.
- The system employs a state-machine for seats: `PENDING` (Reserved) and `COMPLETED`.
- A background chronjob/interval natively expires `PENDING` reservations after a `expires_at` threshold, returning the seat to the pool safely avoiding race conditions. 

### 3.3. Folio Generation System
- The system implements a dedicated `FolioGeneratorService` injecting unique IDs into `payload.folio` upon submission.
- **Strategies Supported:** `NONE`, `CONSECUTIVE` (e.g., 0001), `PREFIX_DATE_CONSECUTIVE` (e.g., EV-261002-0001), and `RANDOM_CHECKSUM` (e.g., A4F2B7).

### 3.4. Confirmation Modes
- **Original Plan:** Display a static success message upon submission.
- **Current Implementation (Deviation):** Introduced the `confirmation_mode` field (Enum) in the `FormConfig` table.
  - `SIMPLE`: Displays the default success message in a styled modal.
  - `CODE`: Injects a dynamically generated random confirmation ticket/code (`CONF-XXXXX`) into the success modal.
  - `TICKET`: Imperatively redirects the user to a secondary view (`/forms/[Form]/ticket`) designed exclusively for physical printing or saving to PDF, acting as an event pass or voucher.

## 4. ADMINISTRATIVE DATA VIEW (FRONTEND)
### 4.1. Universal Dynamic Table Architecture
- **Original Plan:** Render a hardcoded data table with specific columns strictly tied to the Event Registration form schema.
- **Current Implementation (Deviation):** Implemented a cross-domain dynamic algorithm (`FormSubmissionsView.tsx`).
  - At runtime, the system scans the JSON keys of the first payload response (`submissions[0]`).
  - It automatically generates the table headers (TableHead) regardless of which Prisma table the data comes from (excluding internal keys like `id`, `deleted_at`, `updated_at`).
  - **Design Outcome:** Immediate readiness for scalability. If a new form is deployed in the backend tomorrow, the administrative dashboard will natively render and export its data without requiring frontend code changes.

### 4.2. Date Formatting and Data Types
- Prisma `DateTime` strings (ISO format `YYYY-MM-DDTHH:mm:ss.sssZ`) are detected via Regex (`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/`).
- They are globally intercepted during the render loop (`formatValue`) and standardized to a human-readable `dd/MM/yyyy` format, ensuring UI consistency across the HTML table, Excel, and PDF exports.
- Booleans are transformed into styled visual badges (`Yes` / `No`).

### 4.3. Added Interface Features
1. **Client-Side Exports:** Lightweight client-side libraries (`xlsx`, `jspdf`, `jspdf-autotable`) export the *currently filtered state* directly from the browser's RAM to the user's local disk.
2. **Dual Search System:** Features an inclusive global search (`GlobalSearch`) paired with individualized column-header filters.
3. **Soft Bulk-Delete:** Added global checkboxes. Executes asynchronous bursts of logical deletions (`deleted_at`).
