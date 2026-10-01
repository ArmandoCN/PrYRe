# TECHNICAL ANNEX: DEVIATIONS FROM ORIGINAL PLAN AND CURRENT STATE

**LAST UPDATED:** 2026-09-30
**OBJECTIVE:** To document in a structured format (Machine and Human-readable) the final state of the Architecture, Database, and Frontend after implementing Phases 3 and 4, highlighting design modifications over the original Product Requirements Document (PRD).

---

## 1. BACKEND ARCHITECTURE (CURRENT STATE)
- **Architectural Pattern:** Evolved from a classic MVC (Model-View-Controller) scheme to **Clean Architecture / Domain-Driven Design (DDD)**.
- **Implementation:** 
  - Explicit *UseCases* are utilized (e.g., `ManageFormConfigUseCase`, `SubmitFormUseCase`) to isolate core business logic.
  - **Dependency Injection (DI):** All controllers receive their use cases via constructor injection, and use cases receive their database repositories. This decouples Prisma from the controller layer.
- **Prisma ORM:** Stabilized on **Prisma v5** (avoiding experimental edge/v6 features). Dynamic model queries (e.g., `this.prismaClient[formIdentifier]`) are executed enforcing a strict key mapping rule (`lowerCamelCase`).

## 2. DATA MODEL MODIFICATIONS (`FormConfig`)
### 2.1. Separation of Visibility and Security
- **Original Plan:** A form was activated/deactivated or made public/private using a single boolean flag.
- **Current Implementation (Deviation):** 
  - `is_active` (Boolean): Defines if the form accepts or rejects incoming submissions (`POST`).
  - `is_listed` (Boolean): Defines if the form appears in the public directory on the main portal page (`/`).
  - `public_password` (String?): Handles password authentication. A form can be listed, active, and require a password simultaneously; or it can be "secret" (unlisted) but active for direct links.

### 2.2. Confirmation Modes
- **Original Plan:** Display a static success message upon submission.
- **Current Implementation (Deviation):** Introduced the `confirmation_mode` field (Enum) in the `FormConfig` table.
  - `SIMPLE`: Displays the default success message in a styled modal.
  - `CODE`: Injects a dynamically generated random confirmation ticket/code (`CONF-XXXXX`) into the success modal.
  - `TICKET`: Imperatively redirects the user to a secondary view (`/forms/[Form]/ticket`) designed exclusively for physical printing or saving to PDF, acting as an event pass or voucher.

## 3. ADMINISTRATIVE DATA VIEW (FRONTEND)
### 3.1. Universal Dynamic Table Architecture
- **Original Plan:** Render a hardcoded data table with specific columns strictly tied to the Event Registration form schema.
- **Current Implementation (Deviation):** Implemented a cross-domain dynamic algorithm (`FormSubmissionsView.tsx`).
  - At runtime, the system scans the JSON keys of the first payload response (`submissions[0]`).
  - It automatically generates the table headers (TableHead) regardless of which Prisma table the data comes from (excluding internal keys like `id`, `deleted_at`, `updated_at`).
  - **Design Outcome:** Immediate readiness for scalability. If a new form is deployed in the backend tomorrow, the administrative dashboard will natively render and export its data without requiring frontend code changes.

### 3.2. Date Formatting and Data Types
- Prisma `DateTime` strings (ISO format `YYYY-MM-DDTHH:mm:ss.sssZ`) are detected via Regex (`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/`).
- They are globally intercepted during the render loop (`formatValue`) and standardized to a human-readable `dd/MM/yyyy` format, ensuring UI consistency across the HTML table, Excel, and PDF exports.
- Booleans are transformed into styled visual badges (`Yes` / `No`).

### 3.3. Added Interface Features
1. **Client-Side Exports:** Instead of round-tripping to the server, lightweight client-side libraries (`xlsx`, `jspdf`, `jspdf-autotable`) export the *currently filtered state* directly from the browser's RAM to the user's local disk.
2. **Dual Search System:** Features an inclusive global search (`GlobalSearch`) paired with individualized column-header filters (Toggleable via a dedicated UI switch to avoid visual clutter).
3. **Soft Bulk-Delete:** Added global checkboxes. Executes asynchronous bursts of logical deletions (`deleted_at`) mapped over selected identifiers to maintain data protection policies.

---
**STATUS:** Phase 3 and 4 (Core Administrative and Registration Development) DECLARED COMPLETE AND FULLY FUNCTIONAL END-TO-END.
