import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function Root() {
  const { pathname } = useLocation();
  const isArtesano = pathname === '/perfil-artesano';

  return (
    <div className="min-h-screen flex flex-col">
      {!isArtesano && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isArtesano && <Footer />}
    </div>
  );
}