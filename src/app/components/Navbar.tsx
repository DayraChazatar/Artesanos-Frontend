import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShoppingCart, User, LogOut, BarChart3, UserCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
 
function perfilRoute(role?: string) {
  if (role === 'artisan') return '/perfil-artesano';
  if (role === 'admin')   return '/dashboard';
  return '/perfil';
}
 
const ARTESANO_TABS = [
  { id: 'catalogo',   label: 'Catálogo',   icon: '🖼️' },
  { id: 'contable',   label: 'Contable',   icon: '🧾' },
  { id: 'productos',  label: 'Productos',  icon: '📦' },
  { id: 'inventario', label: 'Inventario', icon: '📊' },
] as const;
 
type ArtesanoTab = typeof ARTESANO_TABS[number]['id'];
 
interface NavbarProps {
  activeTab?: ArtesanoTab;
  onTabChange?: (tab: ArtesanoTab) => void;
}
 
export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { totalItems } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
 
  const isArtisan = user?.role === 'artisan';
 
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
 
  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };
 
  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
 
          {/* Izquierda: logo */}
          <Link to="/" className="text-xl font-semibold text-orange-600 whitespace-nowrap flex-shrink-0">
            Pakari Shop 
          </Link>
 
          {/* Centro: tabs artesano O links normales */}
          {isArtisan && onTabChange ? (
            <div className="flex items-center gap-1 overflow-x-auto">
              {ARTESANO_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    activeTab === t.id
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/catalogo" className="hover:text-orange-600 transition-colors">Catálogo</Link>
              <Link to="/" className="hover:text-orange-600 transition-colors">Inicio</Link>
              {user?.role === 'admin' && (
                <Link to="/dashboard" className="hover:text-orange-600 transition-colors">Dashboard</Link>
              )}
            </div>
          )}
 
          {/* Derecha: carrito (solo no-artesano) + usuario */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!isArtisan && (
              <Link to="/carrito" className="relative">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            )}
 
            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(prev => !prev)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  {isArtisan && (
                    <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                      {user?.name}
                    </span>
                  )}
                  <div className="relative">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                </button>
 
                {open && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        {user?.role === 'artisan' ? '🧵 Artesano' : user?.role === 'admin' ? '⚙️ Admin' : '🛍️ Cliente'}
                      </span>
                    </div>
 
                    <Link
                      to={perfilRoute(user?.role)}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <UserCircle className="h-4 w-4 text-gray-500" />
                      {user?.role === 'artisan' ? 'Panel Artesano' : 'Mi Perfil'}
                    </Link>
 
                    {user?.role === 'admin' && (
                      <Link
                        to="/dashboard"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                        Dashboard
                      </Link>
                    )}
 
                    <div className="border-t border-gray-100 mt-1" />
 
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>
 
        </div>
      </div>
    </nav>
  );
}


