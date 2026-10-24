import * as React from 'react';
import { cn } from '@/lib/utils';
import { ddmmyyToYMD, formatDateMX, maskDateDDMMYY, ymdToDDMMYY } from '@/lib/locale';

export interface DateInputDDMMYYProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Componente estándar de captura de fecha en formato estricto DD/MM/AA.
 * Permite escribir directamente con máscara automática (DD/MM/AA) o elegir del calendario.
 */
export const DateInputDDMMYY = React.forwardRef<HTMLInputElement, DateInputDDMMYYProps>(
  ({ className, value = '', onChange, disabled, placeholder = 'DD/MM/AA', onBlur, ...props }, ref) => {
    const pickerRef = React.useRef<HTMLInputElement | null>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Si el usuario pega una fecha en formato YYYY-MM-DD o DD/MM/AAAA, convertirla a DD/MM/AA
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
        onChange?.(ymdToDDMMYY(raw.trim()));
        return;
      }
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(raw.trim())) {
        onChange?.(formatDateMX(raw.trim()));
        return;
      }

      const masked = maskDateDDMMYY(raw);
      onChange?.(masked);
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const ymd = e.target.value;
      if (ymd) {
        onChange?.(ymdToDDMMYY(ymd));
      }
    };

    const openNativePicker = () => {
      if (disabled || !pickerRef.current) return;
      try {
        if (typeof (pickerRef.current as any).showPicker === 'function') {
          (pickerRef.current as any).showPicker();
        } else {
          pickerRef.current.focus();
          pickerRef.current.click();
        }
      } catch {
        pickerRef.current.focus();
      }
    };

    const syncedYMD = value && value.length >= 8 ? ddmmyyToYMD(value) : '';

    return (
      <div className="relative flex items-center w-full">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleTextChange}
          onBlur={onBlur}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background pl-3 pr-8 py-1.5 text-sm font-mono ring-offset-background placeholder:text-muted-foreground placeholder:font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          value={syncedYMD}
          onChange={handlePickerChange}
          className="sr-only"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={openNativePicker}
          title="Seleccionar en calendario (DD/MM/AA)"
          className="absolute right-2 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
    );
  }
);

DateInputDDMMYY.displayName = 'DateInputDDMMYY';
