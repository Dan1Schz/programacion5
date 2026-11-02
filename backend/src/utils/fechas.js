import { HttpError } from './http-error.js';

// Devuelve 'YYYY-MM-DD' a partir de un Date (zona local), un texto o null.
export function toDateString(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value.trim().slice(0, 10);

  const pad = (number) => String(number).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

// La fecha final no puede ser anterior a la inicial (se comparan solo los días).
export function assertDateOrder(startDate, endDate) {
  const start = toDateString(startDate);
  const end = toDateString(endDate);

  if (start && end && end < start) {
    throw new HttpError(
      422,
      'VALIDATION_ERROR',
      "La 'fechaFinProyecto' no puede ser anterior a la 'fechaInicioProyecto'.",
    );
  }
}
