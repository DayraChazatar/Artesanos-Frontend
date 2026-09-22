import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function Root() {
  const { pathname } = useLocation();
  // El panel de artesano y el de administrador tienen su propia barra
  // superior — no se combinan con la de cliente.
  const tienePropiaBarra = pathname === '/perfil-artesano' || pathname === '/admin';

  return (
    <div className="min-h-screen flex flex-col">
      {!tienePropiaBarra && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!tienePropiaBarra && <Footer />}
    </div>
  );
}