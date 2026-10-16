/**
 * Escapa un valor para insertarlo como TEXTO dentro de HTML.
 *
 * El recibo y la guía de envío se construyen como una cadena de HTML y se escriben
 * en una ventana nueva del mismo origen que la aplicación. Cualquier dato que venga
 * de un usuario (nombre del producto, nombre, teléfono o dirección del cliente,
 * número de guía) debe pasar por aquí; de lo contrario, un valor como
 * `<img src=x onerror=...>` se ejecutaría con el acceso de la sesión de quien abre
 * el documento.
 */
export function esc(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
