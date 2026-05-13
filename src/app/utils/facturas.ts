interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: any[];
  customer: { name: string; email: string; phone?: string };
}

export function generarFacturaPDF(order: Order) {
  if (!order.customer?.name || !order.customer?.email) {
    throw new Error('La factura no tiene información del cliente');
  }

  const fecha = new Date(order.date).toLocaleDateString('es-CO');

  const itemsHTML = order.items
    .map(
      (item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align:center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align:right;">$${(item.price).toLocaleString('es-CO')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align:right;">$${(item.price * item.quantity).toLocaleString('es-CO')}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <html>
      <head>
        <title>Factura #${order.id.slice(-6)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #ea580c; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #ea580c; color: white; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: #ea580c; text-align: right; margin-top: 16px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 4px 0; }
        </style>
      </head>
      <body>
        <h1>🧾 Factura de Compra</h1>
        <div class="info">
          <p><strong>Pedido:</strong> #${order.id.slice(-6)}</p>
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Estado:</strong> ${order.status}</p>
          <p><strong>Cliente:</strong> ${order.customer.name}</p>
          <p><strong>Email:</strong> ${order.customer.email}</p>
          ${order.customer.phone ? `<p><strong>Teléfono:</strong> ${order.customer.phone}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align:center;">Cant.</th>
              <th style="text-align:right;">Precio Unit.</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <p class="total">Total: $${order.total.toLocaleString('es-CO')}</p>
        <script>window.onload = () => { window.print(); }</script>
      </body>
    </html>
  `;

  const ventana = window.open('', '_blank');
  if (!ventana) {
    throw new Error('No se pudo abrir la ventana. Permite las ventanas emergentes.');
  }
  ventana.document.write(html);
  ventana.document.close();
}