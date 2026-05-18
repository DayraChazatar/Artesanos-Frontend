import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  LogOut,
  BarChart3,
  UserCircle,
  Bell,
  FileText,
  Package,
  ChevronLeft,
  House,
  Store,
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

function perfilRoute(role?: string) {
  if (role === 'artisan') return '/perfil-artesano';
  if (role === 'admin') return '/dashboard';
  return '/perfil';
}

const ARTESANO_TABS = [
  { id: 'catalogo', label: 'Catálogo', icon: '🖼️' },
  { id: 'contable', label: 'Contable', icon: '🧾' },
  { id: 'productos', label: 'Productos', icon: '📦' },
  { id: 'inventario', label: 'Inventario', icon: '📊' },
] as const;

type ArtesanoTab = typeof ARTESANO_TABS[number]['id'];

interface NavbarProps {
  activeTab?: ArtesanoTab;
  onTabChange?: (tab: ArtesanoTab) => void;
}

const STATUS_STYLES: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  'En proceso': 'bg-orange-100 text-orange-700',
  Enviado: 'bg-blue-100 text-blue-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-700',
  'Devolución solicitada': 'bg-purple-100 text-purple-700',
  Devuelto: 'bg-teal-100 text-teal-700',
  Rechazado: 'bg-red-200 text-red-800',
};

const STATUS_ICONS: Record<string, string> = {
  Pendiente: '🕐',
  'En proceso': '⚙️',
  Enviado: '🚚',
  Entregado: '✅',
  Cancelado: '❌',
  'Devolución solicitada': '🔄',
  Devuelto: '↩️',
  Rechazado: '🚫',
};

