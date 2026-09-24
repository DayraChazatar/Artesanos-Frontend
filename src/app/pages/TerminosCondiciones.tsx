import { Link } from 'react-router-dom';

const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold text-gray-900 mb-2">{titulo}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export function TerminosCondiciones() {
  return (
    <div className="bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-2xl font-bold text-orange-600 mb-1">Términos y condiciones de uso</h1>
        <p className="text-xs text-gray-400 mb-8">Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}</p>

        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-800 mb-8">
          📎 Pakari Shop es un proyecto piloto desarrollado como trabajo de grado, actualmente en fase de pruebas
          con un grupo de artesanos y clientes voluntarios. No es todavía una empresa constituida ni una tienda en
          producción comercial — al usarla, entiendes que puede tener errores, cambios frecuentes o interrupciones
          propias de esta etapa.
        </div>

        <Seccion titulo="1. Qué es Pakari Shop">
          <p>
            Pakari Shop es una plataforma que conecta directamente a artesanos de Pasto, Nariño con clientes
            interesados en productos hechos a mano. Pakari Shop actúa como <strong>intermediario</strong> entre
            ambas partes: pone la vitrina, el carrito de compras y el medio de pago, pero no fabrica, no almacena
            ni envía físicamente los productos — eso es responsabilidad de cada artesano.
          </p>
        </Seccion>

        <Seccion titulo="2. Registro de cuenta">
          <ul className="list-disc pl-5 space-y-1">
            <li>Debes dar información real al registrarte. No se permite crear cuentas con datos falsos.</li>
            <li>Eres responsable de mantener segura tu contraseña y de todo lo que ocurra desde tu cuenta.</li>
            <li>Una cuenta de administrador nunca se crea desde este formulario — solo existe para el equipo del proyecto.</li>
          </ul>
        </Seccion>

        <Seccion titulo="3. Como cliente">
          <ul className="list-disc pl-5 space-y-1">
            <li>El precio, la disponibilidad y la descripción de cada producto los define el artesano que lo publica.</li>
            <li>Al confirmar un pedido, te comprometes a pagarlo por el medio que elijas (tarjeta a través de Wompi, o transferencia directa al artesano).</li>
            <li>Si pagas por transferencia directa, el pedido queda pendiente hasta que el artesano confirme haber recibido tu pago — por eso es importante subir un comprobante real y legible.</li>
            <li>Las devoluciones se solicitan desde tu propia cuenta, en el pedido correspondiente, y las resuelve el artesano.</li>
          </ul>
        </Seccion>

        <Seccion titulo="4. Como artesano">
          <ul className="list-disc pl-5 space-y-1">
            <li>Eres responsable de que la información, fotos y precios de tus productos sean veraces.</li>
            <li>Eres responsable de tener el stock disponible que publicas, y de despachar los pedidos que confirmes.</li>
            <li>Si activas el pago directo, tus datos bancarios se muestran únicamente al cliente que elija pagarte por esa vía — puedes editarlos o desactivarlos cuando quieras desde tu perfil.</li>
            <li>El administrador del proyecto puede suspender una cuenta si se detecta un uso indebido de la plataforma.</li>
          </ul>
        </Seccion>

        <Seccion titulo="5. Pagos">
          <p>
            Los pagos con tarjeta se procesan a través de <strong>Wompi</strong>, una pasarela de pagos externa;
            Pakari Shop nunca recibe ni guarda el número de tu tarjeta. Durante la fase de pruebas piloto, los
            pagos con tarjeta se hacen en <strong>modo de pruebas</strong> (sin dinero real), salvo que se indique
            expresamente lo contrario. Los pagos por transferencia directa son un acuerdo entre cliente y
            artesano; Pakari Shop no participa en esa transacción, solo facilita mostrar los datos y confirmar el
            estado del pedido.
          </p>
        </Seccion>

        <Seccion titulo="6. Qué no está permitido">
          <ul className="list-disc pl-5 space-y-1">
            <li>Publicar productos ilegales, falsificados o que no sean artesanías hechas a mano.</li>
            <li>Usar la plataforma para acosar, estafar o suplantar a otra persona.</li>
            <li>Intentar vulnerar la seguridad del sitio o acceder a cuentas ajenas.</li>
          </ul>
        </Seccion>

        <Seccion titulo="7. Límite de responsabilidad">
          <p>
            Al ser un proyecto en fase de pruebas académicas, Pakari Shop no garantiza disponibilidad continua del
            servicio ni está exenta de errores. No nos hacemos responsables por disputas comerciales entre
            artesanos y clientes; en esos casos, mediaremos de buena fe pero la responsabilidad final de cada
            transacción es de quien vende y quien compra.
          </p>
        </Seccion>

        <Seccion titulo="8. Cambios a estos términos">
          <p>
            Mientras el proyecto esté en fase de pruebas, estos términos pueden actualizarse para reflejar nuevas
            funciones. Si haces cambios importantes en tu forma de usar la plataforma después de una actualización,
            entendemos que aceptas la versión vigente.
          </p>
        </Seccion>

        <p className="text-xs text-gray-400 mt-10">
          Ver también la <Link to="/politica-datos" className="text-orange-600 hover:underline">Política de tratamiento de datos personales</Link>.
        </p>
      </div>
    </div>
  );
}
