# SYSTEM_CONTEXT: PRD_PHASE_1

## 1. SYSTEM_DOMAIN
* **Core_Objective:** Centralized engine for data capture, processing, and dynamic visualization.
* **Input_Mechanism:** Static, code-defined forms (toggled active/inactive via database boolean flags).
* **Output_Mechanism:** Configurable dynamic data views (tables) and statistics.
* **Security_Baseline:** Strict Role-Based Access Control (RBAC) and optional password protection for exposed public assets.

## 2. ARCHITECTURE_CONSTRAINTS
* **Current_State:** Backend: Node.js (Express) + PostgreSQL (Prisma). Frontend: Vue 3 SPA. Infrastructure: Docker containers on Debian VPS (Hetzner) with Cloudflare.
* **Future_State:** AWS Serverless (Lambda, API Gateway, S3, DynamoDB, CloudFront).
* **DESIGN_MANDATE (CRITICAL):** The codebase MUST implement Clean Architecture principles (e.g., Repository Pattern). Business logic MUST be completely decoupled from HTTP controllers (Express) and the DB ORM (Prisma). This is strictly required to ensure seamless future migration to AWS Serverless without rewriting the core domain.

## 3. RBAC_MATRIX (PERMISSIONS)

System actors are strictly limited to the following enumeration: `ADMIN`, `ANALYST`, `GUEST`.
The agent MUST enforce these permissions at the API route and controller levels.

| Resource / Action | `ADMIN` | `ANALYST` | `GUEST` (Unauthenticated) |
| :--- | :--- | :--- | :--- |
| **Authentication** | REQUIRED (Password + TOTP 2FA RFC6238) | REQUIRED (Password) | NONE |
| **Submit Forms** | ALLOW (All) | ALLOW (All) | ALLOW (Only active && is_public == true) |
| **Read Raw Data** | ALLOW (All) | ALLOW (All) | DENY |
| **Read Views/Stats** | ALLOW (All) | ALLOW (All) | ALLOW (Only active && is_public == true. May require `public_password`) |
| **Update Data** | ALLOW | DENY | DENY |
| **Delete Data** | ALLOW (Granular: field-level, row-level, bulk) | DENY (Strict rule) | DENY |
| **System Config** | ALLOW (Toggle forms, create/manage views) | DENY | DENY |