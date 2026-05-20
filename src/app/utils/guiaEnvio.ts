export function generarGuiaEnvio(pedido: any) {
  const fecha = new Date(pedido.fecha).toLocaleDateString('es-CO');

  const transportadora =
    pedido.transportadora || 'Coordinadora';

  const numeroGuia =
    pedido.numero_guia || `PKR-${pedido.id}${Date.now()}`;

  const productosHTML = pedido.detalles
    ?.map(
      (d: any) => `
      <tr>
        <td>${d.producto_nombre}</td>
        <td style="text-align:center;">${d.cantidad}</td>
      </tr>
    `
    )
    .join('');

  const html = `
  <html>
    <head>
      <title>Guía ${numeroGuia}</title>

      <style>
        body{
          font-family: Arial;
          background:#f5f5f5;
          padding:30px;
        }

        .guia{
          background:white;
          max-width:850px;
          margin:auto;
          border-radius:18px;
          overflow:hidden;
          border:2px solid #222;
        }

        .top{
          background:#111827;
          color:white;
          padding:25px;
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .logo{
          font-size:28px;
          font-weight:bold;
        }

        .tracking{
          text-align:right;
        }

        .tracking-number{
          font-size:26px;
          font-weight:bold;
          margin-top:8px;
        }

        .section{
          padding:24px;
          border-bottom:1px solid #eee;
        }

        .grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:20px;
        }

        .box{
          border:1px solid #ddd;
          border-radius:12px;
          padding:16px;
        }

        .title{
          font-size:12px;
          color:#666;
          margin-bottom:10px;
          text-transform:uppercase;
          font-weight:bold;
        }

        .value{
          font-size:15px;
          color:#111;
          line-height:1.6;
        }

        table{
          width:100%;
          border-collapse:collapse;
          margin-top:10px;
        }

        th{
          background:#f3f4f6;
          padding:10px;
          text-align:left;
        }

        td{
          padding:10px;
          border-bottom:1px solid #eee;
        }

        .estado{
          display:inline-block;
          padding:8px 16px;
          border-radius:999px;
          background:#dbeafe;
          color:#1d4ed8;
          font-weight:bold;
          margin-top:10px;
        }

        .footer{
          padding:20px;
          text-align:center;
          color:#777;
          font-size:13px;
        }
      </style>
    </head>

    <body>

      <div class="guia">

        <div class="top">
          <div>
            <div class="logo">${transportadora}</div>
            <div>Guía logística de envío</div>
          </div>

          <div class="tracking">
            <div>NÚMERO DE GUÍA</div>
            <div class="tracking-number">
              ${numeroGuia}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="grid">

            <div class="box">
              <div class="title">REMITENTE</div>

              <div class="value">
                PAKARI SHOP<br/>
                Artesanías Colombianas<br/>
                soporte@pakari.com
              </div>
            </div>

            <div class="box">
              <div class="title">DESTINATARIO</div>

              <div class="value">
                ${pedido.cliente_nombre}<br/>
                ${pedido.telefono || ''}<br/>
                ${pedido.direccion || ''}
              </div>
            </div>

          </div>
        </div>

        <div class="section">

          <div class="title">INFORMACIÓN DEL ENVÍO</div>

          <div class="value">
            Fecha: ${fecha}<br/>
            Estado actual:
            <span class="estado">${pedido.estado}</span>
          </div>

        </div>

        <div class="section">

          <div class="title">PRODUCTOS</div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
              </tr>
            </thead>

            <tbody>
              ${productosHTML}
            </tbody>
          </table>

        </div>

        <div class="footer">
          Gracias por apoyar a los artesanos colombianos 🇨🇴
        </div>

      </div>

      <script>
        window.onload = () => {
          window.print();
        }
      </script>

    </body>
  </html>
  `;

  const ventana = window.open('', '_blank');

  if (!ventana) {
    alert('Debes permitir ventanas emergentes');
    return;
  }

  ventana.document.write(html);
  ventana.document.close();
}