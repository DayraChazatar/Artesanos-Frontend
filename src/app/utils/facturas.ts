interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  numero_guia?: string;
  transportadora?: string;
  fecha_envio?: string;
  fecha_entrega?: string;
  items: any[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

export function generarFacturaPDF(order: Order) {
  const nombreCliente = order.customer?.name?.trim()
    || `Pedido #${order.id.slice(-6).toUpperCase()}`;

  const fecha = new Date(order.date).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const itemsHTML = order.items.map((item: any) => `
    <tr>
      <td style="padding:12px 16px; border-bottom:1px solid #fde68a; color:#44403c;">${item.name}</td>
      <td style="padding:12px 16px; border-bottom:1px solid #fde68a; text-align:center; color:#44403c;">${item.quantity}</td>
      <td style="padding:12px 16px; border-bottom:1px solid #fde68a; text-align:right; color:#44403c;">$${Number(item.price).toLocaleString('es-CO')}</td>
      <td style="padding:12px 16px; border-bottom:1px solid #fde68a; text-align:right; font-weight:600; color:#92400e;">$${Number(item.price * item.quantity).toLocaleString('es-CO')}</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head>
        <title>Factura Pakari Shop — #${order.id.slice(-6)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fffbf5; color: #44403c; }
          .page { max-width: 720px; margin: 0 auto; background: white; box-shadow: 0 4px 32px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #92400e, #b45309, #d97706); padding: 36px 40px; display: flex; justify-content: space-between; align-items: center; }
          .header-left { color: white; }
          .logo-name { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .logo-sub { font-size: 11px; opacity: 0.8; margin-top: 2px; letter-spacing: 1px; text-transform: uppercase; }
          .header-right { text-align: right; color: white; }
          .factura-label { font-size: 11px; opacity: 0.75; text-transform: uppercase; letter-spacing: 1.5px; }
          .factura-num { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
          .status-band { background: #fef3c7; border-top: 3px solid #f59e0b; border-bottom: 3px solid #f59e0b; padding: 10px 40px; display: flex; align-items: center; gap: 10px; }
          .status-dot { width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; }
          .status-text { font-size: 13px; font-weight: 600; color: #92400e; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid #fde68a; }
          .info-block { padding: 24px 40px; }
          .info-block:first-child { border-right: 1px solid #fde68a; }
          .info-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #b45309; margin-bottom: 10px; }
          .info-row { display: flex; gap: 6px; margin-bottom: 5px; font-size: 13px; }
          .info-label { color: #a8a29e; font-weight: 500; min-width: 80px; flex-shrink: 0; }
          .info-value { color: #44403c; font-weight: 600; }
          .table-section { padding: 28px 40px; }
          .table-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #b45309; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: linear-gradient(90deg, #92400e, #b45309); }
          thead th { padding: 12px 16px; color: white; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          thead th:not(:first-child) { text-align: right; }
          thead th:nth-child(2) { text-align: center; }
          tbody tr:hover { background: #fffbf5; }
          .total-row { display: flex; justify-content: flex-end; margin-top: 16px; }
          .total-box { background: linear-gradient(135deg, #92400e, #d97706); color: white; padding: 14px 24px; border-radius: 12px; text-align: right; min-width: 200px; }
          .total-label { font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
          .total-amount { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-top: 2px; }
          .footer { background: #1c1917; color: #a8a29e; text-align: center; padding: 20px 40px; font-size: 11px; }
          .footer strong { color: #fcd34d; }
          @media print { body { background: white; } .page { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="header-left">
              <div class="logo-name">🏺 Pakari Shop</div>
              <div class="logo-sub">Artesanías colombianas hechas a mano</div>
            </div>
            <div class="header-right">
              <div class="factura-label">Factura de compra</div>
              <div class="factura-num">#${order.id.slice(-6).toUpperCase()}</div>
            </div>
          </div>
          <div class="status-band">
            <div class="status-dot"></div>
            <span class="status-text">Estado del pedido: ${order.status}</span>
            ${order.numero_guia ? `<span style="margin-left:auto; font-size:12px; color:#92400e;">📦 Guía: <strong>${order.numero_guia}</strong></span>` : ''}
          </div>
          <div class="info-section">
            <div class="info-block">
              <div class="info-title">📋 Datos del pedido</div>
              <div class="info-row"><span class="info-label">Fecha</span><span class="info-value">${fecha}</span></div>
              <div class="info-row"><span class="info-label">Pedido</span><span class="info-value">#${order.id.slice(-6).toUpperCase()}</span></div>
              ${order.transportadora ? `<div class="info-row"><span class="info-label">Transporte</span><span class="info-value">${order.transportadora}</span></div>` : ''}
              ${order.fecha_envio ? `<div class="info-row"><span class="info-label">Enviado</span><span class="info-value">${new Date(order.fecha_envio).toLocaleDateString('es-CO')}</span></div>` : ''}
              ${order.fecha_entrega ? `<div class="info-row"><span class="info-label">Entregado</span><span class="info-value">${new Date(order.fecha_entrega).toLocaleDateString('es-CO')}</span></div>` : ''}
            </div>
            <div class="info-block">
              <div class="info-title">👤 Datos del cliente</div>
              <div class="info-row"><span class="info-label">Nombre</span><span class="info-value">${nombreCliente}</span></div>
              ${order.customer.email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value">${order.customer.email}</span></div>` : ''}
              ${order.customer.phone ? `<div class="info-row"><span class="info-label">Teléfono</span><span class="info-value">${order.customer.phone}</span></div>` : ''}
            </div>
          </div>
          <div class="table-section">
            <div class="table-title">🛍️ Productos adquiridos</div>
            <table>
              <thead>
                <tr>
                  <th style="text-align:left;">Producto</th>
                  <th>Cant.</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>
            <div class="total-row">
              <div class="total-box">
                <div class="total-label">Total a pagar</div>
                <div class="total-amount">$${Number(order.total).toLocaleString('es-CO')}</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <strong>Pakari Shop</strong> — Artesanías colombianas hechas a mano con amor 🤍 &nbsp;|&nbsp; soporte@pakari.com
          </div>
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
    </html>
  `;

  const ventana = window.open('', '_blank');
  if (!ventana) throw new Error('No se pudo abrir la ventana. Permite las ventanas emergentes.');
  ventana.document.write(html);
  ventana.document.close();
}