export function Navbar({
  activeTab,
  onTabChange,
}: NavbarProps) {
  const { totalItems } = useCart();

  const {
    user,
    logout,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [bellOpen, setBellOpen] =
    useState(false);

  const [orders, setOrders] = useState<any[]>(
    []
  );

  const [unseenCount, setUnseenCount] =
    useState(0);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const bellRef =
    useRef<HTMLDivElement>(null);

  const isArtisan =
    user?.role === 'artisan';

  // ─────────────────────────────────────
  // CARGAR PEDIDOS
  // ─────────────────────────────────────
  useEffect(() => {
    const savedOrders = JSON.parse(
      localStorage.getItem('orders') || '[]'
    );

    setOrders(savedOrders);

    const seen = parseInt(
      localStorage.getItem('orders_seen') || '0'
    );

    setUnseenCount(
      Math.max(0, savedOrders.length - seen)
    );
  }, []);

  // ─────────────────────────────────────
  // MARCAR NOTIFICACIONES COMO VISTAS
  // ─────────────────────────────────────
  useEffect(() => {
    if (bellOpen) {
      setUnseenCount(0);

      const savedOrders = JSON.parse(
        localStorage.getItem('orders') || '[]'
      );

      localStorage.setItem(
        'orders_seen',
        savedOrders.length.toString()
      );
    }
  }, [bellOpen]);

  // ─────────────────────────────────────
  // CERRAR MENÚS AL HACER CLICK AFUERA
  // ─────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }

      if (
        bellRef.current &&
        !bellRef.current.contains(
          event.target as Node
        )
      ) {
        setBellOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  // ─────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────
  const handleLogout = () => {
    setOpen(false);

    logout();

    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">

        <div className="flex h-16 items-center justify-between gap-4">

          {/* LOGO */}
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-12 object-contain"
            />

            <span className="text-xl font-bold text-orange-600">
              Pakari Shop
            </span>
          </Link>

          {/* NAV CENTRAL */}
          {isArtisan && onTabChange ? (
            <div className="flex items-center gap-1 overflow-x-auto">

              {ARTESANO_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    onTabChange(tab.id)
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === tab.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">

              {/* INICIO */}
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
              >
                <House className="h-4 w-4" />
                Inicio
              </Link>

              {/* PRODUCTOS */}
              <Link
                to="/catalogo"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
              >
                <Store className="h-4 w-4" />
                Productos
              </Link>

              {/* MIS PEDIDOS */}
              {isAuthenticated && !isArtisan && (
                <Link
                  to="/mis-pedidos"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
                >
                  <Package className="h-4 w-4" />
                  Mis Pedidos
                </Link>
              )}

              {/* DASHBOARD ADMIN */}
              {user?.role === 'admin' && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Link>
              )}

            </div>
          )}

          {/* ACCIONES DERECHA */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* CARRITO */}
            {!isArtisan &&
              isAuthenticated && (
                <Link
                  to="/carrito"
                  className="relative group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <ShoppingCart className="h-5 w-5" />

                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {totalItems}
                      </span>
                    )}
                  </Button>

                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Carrito
                  </span>
                </Link>
              )}

            {/* NOTIFICACIONES */}
            {isAuthenticated && (
              <div
                className="relative group"
                ref={bellRef}
              >

                {user?.role === 'artisan' ? (

                  <Link
                    to="/perfil-artesano#notificaciones"
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />

                    {unseenCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unseenCount}
                      </span>
                    )}
                  </Link>

                ) : (

                  <button
                    onClick={() =>
                      setBellOpen((prev) => !prev)
                    }
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />

                    {unseenCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unseenCount}
                      </span>
                    )}
                  </button>

                )}

                {/* PANEL */}
                {user?.role !== 'artisan' && bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">
                        Notificaciones
                      </h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">

                      {orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">

                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />

                          <p className="text-sm">
                            No hay notificaciones
                          </p>
                        </div>
                      ) : (
                        orders
                          .slice()
                          .reverse()
                          .map((order: any) => {
                            const status =
                              order.status ||
                              'Pendiente';

                            const icon =
                              STATUS_ICONS[
                              status
                              ] || '🕐';

                            return (
                              <div
                                key={order.id}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-xl mt-0.5">
                                  {icon}
                                </span>

                                <div className="flex-1">

                                  <p className="text-sm font-semibold text-gray-800">
                                    {order.items?.[0]
                                      ?.name ||
                                      'Pedido'}

                                    {order.items
                                      ?.length >
                                      1 &&
                                      ` + ${order.items
                                        .length - 1
                                      } más`}
                                  </p>

                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[
                                      status
                                    ] ||
                                      STATUS_STYLES[
                                      'Pendiente'
                                      ]
                                      }`}
                                  >
                                    {icon}{' '}
                                    {status}
                                  </span>

                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(
                                      order.date
                                    ).toLocaleDateString(
                                      'es-CO'
                                    )}
                                  </p>
                                </div>

                                <span className="text-xs font-bold text-orange-600 mt-1">
                                  $
                                  {order.total.toLocaleString(
                                    'es-CO'
                                  )}
                                </span>
                              </div>
                            );
                          })
                      )}
                    </div>

                    {/* BOTÓN */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <Link
                        to="/mis-pedidos"
                        onClick={() =>
                          setBellOpen(false)
                        }
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        Ver todos los pedidos →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MENÚ USUARIO */}
            {isAuthenticated ? (
              <div
                className="relative group"
                ref={menuRef}
              >
                <button
                  onClick={() =>
                    setOpen((prev) => !prev)
                  }
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

                {/* DROPDOWN */}
                {open && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">

                    <div className="px-4 py-3 border-b border-gray-100">

                      <p className="font-semibold text-sm truncate">
                        {user?.name}
                      </p>

                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>

                      <span className="inline-block mt-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        {user?.role ===
                          'artisan'
                          ? '🧵 Artesano'
                          : user?.role ===
                            'admin'
                            ? '⚙️ Admin'
                            : '🛍️ Cliente'}
                      </span>
                    </div>

                    <Link
                      to={perfilRoute(
                        user?.role
                      )}
                      onClick={() =>
                        setOpen(false)
                      }
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <UserCircle className="h-4 w-4 text-gray-500" />

                      {user?.role ===
                        'artisan'
                        ? 'Panel Artesano'
                        : 'Mi Perfil'}
                    </Link>

                    {user?.role ===
                      'admin' && (
                        <Link
                          to="/dashboard"
                          onClick={() =>
                            setOpen(false)
                          }
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav >
  );
}