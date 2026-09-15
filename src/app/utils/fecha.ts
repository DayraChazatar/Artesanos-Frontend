// src/app/utils/fecha.ts

// Fecha de HOY en la zona horaria del navegador (Colombia), como 'YYYY-MM-DD'.
//
// OJO: `new Date().toISOString().split('T')[0]` NO sirve para esto — convierte
// la fecha a UTC, y Colombia va 5 horas detrás. Después de las 7pm hora local,
// en UTC ya es "mañana", así que ese cálculo dejaba elegir un día que en
// Colombia todavía no ha llegado (ej: hoy 14, pero dejaba seleccionar el 15).
// Esta función arma la fecha a mano con año/mes/día LOCALES, sin pasar por UTC.
export function hoyLocal(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}
