# SYSTEM_CONTEXT: PRD_PHASE_2 (DATA MODEL & STATE)

## 1. PERSISTENCE_DIRECTIVES
* **Database_Engine:** PostgreSQL.
* **ORM:** Prisma (MUST be isolated within the Infrastructure layer per Clean Architecture mandates from Phase 1).
* **Deletion_Rule (CRITICAL):** Hard deletions (SQL `DELETE`) are STRICTLY FORBIDDEN for business records. All data records MUST implement **Soft Deletes** (`deleted_at` DateTime? nullable field). This allows the `ADMIN` role to execute granular deletions (field-level or row-level) without violating referential integrity.
* **Asset_Storage_Rule:** The database MUST NOT store physical host paths or absolute URLs for files. The `Asset` table will store a UUID (which acts as the physical filename in the Docker Volume or S3). Base paths MUST be injected via environment variables (`ENV`).

## 2. CORE_ENTITIES (Data Schema Requirements)

The AI Agent MUST implement the following entity structures:

**A. User**
*   **Purpose:** Access control and authentication.
*   **Fields:** `id` (UUID, PK), `email` (Unique, String), `password_hash` (String), `totp_secret` (String, nullable until 2FA setup), `role` (Enum: `ADMIN`, `ANALYST`), `created_at`, `updated_at`.

**B. FormConfig**
*   **Purpose:** State management for code-defined, static forms.
*   **Fields:** `id` (UUID, PK), `form_identifier` (String, Unique index - maps directly to frontend/backend static code), `is_active` (Boolean, default false), `public_password` (String, nullable).

**C. Static Form Submissions (Pattern)**
*   **Purpose:** Individual tables for each specific code-defined form (e.g., `PersonalRecord`, `ActivityRecord`).
*   **Mandatory_Fields:** Every submission table MUST inherit or implement: `id` (UUID, PK), `created_at`, `updated_at`, and `deleted_at` (DateTime?).
*   **Constraint:** Non-critical data fields MUST be nullable to allow `ADMIN` granular field clearing.

**D. Asset**
*   **Purpose:** Secure file tracking.
*   **Fields:** `id` (UUID, PK - matches the physical filename in storage), `original_name` (String), `mime_type` (String), `size_bytes` (Int), `uploaded_by` (FK to User, nullable for GUEST uploads), `created_at`.

**E. CustomView**
*   **Purpose:** Configuration storage for dynamic Admin-defined tables and charts.
*   **Fields:** `id` (UUID, PK), `name` (String), `type` (Enum: `TABLE`, `CHART`), `configuration` (JSONB - stores selected columns, filters, and rendering rules), `is_public` (Boolean, default false), `public_password` (String, nullable).