import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShoppingCart, User, LogOut, BarChart3, UserCircle, Bell, FileText, Package, ChevronLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { generarFacturaPDF } from '../utils/facturas';

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

const STATUS_STYLES: Record<string, string> = {
  'Pendiente':  'bg-yellow-100 text-yellow-700',
  'En proceso': 'bg-orange-100 text-orange-700',
  'Enviado':    'bg-blue-100 text-blue-700',
  'Entregado':  'bg-green-100 text-green-700',
  'Cancelado':  'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<string, string> = {
  'Pendiente':  '🕐',
  'En proceso': '⚙️',
  'Enviado':    '🚚',
  'Entregado':  '✅',
  'Cancelado':  '❌',
};

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { totalItems } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);

  const isArtisan = user?.role === 'artisan';
  const isClient = user?.role !== 'artisan' && user?.role !== 'admin';

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(saved);
    const seen = parseInt(localStorage.getItem('orders_seen') || '0');
    setUnseenCount(Math.max(0, saved.length - seen));
  }, []);

  useEffect(() => {
    if (bellOpen) {
      setUnseenCount(0);
      const saved = JSON.parse(localStorage.getItem('orders') || '[]');
      localStorage.setItem('orders_seen', saved.length.toString());
    }
  }, [bellOpen]);

  useEffect(() => {
    if (ordersOpen) {
      const saved = JSON.parse(localStorage.getItem('orders') || '[]');
      setOrders(saved);
      setSelectedOrder(null);
    }
  }, [ordersOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (ordersRef.current && !ordersRef.current.contains(e.target as Node)) {
        setOrdersOpen(false);
        setSelectedOrder(null);
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

  const handleFactura = (order: any) => {
    try {
      generarFacturaPDF(order);
    } catch (error: any) {
      console.error(error.message);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">

          <Link to="/" className="flex items-center gap-1 flex-shrink-0">
            <img src="/logo.jpg" alt="Logo" className="h-14 w-14 object-contain" />
            <span className="text-xl font-bold text-orange-600">Pakari Shop</span>
          </Link>

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

          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Carrito */}
            {!isArtisan && isAuthenticated && (
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

            {/* Pedidos — solo clientes */}
            {isAuthenticated && isClient && (
              <div className="relative" ref={ordersRef}>
                <button
                  onClick={() => setOrdersOpen(prev => !prev)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Package className="h-5 w-5 text-gray-600" />
                  {unseenCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unseenCount}
                    </span>
                  )}
                </button>

                {ordersOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      {selectedOrder ? (
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-orange-600 transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" /> Volver
                        </button>
                      ) : (
                        <h3 className="font-semibold text-gray-900">Mis Pedidos</h3>
                      )}
                      <span className="text-xs text-gray-500">{orders.length} en total</span>
                    </div>

                    {!selectedOrder && (
                      <div className="max-h-96 overflow-y-auto">
                        {orders.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No tienes pedidos aún</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {orders.slice().reverse().map((order: any) => (
                              <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center justify-between px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {order.items?.[0]?.name || 'Pedido'}
                                    {order.items?.length > 1 && ` + ${order.items.length - 1} más`}
                                  </p>
                                  <p className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString('es-CO')}</p>
                                </div>
                                <span className="font-bold text-orange-600 text-sm">${order.total.toLocaleString('es-CO')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedOrder && (
                      <div className="max-h-96 overflow-y-auto">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-gray-800">
                              Pedido #{selectedOrder.id.slice(-3).toUpperCase()}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[selectedOrder.status] || STATUS_STYLES['Pendiente']}`}>
                              {STATUS_ICONS[selectedOrder.status] || '🕐'} {selectedOrder.status || 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(selectedOrder.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>

                        <div className="px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Productos</p>
                          {selectedOrder.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                              <span className="font-medium">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                            </div>
                          ))}
                        </div>

                        <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="font-bold text-gray-800">Total</span>
                          <span className="font-bold text-orange-600 text-lg">${selectedOrder.total.toLocaleString('es-CO')}</span>
                        </div>

                        <div className="px-4 pb-4">
                          <button
                            onClick={() => handleFactura(selectedOrder)}
                            disabled={selectedOrder.status?.toLowerCase() === 'cancelado'}
                            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <FileText className="h-4 w-4" />
                            Descargar Factura
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="px-4 py-3 border-t border-gray-100">
                      <Link
                        to="/mis-pedidos"
                        onClick={() => setOrdersOpen(false)}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Ver todos los pedidos →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Campana — solo clientes */}
            {isAuthenticated && isClient && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen(prev => !prev)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unseenCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unseenCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No hay notificaciones nuevas</p>
                        </div>
                      ) : (
                        orders.slice().reverse().map((order: any) => {
                          const status = order.status || 'Pendiente';
                          const icon = STATUS_ICONS[status] || '🕐';
return (
  <div key={order.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
    <span className="text-xl mt-0.5">{icon}</span>
    <div className="flex-1">
      <p className="text-sm font-semibold text-gray-800">
        {order.items?.[0]?.name || 'Pedido'}
        {order.items?.length > 1 && ` + ${order.items.length - 1} más`}
      </p>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status] || STATUS_STYLES['Pendiente']}`}>
        {icon} {status}
      </span>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(order.date).toLocaleDateString('es-CO')}
      </p>
    </div>
    <span className="text-xs font-bold text-orange-600 mt-1">
      ${order.total.toLocaleString('es-CO')}
    </span>
  </div>
);
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Menú usuario */}
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