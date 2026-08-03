export function generarGuiaEnvio(pedido: any) {
  const fecha = new Date(pedido.fecha).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const transportadora = pedido.transportadora || 'Coordinadora';
  const numeroGuia = pedido.numero_guia || `PKR-PED-${String(pedido.id).padStart(5,'0')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;

  const productosHTML = pedido.detalles?.map((d: any) => `
    <tr>
      <td style="padding:12px 16px; border-bottom:1px solid #fde68a; color:#44403c;">${d.producto_nombre}</td>
      <td style="padding:12px 16px; border-bottom:1px solid #fde68a; text-align:center; font-weight:600; color:#92400e;">${d.cantidad}</td>
      <td style="padding:12px 16px; border-bottom:1px solid #fde68a; text-align:right; color:#44403c;">$${Number(d.precio ?? d.subtotal ?? 0).toLocaleString('es-CO')}</td>
      <td style="padding:12px 16px; border-bottom:1px solid #fde68a; text-align:right; font-weight:600; color:#92400e;">$${Number(d.subtotal ?? 0).toLocaleString('es-CO')}</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head>
        <title>Guía ${numeroGuia}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Segoe UI', Arial, sans-serif; background:#fffbf5; color:#44403c; }
          .page { max-width:780px; margin:0 auto; background:white; box-shadow:0 4px 32px rgba(0,0,0,0.10); }

          /* HEADER */
          .header { background:linear-gradient(135deg, #92400e, #b45309, #d97706); padding:32px 40px; display:flex; justify-content:space-between; align-items:center; }
          .header-left { color:white; }
          .transportadora { font-size:28px; font-weight:800; letter-spacing:-0.5px; }
          .transportadora-sub { font-size:11px; opacity:0.8; margin-top:3px; letter-spacing:1px; text-transform:uppercase; }
          .header-right { text-align:right; color:white; }
          .guia-label { font-size:11px; opacity:0.75; text-transform:uppercase; letter-spacing:1.5px; }
          .guia-num { font-size:22px; font-weight:800; letter-spacing:-0.5px; margin-top:4px; }

          /* ESTADO BAND */
          .status-band { background:#fef3c7; border-top:3px solid #f59e0b; border-bottom:3px solid #f59e0b; padding:10px 40px; display:flex; align-items:center; gap:10px; }
          .status-dot { width:10px; height:10px; border-radius:50%; background:#f59e0b; flex-shrink:0; }
          .status-text { font-size:13px; font-weight:600; color:#92400e; }

          /* REMITENTE / DESTINATARIO */
          .addresses { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid #fde68a; }
          .address-block { padding:24px 40px; }
          .address-block:first-child { border-right:1px solid #fde68a; }
          .block-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#b45309; margin-bottom:10px; }
          .block-name { font-size:16px; font-weight:700; color:#1c1917; margin-bottom:4px; }
          .block-detail { font-size:13px; color:#78716c; line-height:1.7; }

          /* INFO ENVÍO */
          .shipping-info { padding:20px 40px; background:#fffbf5; border-bottom:1px solid #fde68a; display:flex; gap:32px; flex-wrap:wrap; }
          .info-item { display:flex; flex-direction:column; gap:2px; }
          .info-item-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#b45309; }
          .info-item-value { font-size:13px; font-weight:600; color:#44403c; }

          /* TABLA */
          .table-section { padding:28px 40px; }
          .table-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#b45309; margin-bottom:12px; }
          table { width:100%; border-collapse:collapse; }
          thead tr { background:linear-gradient(90deg, #92400e, #b45309); }
          thead th { padding:12px 16px; color:white; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; text-align:left; }
          thead th:not(:first-child) { text-align:right; }
          thead th:nth-child(2) { text-align:center; }
          tbody tr:hover { background:#fffbf5; }

          /* TOTAL */
          .total-row { display:flex; justify-content:flex-end; margin-top:16px; }
          .total-box { background:linear-gradient(135deg, #92400e, #d97706); color:white; padding:14px 24px; border-radius:12px; text-align:right; min-width:200px; }
          .total-label { font-size:11px; opacity:0.8; text-transform:uppercase; letter-spacing:1px; }
          .total-amount { font-size:24px; font-weight:800; letter-spacing:-0.5px; margin-top:2px; }

          /* FOOTER */
          .footer { background:#1c1917; color:#a8a29e; text-align:center; padding:20px 40px; font-size:11px; }
          .footer strong { color:#fcd34d; }

          @media print { body { background:white; } .page { box-shadow:none; } }
        </style>
      </head>
      <body>
        <div class="page">

          <!-- HEADER -->
          <div class="header">
            <div class="header-left">
              <div class="transportadora">${transportadora}</div>
              <div class="transportadora-sub">Guía logística de envío</div>
            </div>
            <div class="header-right">
              <div class="guia-label">Número de guía</div>
              <div class="guia-num">${numeroGuia}</div>
            </div>
          </div>

          <!-- ESTADO -->
          <div class="status-band">
            <div class="status-dot"></div>
            <span class="status-text">Estado: ${pedido.estado}</span>
            <span style="margin-left:auto; font-size:12px; color:#92400e;">📅 ${fecha}</span>
          </div>

          <!-- REMITENTE / DESTINATARIO -->
          <div class="addresses">
            <div class="address-block">
              <div class="block-title">📦 Remitente</div>
              <div class="block-name">PAKARI SHOP</div>
              <div class="block-detail">
                Artesanías Colombianas hechas a mano<br/>
                soporte@pakari.com
              </div>
            </div>
            <div class="address-block">
              <div class="block-title">🏠 Destinatario</div>
              <div class="block-name">${pedido.cliente_nombre}</div>
              <div class="block-detail">
                ${pedido.telefono ? `📞 ${pedido.telefono}<br/>` : ''}
                ${pedido.direccion ? `📍 ${pedido.direccion}` : ''}
              </div>
            </div>
          </div>

          <!-- INFO ENVÍO -->
          <div class="shipping-info">
            <div class="info-item">
              <span class="info-item-label">Pedido</span>
              <span class="info-item-value">#${pedido.codigo ?? pedido.id}</span>
            </div>
            <div class="info-item">
              <span class="info-item-label">Transportadora</span>
              <span class="info-item-value">${transportadora}</span>
            </div>
            <div class="info-item">
              <span class="info-item-label">Fecha</span>
              <span class="info-item-value">${fecha}</span>
            </div>
            ${pedido.fecha_envio ? `
            <div class="info-item">
              <span class="info-item-label">Fecha envío</span>
              <span class="info-item-value">${new Date(pedido.fecha_envio).toLocaleDateString('es-CO')}</span>
            </div>` : ''}
          </div>

          <!-- TABLA PRODUCTOS -->
          <div class="table-section">
            <div class="table-title">🛍️ Productos</div>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align:center;">Cant.</th>
                  <th style="text-align:right;">Precio Unit.</th>
                  <th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${productosHTML}</tbody>
            </table>
            <div class="total-row">
              <div class="total-box">
                <div class="total-label">Total del pedido</div>
                <div class="total-amount">$${Number(pedido.total).toLocaleString('es-CO')}</div>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <strong>Pakari Shop</strong> — Artesanías colombianas hechas a mano con amor 🤍 &nbsp;|&nbsp; soporte@pakari.com
          </div>

        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
    </html>
  `;

  const ventana = window.open('', '_blank');
  if (!ventana) { alert('Debes permitir ventanas emergentes'); return; }
  ventana.document.write(html);
  ventana.document.close();
}