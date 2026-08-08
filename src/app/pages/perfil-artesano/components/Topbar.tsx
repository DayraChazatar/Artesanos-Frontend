import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { House } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface TopbarProps {
  noLeidas: number;
  onVerPerfil: () => void;
}

export function Topbar({ noLeidas, onVerPerfil }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Pakari Shop" className="w-10 h-10 object-contain" />
          <span className="font-serif text-2xl font-bold text-orange-600">Pakari Shop</span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium">
            <House className="h-4 w-4" />
            Inicio
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/perfil-artesano#notificaciones" className="relative">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
              <span className="text-xl">🔔</span>
              {noLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 animate-pulse text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                  {noLeidas}
                </span>
              )}
            </div>
          </Link>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition">
              <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-stone-700 font-medium hidden sm:block">{user?.name}</span>
              <span className="w-2 h-2 rounded-full bg-green-400" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">🧵 Artesano</span>
                </div>
                <button onClick={() => { onVerPerfil(); setOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-amber-50 transition">
                  <span>👤</span> Perfil Artesano
                </button>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                  <span>↩</span> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}