# SYSTEM DEVELOPER GUIDE & API SPECIFICATION

**OBJECTIVE:** This document provides a comprehensive API reference and an LLM-ready blueprint to construct new forms and frontend components seamlessly without requiring prior conversational context.

## 1. REST API ENDPOINTS

**Authentication & Meta:**
- `POST /api/auth/login`: Authenticates an ADMIN/ANALYST/SUPERADMIN. Returns an HTTP-Only JWT cookie.
- `GET /api/public-forms`: Returns a lightweight list of active and listed forms (`id`, `form_identifier`). No auth required.

**Users & Roles (RBAC):**
- `GET /api/users`: Returns all users. Requires SUPERADMIN.
- `POST /api/users`: Creates a new user with temporary password. Requires SUPERADMIN.
- `PATCH /api/users/:id/password`: Changes a user's password. Requires SUPERADMIN.
- `POST /api/users/:id/access`: Sets the list of form identifiers a user can access. Requires SUPERADMIN.

**Form Configuration:**
- `GET /api/forms/:form_identifier/config`: Retrieves public config (`is_active`, `requires_password`, `confirmation_mode`).
- `GET /api/forms`: Lists all configs. Requires Auth. (Filters dynamically based on UserFormAccess for non-SUPERADMINs).
- `PATCH /api/forms/:form_identifier/config`: Updates config settings. Requires SUPERADMIN or ADMIN.

**Data Submissions:**
- `POST /api/forms/:form_identifier/reserve`: Claims a temporary reservation spot using a client-side UUID token.
- `POST /api/forms/:form_identifier/submissions`: Accepts payload. Validation requires `data.payload`, `data.public_password` (if protected), and `reservation_token` (if limited capacity).
- `GET /api/forms/:form_identifier/submissions`: Retrieves all submissions (excluding soft-deleted). Requires Auth (SUPERADMIN, ADMIN, or ANALYST with explicit access).
- `DELETE /api/forms/:form_identifier/submissions/:submission_id`: Performs a soft delete (`deleted_at = NOW()`). Requires SUPERADMIN or ADMIN.

## 2. FRONTEND STACK & STYLING
- **Framework:** React + Vite (TypeScript) + React Router v6.
- **Styling:** TailwindCSS with a deep integration of **Shadcn UI** components.
- **Form Management:** `react-hook-form` coupled with `@hookform/resolvers/zod`.
- **Icons:** We exclusively use raw SVG paths inline, styled with tailwind classes (e.g. `w-4 h-4`).

---

## 3. BLUEPRINT: HOW TO BUILD A NEW FORM (LLM INSTRUCTION)

If you (the LLM) are tasked with creating a new form (e.g., `JobApplication`), strictly follow these 4 steps:

### STEP 1: Backend Database Schema (`prisma/schema.prisma`)
Add a new model for the form.
1. It MUST have these 4 base fields: `id` (String UUID), `created_at` (DateTime), `updated_at` (DateTime), `deleted_at` (DateTime?).
2. Name the model in PascalCase (e.g., `model JobApplication`).
3. Add the business fields.
4. Run `npx prisma generate && npx prisma db push`.

### STEP 2: Zod Validation Schema (Frontend)
Create a validation file `src/lib/validations/jobApplication.ts`.
- Form inputs mapped to Prisma `DateTime` MUST be declared as `z.string().min(1)` in the frontend. (HTML `<input type="date">` produces strings).
- Enum fields in Prisma MUST be mapped using `z.enum([...])`.

### STEP 3: Frontend Component Layout (`src/pages/JobApplicationForm.tsx`)
1. **Config Hook:** Always fetch `/api/forms/JobApplication/config` on mount to set `isActive`, `requiresPassword`, and `confirmationMode` states. If `isActive` is false, render a "Closed" message.
2. **Form Render:** Use Shadcn UI `<Form>` wrappers. Render `<FormField>` for every input.
3. **Password Wall:** If `requiresPassword` is true, render a password lock screen *before* revealing the main form.
4. **Data Transformation (CRITICAL):** In your `onSubmit(data)` handler, before sending to Axios:
   - You MUST transform all date strings to ISO-8601 strictly. Example: `birthdate: new Date(data.birthdate).toISOString()`. Prisma will crash otherwise.
   - You MUST wrap the payload in this structure: `{ payload: { ...transformedData }, public_password: passwordInput }`.
5. **Success Handling:** Map behavior to `confirmationMode`:
   - `TICKET`: Redirect to `/forms/JobApplication/ticket?code=XYZ` (The ticket view is universal or you can build a custom one).
   - `CODE`: Render a success UI with a generated confirmation code.
   - `SIMPLE`: Render a standard success UI.

### STEP 4: Routing (`src/App.tsx`)
Add the route mapping the identifier to the component: `<Route path="/forms/JobApplication" element={<JobApplicationForm />} />`.

**NOTE ON DATA VIEWER:** You DO NOT need to build a data viewer or admin panel for your new form. The `FormSubmissionsView.tsx` component is dynamically universal. As long as you followed the naming conventions, navigating to `/admin/forms/JobApplication/data` will automatically render a fully functional table, export engine (PDF/XLSX), and bulk-delete system for your new form.

### STEP 1.5: Register the Form in the Database
You MUST insert a base record into the `FormConfig` table for the new form so the Admin Panel can control it.
Update `backend/seed.js` (or run a direct query) to create it:
```javascript
await prisma.formConfig.upsert({
  where: { form_identifier: 'JobApplication' },
  update: {},
  create: { form_identifier: 'JobApplication', is_active: true, is_listed: true },
});
```
