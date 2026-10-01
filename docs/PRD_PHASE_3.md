# SYSTEM_CONTEXT: PRD_PHASE_3 (ARCHITECTURE & API CONTRACTS)

## 1. ARCHITECTURAL_PATTERN (MANDATORY)
To ensure seamless future migration to AWS Serverless components, the backend MUST implement a modular **Clean Architecture** approach.
* The Agent MUST NOT call Prisma directly from Express Controllers.
* The Agent MUST abstract database calls behind a Repository interface.
* The Agent MUST abstract business logic into Use Case (Service) classes/functions.

## 2. DIRECTORY_SCAFFOLDING

The AI Agent MUST adhere to the following directory structure:

### Backend (Node.js)
```text
backend/
├── src/
│   ├── domain/           # Core types, entities, and repository interfaces
│   ├── application/      # Business logic and Use Cases (e.g., AuthServices)
│   ├── infrastructure/   # External dependencies implementation
│   │   ├── http/         # Express setup, Routes, Middlewares, Controllers
│   │   ├── database/     # Prisma Client initialization and Repository implementations
│   │   └── security/     # JWT, TOTP (RFC6238), password hashing tools
│   └── shared/           # Cross-cutting concerns (Zod schemas, Logger, Custom Errors)

### Frontend (Vue 3)

frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── views/            # Main route views/pages
│   ├── services/         # Axios/Fetch API wrappers
│   ├── store/            # State management (Pinia)
│   ├── router/           # Vue Router configuration & Navigation Guards
│   └── utils/            # Image processors (resize/crop), Zod validation schemas

### API_CONTRACT_STANDARD
##Success Response (HTTP 200/201):
{
  "success": true,
  "data": { "key": "value" } 
}
##Error Response (HTTP 400/401/403/404/500):
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR", // standard string codes
    "message": "Human readable description",
    "details": [] // optional array for Zod field errors
  }
}



### BOUNDARY_AND_SECURITY_RULES
Validation: The Agent MUST implement dual validation. Zod schemas MUST be defined in a shared/common space (if using Monorepo) or duplicated logically. Every Express route MUST pass through a validation middleware before reaching the controller.

Asset Upload Flow: Frontend MUST compress/crop images before sending. Backend MUST re-verify MIME type and file size. Files MUST be renamed to UUIDs.

State Management: JWT Tokens MUST NOT be stored in localStorage. The Agent MUST configure HTTP-only, secure cookies for session management to prevent XSS attacks.


