# SYSTEM_CONTEXT: PRD_PHASE_4 (TEST-DRIVEN DEVELOPMENT EXECUTION)

## 1. TDD_MANDATE (STRICT RULE)
The Agent MUST NOT write production business logic or HTTP controllers without first writing and running automated tests.
The Agent MUST follow the Red-Green-Refactor cycle:
1. **Red:** Write the unit/integration test based on the PRD requirements. Run the test to confirm it fails.
2. **Green:** Write the isolated business logic (Use Cases) or Controller to pass the test.
3. **Refactor:** Ensure the code strictly adheres to the Clean Architecture boundaries defined in `PRD_PHASE_3.md`.

## 2. TESTING_STACK
* **Backend:** Use `Vitest` (preferred for speed) or `Jest` for Domain/Application logic. Use `Supertest` for HTTP boundary testing (Express routes).
* **Frontend:** Use `Vitest` and `@vue/test-utils`.

## 3. IMPLEMENTATION_WORKFLOW
When tasked with a feature, the Agent MUST execute the steps in this specific order to preserve architecture:
1. **Domain Layer:** Define the entities, Zod validation schemas, and Repository interfaces. (Test: Schema validation).
2. **Application Layer:** Implement the Use Case class/function (e.g., `AuthenticateUserUseCase`). (Test: Business logic with mocked Repository).
3. **Infrastructure Layer (HTTP):** Implement the Express Controller and inject the Use Case. (Test: E2E endpoint test via Supertest).
4. **Infrastructure Layer (DB):** Implement the Prisma Repository mapping.

## 4. QUALITY_GATES
Before concluding a task and waiting for human review, the Agent MUST:
* Run the test suite and ensure 100% pass rate for the touched module.
* Run a linter (e.g., ESLint) and automatically fix stylistic errors.
* Provide a brief terminal summary of the tests passed.