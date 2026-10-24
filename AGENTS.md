# Reglas Globales del Proyecto (PrYRe - Sistema de Registros)

## 1. Formato Estándar de Fechas (`DD/MM/AA`) — OBLIGATORIO
- **Siempre que se utilicen, capturen, muestren, exporten o documenten fechas (incluyendo tablas de datos de prueba, vistas, etiquetas y controles de formulario), DEBEN estar en formato `DD/MM/AA`** (2 dígitos para día, 2 dígitos para mes, 2 dígitos para año; ejemplo: `15/11/26` o `14/05/17`).
- **Visualización (`frontend/src/lib/locale.ts`):**
  - `formatDateMX(dateInput)` siempre formatea en `DD/MM/AA` (ej. `23/10/26`) evitando desfases de zona horaria UTC.
  - `formatDateTimeMX(dateInput)` siempre formatea la parte de fecha en `DD/MM/AA` seguida de la hora (ej. `23/10/26, 04:15 p.m.`).
- **Captura en Formularios (`DateInputDDMMYY` y `parseDateToISO`):**
  - Todos los campos de fecha en formularios (`ActivityParticipantForm`, `EventRegistrationForm`, `PrepaProspectForm` y futuros formularios) deben permitir capturar y visualizar la fecha directamente en formato **`DD/MM/AA`** (con máscara automática `DD/MM/AA` y selector de calendario auxiliar que convierte al formato `DD/MM/AA`).
  - Antes de enviar al backend (Prisma `DateTime`), convertir la cadena `DD/MM/AA` a ISO-8601 mediante `parseDateToISO(value)` (`YYYY-MM-DDT12:00:00.000Z`) para evitar desfases de día por zona horaria.

## 2. Compatibilidad de Controles UI
- Evitar portales flotantes de Radix (`<Select>`) en formularios; utilizar elementos nativos `<select>` y `<textarea>` estilizados con Tailwind CSS para máxima compatibilidad con Safari 11+ y traductores del navegador.
