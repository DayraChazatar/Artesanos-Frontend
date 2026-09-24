import { Link } from 'react-router-dom';

const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold text-gray-900 mb-2">{titulo}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export function PoliticaDatos() {
  return (
    <div className="bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-2xl font-bold text-orange-600 mb-1">Política de tratamiento de datos personales</h1>
        <p className="text-xs text-gray-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}</p>

        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-800 mb-8">
          📎 Pakari Shop es un proyecto piloto desarrollado como trabajo de grado, actualmente en fase de pruebas
          con un grupo de artesanos y clientes voluntarios. Esta política explica qué datos se recogen durante esa
          fase de pruebas y cómo se usan.
        </div>

        <Seccion titulo="1. Responsable del tratamiento">
          <p>
            El tratamiento de los datos personales recogidos en Pakari Shop está a cargo de quien desarrolla y
            administra el proyecto, en el marco de un trabajo de grado. Para cualquier pregunta, solicitud de
            acceso, corrección o eliminación de tus datos, puedes escribir a{' '}
            <a href="mailto:pakarishop.soporte@gmail.com" className="text-orange-600 hover:underline">
              pakarishop.soporte@gmail.com
            </a>.
          </p>
        </Seccion>

        <Seccion titulo="2. Qué datos recogemos">
          <p>Dependiendo de si te registras como cliente o como artesano, se recogen los siguientes datos:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>De todos los usuarios:</strong> nombre, correo electrónico y contraseña (guardada siempre cifrada, nunca en texto plano).</li>
            <li><strong>De clientes:</strong> teléfono y dirección de entrega, cuando se hace un pedido.</li>
            <li><strong>De artesanos:</strong> teléfono, biografía, categoría artesanal y, opcionalmente, una foto de perfil.</li>
            <li>
              <strong>Datos bancarios (solo si el artesano activa "pago directo"):</strong> banco, tipo de cuenta,
              número de cuenta o celular Nequi, y nombre del titular. Estos datos son opcionales, los ingresa el
              propio artesano, y solo se muestran a un cliente cuando ese cliente elige pagarle a ese artesano por
              transferencia directa.
            </li>
            <li><strong>Comprobantes de pago:</strong> si pagas por transferencia directa, la foto del comprobante que subes queda asociada a ese pedido, visible solo para ti y para el artesano correspondiente.</li>
            <li><strong>Historial de compras:</strong> productos comprados, montos, direcciones de entrega y estado de cada pedido.</li>
          </ul>
        </Seccion>

        <Seccion titulo="3. Para qué usamos tus datos">
          <ul className="list-disc pl-5 space-y-1">
            <li>Crear y administrar tu cuenta, y permitirte iniciar sesión.</li>
            <li>Procesar tus pedidos y ponerte en contacto con el artesano (o el cliente) correspondiente.</li>
            <li>Enviarte correos operativos, como la recuperación de contraseña.</li>
            <li>Mejorar la herramienta a partir de cómo se usa durante la fase de pruebas.</li>
          </ul>
          <p>No usamos tus datos con fines publicitarios ni los vendemos ni los compartimos con terceros distintos a los mencionados en esta política.</p>
        </Seccion>

        <Seccion titulo="4. Con quién se comparten tus datos">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong>: aloja la base de datos y las imágenes (fotos de perfil, de productos y comprobantes de pago).</li>
            <li><strong>Wompi</strong>: si pagas con tarjeta, el número de tu tarjeta lo procesa directamente Wompi — nuestro servidor nunca lo recibe ni lo guarda.</li>
            <li><strong>Google</strong>: si inicias sesión con tu cuenta de Google, recibimos de Google tu nombre, correo y foto de perfil, nada más.</li>
            <li><strong>El artesano o cliente con el que hagas una transacción</strong>: al hacer un pedido, el artesano ve tu nombre, teléfono y dirección de entrega; si el pago es por transferencia directa, tú ves sus datos bancarios.</li>
          </ul>
        </Seccion>

        <Seccion titulo="5. Tus derechos">
          <p>
            De acuerdo con la Ley 1581 de 2012 de Colombia, tienes derecho a conocer, actualizar, corregir y
            solicitar la eliminación de tus datos personales en cualquier momento. Puedes hacerlo directamente
            desde tu perfil dentro de la página, o escribiendo a{' '}
            <a href="mailto:pakarishop.soporte@gmail.com" className="text-orange-600 hover:underline">
              pakarishop.soporte@gmail.com
            </a>.
          </p>
        </Seccion>

        <Seccion titulo="6. Conservación de los datos">
          <p>
            Tus datos se conservan mientras tu cuenta esté activa. Como este proyecto se encuentra en fase de
            pruebas piloto, es posible que se elimine información de prueba periódicamente; si eso llegara a
            afectar tu cuenta, se te avisará con anticipación.
          </p>
        </Seccion>

        <p className="text-xs text-gray-400 mt-10">
          Ver también los <Link to="/terminos-condiciones" className="text-orange-600 hover:underline">Términos y condiciones de uso</Link>.
        </p>
      </div>
    </div>
  );
}
