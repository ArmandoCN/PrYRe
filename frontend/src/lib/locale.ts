/**
 * Utilidades globales de localización y fechas (es-MX).
 * REGLA OBLIGATORIA DEL PROYECTO: Todas las fechas deben utilizar el formato DD/MM/AA.
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Convierte un año de 2 dígitos (AA) a 4 dígitos (AAAA).
 * Regla de pivote: 00..40 -> 2000..2040, 41..99 -> 1941..1999.
 */
function expandTwoDigitYear(yy: number): number {
  if (yy >= 100) return yy;
  return yy <= 40 ? 2000 + yy : 1900 + yy;
}

/**
 * Parsea una cadena en formato DD/MM/AA, DD/MM/AAAA o ISO (YYYY-MM-DD...) a un objeto Date (12:00 UTC).
 * Retorna null si la fecha no es válida.
 */
export function parseDateToDateObj(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  const trimmed = String(input).trim();
  if (!trimmed) return null;

  // 1. Formato DD/MM/AA o DD/MM/AAAA (también acepta guiones DD-MM-AA)
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const rawYear = Number(dmyMatch[3]);
    const year = dmyMatch[3].length === 2 ? expandTwoDigitYear(rawYear) : rawYear;

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (
      dateObj.getUTCFullYear() !== year ||
      dateObj.getUTCMonth() !== month - 1 ||
      dateObj.getUTCDate() !== day
    ) {
      return null;
    }
    return dateObj;
  }

  // 2. Formato YYYY-MM-DD (sin hora)
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (
      dateObj.getUTCFullYear() !== year ||
      dateObj.getUTCMonth() !== month - 1 ||
      dateObj.getUTCDate() !== day
    ) {
      return null;
    }
    return dateObj;
  }

  // 3. Cadena ISO-8601 completa
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Valida si una cadena representa una fecha válida (preferentemente en formato DD/MM/AA).
 */
export function isValidDateDDMMYY(input: string | null | undefined): boolean {
  if (!input) return false;
  return parseDateToDateObj(input) !== null;
}

/**
 * Convierte una fecha (DD/MM/AA, DD/MM/AAAA o YYYY-MM-DD) a cadena ISO-8601 lista para Prisma.
 */
export function parseDateToISO(input: string | Date): string {
  const dateObj = parseDateToDateObj(input);
  if (!dateObj) {
    throw new Error(`Fecha inválida (${input}). Utiliza el formato DD/MM/AA.`);
  }
  return dateObj.toISOString();
}

/**
 * Aplica máscara interactiva DD/MM/AA mientras el usuario escribe dígitos.
 */
export function maskDateDDMMYY(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)}`;
}

/**
 * Convierte una cadena YYYY-MM-DD (de un picker nativo) a formato DD/MM/AA.
 */
export function ymdToDDMMYY(ymd: string): string {
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return ymd;
  const yy = match[1].slice(-2);
  return `${match[3]}/${match[2]}/${yy}`;
}

/**
 * Convierte una cadena DD/MM/AA a YYYY-MM-DD para sincronizar con el selector de calendario nativo.
 */
export function ddmmyyToYMD(dmy: string): string {
  const dateObj = parseDateToDateObj(dmy);
  if (!dateObj) return '';
  const yyyy = dateObj.getUTCFullYear();
  const mm = pad2(dateObj.getUTCMonth() + 1);
  const dd = pad2(dateObj.getUTCDate());
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formatea cualquier fecha al formato estricto DD/MM/AA (ej. 15/11/26).
 * Usa componentes UTC para fechas de calendario (T00:00:00Z o T12:00:00Z) evitando desfases de zona horaria.
 */
export function formatDateMX(dateInput: string | Date): string {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }

  const date = parseDateToDateObj(dateInput);
  if (!date) return String(dateInput);

  // Si proviene de una fecha ISO a medianoche o mediodía UTC, extraer día/mes/año en UTC
  const isCalendarUTC =
    typeof dateInput === 'string' &&
    (/T(00|12):00:00/.test(dateInput) || /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim()));

  const day = isCalendarUTC ? date.getUTCDate() : date.getDate();
  const month = isCalendarUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1;
  const year = isCalendarUTC ? date.getUTCFullYear() : date.getFullYear();

  return `${pad2(day)}/${pad2(month)}/${String(year).slice(-2)}`;
}

/**
 * Formatea fecha y hora usando siempre DD/MM/AA para la fecha (ej. 23/10/26, 04:15 p.m.).
 */
export function formatDateTimeMX(dateInput: string | Date): string {
  const date = parseDateToDateObj(dateInput);
  if (!date) return String(dateInput);

  const dd = pad2(date.getDate());
  const mm = pad2(date.getMonth() + 1);
  const yy = String(date.getFullYear()).slice(-2);

  const timeStr = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${dd}/${mm}/${yy}, ${timeStr}`;
}

export function formatCurrencyMX(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}
