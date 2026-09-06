import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  LogOut,
  UserCircle,
  Bell,
  Package,
  House,
  Store,
  CheckCheck,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
  BarChart3,
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { API_BASE } from '../utils/config';

function perfilRoute(role?: string) {
  if (role === 'artisan') return '/perfil-artesano';
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

/* =========================================================
   ESTILOS DE ESTADOS
========================================================= */

const STATUS_STYLES: Record<string, string> = {
  Pendiente: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  'En proceso': 'bg-orange-50 text-orange-700 border border-orange-200',
  Enviado: 'bg-blue-50 text-blue-700 border border-blue-200',
  Entregado: 'bg-green-50 text-green-700 border border-green-200',
  Cancelado: 'bg-red-50 text-red-700 border border-red-200',
  'Devolución solicitada':
    'bg-purple-50 text-purple-700 border border-purple-200',
  Devuelto: 'bg-teal-50 text-teal-700 border border-teal-200',
  Rechazado: 'bg-red-50 text-red-700 border border-red-200',
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

/* =========================================================
   ICONOS DE ESTADO
========================================================= */

const STATUS_ICON_COMPONENTS: Record<string, React.ReactNode> = {
  Pendiente: <Clock className="h-4 w-4" />,
  'En proceso': <Clock className="h-4 w-4" />,
  Enviado: <Truck className="h-4 w-4" />,
  Entregado: <CheckCircle2 className="h-4 w-4" />,
  Cancelado: <XCircle className="h-4 w-4" />,
  'Devolución solicitada': <RotateCcw className="h-4 w-4" />,
  Devuelto: <RotateCcw className="h-4 w-4" />,
  Rechazado: <Ban className="h-4 w-4" />,
};

/* =========================================================
   CONFIGURACIÓN DE NOTIFICACIONES
========================================================= */

// Consulta el backend cada 15 segundos
const POLL_INTERVAL = 15000;

// Prefijo para guardar las notificaciones por usuario
const SEEN_MAP_PREFIX = 'orders_seen_map_';

/* =========================================================
   MENSAJES DE NOTIFICACIÓN
========================================================= */

function getNotificationMessage(status: string) {
  switch (status) {
    case 'Pendiente':
      return 'Tu pedido está pendiente de procesamiento.';

    case 'En proceso':
      return 'Tu pedido está siendo preparado.';

    case 'Enviado':
      return '¡Tu pedido ha sido enviado!';

    case 'Entregado':
      return '¡Tu pedido ha sido entregado!';

    case 'Cancelado':
      return 'Tu pedido ha sido cancelado.';

    case 'Devolución solicitada':
      return 'Tu solicitud de devolución está siendo revisada.';

    case 'Devuelto':
      return 'La devolución de tu pedido ha sido procesada.';

    case 'Rechazado':
      return 'Tu pedido ha sido rechazado.';

    default:
      return 'Tu pedido tiene una actualización.';
  }
}

/* =========================================================
   COMPONENTE NAVBAR
========================================================= */

export function Navbar({
  activeTab,
  onTabChange,
}: NavbarProps) {
  const { totalItems } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const isArtisan = user?.role === 'artisan';

  /* =========================================================
     CLAVE PERSONALIZADA POR USUARIO
     
     Esto evita que las notificaciones de un usuario
     interfieran con las de otro.
  ========================================================= */

  const getSeenMapKey = () => {
    return `${SEEN_MAP_PREFIX}${user?.id ?? 'guest'}`;
  };

  /* =========================================================
     OBTENER ESTADOS VISTOS
  ========================================================= */

  const getSeenMap = (): Record<string, string> => {
    if (!user?.id) return {};

    try {
      return JSON.parse(
        localStorage.getItem(getSeenMapKey()) || '{}'
      );
    } catch {
      return {};
    }
  };

  /* =========================================================
     CALCULAR NOTIFICACIONES NO VISTAS
  ========================================================= */

  const computeUnseen = (data: any[]) => {
    const seenMap = getSeenMap();

    const changed = data.filter(
      (order: any) =>
        seenMap[String(order.id)] !== order.estado
    );

    return changed.length;
  };

  /* =========================================================
     CARGAR PEDIDOS DEL CLIENTE
     
     IMPORTANTE:
     Los artesanos NO utilizan esta consulta.
  ========================================================= */

  useEffect(() => {
    if (!user?.id || user?.role === 'artisan') return;

    const fetchOrders = () => {
      const token = localStorage.getItem('token') ?? '';

      fetch(
        `${API_BASE}/inventario/pedidos/cliente/${user.id}/`,
        {
          headers: token
            ? {
                Authorization: `Token ${token}`,
              }
            : {},
        }
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error('No se pudieron cargar los pedidos');
          }

          return res.json();
        })
        .then((data) => {
          const ordersData = Array.isArray(data) ? data : [];

          setOrders(ordersData);
          setUnseenCount(computeUnseen(ordersData));
        })
        .catch(() => {
          setOrders([]);
          setUnseenCount(0);
        });
    };

    // Primera consulta
    fetchOrders();

    // Actualizar cada 15 segundos
    const interval = setInterval(
      fetchOrders,
      POLL_INTERVAL
    );

    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  /* =========================================================
     ACTUALIZAR EL CONTADOR CUANDO CAMBIAN LOS PEDIDOS
  ========================================================= */

  useEffect(() => {
    if (!user?.id || user?.role === 'artisan') return;

    setUnseenCount(computeUnseen(orders));
  }, [orders, user?.id, user?.role]);

  /* =========================================================
     MARCAR TODAS LAS NOTIFICACIONES COMO VISTAS
  ========================================================= */

  const markAllAsSeen = () => {
    if (!user?.id || orders.length === 0) return;

    const map: Record<string, string> = {};

    orders.forEach((order: any) => {
      map[String(order.id)] = order.estado;
    });

    localStorage.setItem(
      getSeenMapKey(),
      JSON.stringify(map)
    );

    setUnseenCount(0);
  };

  /* =========================================================
     CUANDO SE ABRE LA CAMPANA
     
     IMPORTANTE:
     No marcamos automáticamente todo como leído.
     
     Así el usuario puede ver qué notificaciones son nuevas.
  ========================================================= */

  useEffect(() => {
    if (!bellOpen) return;

    // No hacemos nada aquí.
    // Las notificaciones permanecen como no vistas
    // hasta que el usuario pulse "Marcar como leídas".
  }, [bellOpen]);

  /* =========================================================
     CERRAR MENÚS AL HACER CLICK AFUERA
  ========================================================= */

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }

      if (
        bellRef.current &&
        !bellRef.current.contains(target)
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

  /* =========================================================
     CERRAR SESIÓN
  ========================================================= */

  const handleLogout = () => {
    setOpen(false);
    setBellOpen(false);

    logout();

    navigate('/');
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* =================================================
              LOGO
          ================================================= */}

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

          {/* =================================================
              NAV CENTRAL
          ================================================= */}

          {isArtisan && onTabChange ? (
            <div className="flex items-center gap-1 overflow-x-auto">
              {ARTESANO_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    onTabChange(tab.id)
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    activeTab === tab.id
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

              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
              >
                <House className="h-4 w-4" />
                Inicio
              </Link>

              <Link
                to="/catalogo"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
              >
                <Store className="h-4 w-4" />
                Productos
              </Link>

              {isAuthenticated && !isArtisan && (
                <Link
                  to="/mis-pedidos"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
                >
                  <Package className="h-4 w-4" />
                  Mis Pedidos
                </Link>
              )}

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

          {/* =================================================
              ACCIONES DERECHA
          ================================================= */}

          <div className="flex items-center gap-3 flex-shrink-0">

            {/* =================================================
                CARRITO
            ================================================= */}

            {!isArtisan && isAuthenticated && (
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

            {/* =================================================
                NOTIFICACIONES
            ================================================= */}

            {isAuthenticated && (
              <div
                className="relative group"
                ref={bellRef}
              >

                {/* ===========================================
                    ARTESANO
                =========================================== */}

                {user?.role === 'artisan' ? (
                  <Link
                    to="/perfil-artesano#notificaciones"
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors block"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                  </Link>
                ) : (

                  /* =========================================
                     CLIENTE
                  ========================================= */

                  <button
                    onClick={() =>
                      setBellOpen(
                        (prev) => !prev
                      )
                    }
                    className={`relative p-2 rounded-full transition-colors ${
                      bellOpen
                        ? 'bg-orange-50 text-orange-600'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    aria-label="Notificaciones"
                  >
                    <Bell
                      className={`h-5 w-5 ${
                        bellOpen
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`}
                    />

                    {/* CONTADOR */}

                    {unseenCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-bold shadow-sm border-2 border-white">
                        {unseenCount > 99
                          ? '99+'
                          : unseenCount}
                      </span>
                    )}
                  </button>
                )}

                {/* =================================================
                    PANEL DE NOTIFICACIONES DEL CLIENTE
                ================================================= */}

                {user?.role !== 'artisan' &&
                  bellOpen && (
                    <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

                      {/* =========================================
                          CABECERA
                      ========================================= */}

                      <div className="px-5 py-4 border-b border-gray-100 bg-white">

                        <div className="flex items-center justify-between">

                          <div>
                            <h3 className="font-bold text-gray-900 text-base">
                              Notificaciones
                            </h3>

                            <p className="text-xs text-gray-500 mt-0.5">
                              Actualizaciones de tus pedidos
                            </p>
                          </div>

                          {unseenCount > 0 && (
                            <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                              {unseenCount}{' '}
                              {unseenCount === 1
                                ? 'nueva'
                                : 'nuevas'}
                            </span>
                          )}

                        </div>

                        {/* MARCAR COMO LEÍDAS */}

                        {unseenCount > 0 && (
                          <button
                            onClick={markAllAsSeen}
                            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 transition-colors"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Marcar todas como leídas
                          </button>
                        )}
                      </div>

                      {/* =========================================
                          LISTA
                      ========================================= */}

                      <div className="max-h-[420px] overflow-y-auto">

                        {orders.length === 0 ? (

                          /* =====================================
                             SIN NOTIFICACIONES
                          ===================================== */

                          <div className="text-center py-12 px-5">

                            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                              <Bell className="h-7 w-7 text-gray-300" />
                            </div>

                            <p className="text-sm font-semibold text-gray-600">
                              No hay notificaciones
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              Aquí aparecerán las
                              actualizaciones de tus
                              pedidos.
                            </p>

                          </div>

                        ) : (

                          orders
                            .slice()
                            .sort(
                              (
                                a: any,
                                b: any
                              ) =>
                                new Date(
                                  b.fecha
                                ).getTime() -
                                new Date(
                                  a.fecha
                                ).getTime()
                            )
                            .map(
                              (
                                order: any
                              ) => {

                                const status =
                                  order.estado ||
                                  'Pendiente';

                                const seenMap =
                                  getSeenMap();

                                const isUnread =
                                  seenMap[
                                    String(
                                      order.id
                                    )
                                  ] !== status;

                                const productName =
                                  order
                                    .detalles?.[0]
                                    ?.producto_nombre ||
                                  'Pedido';

                                const extraProducts =
                                  order
                                    .detalles
                                    ?.length > 1
                                    ? order
                                        .detalles
                                        .length -
                                      1
                                    : 0;

                                return (
                                  <Link
                                    key={
                                      order.id
                                    }
                                    to="/mis-pedidos"
                                    onClick={() =>
                                      setBellOpen(
                                        false
                                      )
                                    }
                                    className={`block border-b border-gray-50 last:border-b-0 transition-colors ${
                                      isUnread
                                        ? 'bg-orange-50/40 hover:bg-orange-50'
                                        : 'bg-white hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="px-5 py-4">

                                      <div className="flex items-start gap-3">

                                        {/* ICONO */}

                                        <div
                                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                            isUnread
                                              ? 'bg-orange-100 text-orange-600'
                                              : 'bg-gray-100 text-gray-500'
                                          }`}
                                        >
                                          {STATUS_ICON_COMPONENTS[
                                            status
                                          ] || (
                                            <Package className="h-4 w-4" />
                                          )}
                                        </div>

                                        {/* CONTENIDO */}

                                        <div className="flex-1 min-w-0">

                                          <div className="flex items-start justify-between gap-2">

                                            <div className="min-w-0">

                                              <p className="text-sm font-bold text-gray-800 truncate">
                                                {productName}

                                                {extraProducts >
                                                  0 &&
                                                  ` + ${extraProducts} más`}
                                              </p>

                                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                {getNotificationMessage(
                                                  status
                                                )}
                                              </p>

                                            </div>

                                            {/* PUNTO DE NO VISTO */}

                                            {isUnread && (
                                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1.5" />
                                            )}

                                          </div>

                                          {/* ESTADO */}

                                          <div className="flex items-center justify-between gap-2 mt-2">

                                            <span
                                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-semibold ${
                                                STATUS_STYLES[
                                                  status
                                                ] ||
                                                STATUS_STYLES[
                                                  'Pendiente'
                                                ]
                                              }`}
                                            >
                                              <span>
                                                {STATUS_ICONS[
                                                  status
                                                ] ||
                                                  '🕐'}
                                              </span>

                                              {status}
                                            </span>

                                            <span className="text-xs font-bold text-orange-600">
                                              $
                                              {Number(
                                                order.total ||
                                                  0
                                              ).toLocaleString(
                                                'es-CO'
                                              )}
                                            </span>

                                          </div>

                                          {/* FECHA */}

                                          <p className="text-[11px] text-gray-400 mt-2">
                                            {order.fecha
                                              ? new Date(
                                                  order.fecha
                                                ).toLocaleDateString(
                                                  'es-CO',
                                                  {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                  }
                                                )
                                              : 'Fecha no disponible'}
                                          </p>

                                        </div>

                                      </div>

                                    </div>
                                  </Link>
                                );
                              }
                            )
                        )}

                      </div>

                      {/* =========================================
                          PIE
                      ========================================= */}

                      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">

                        <Link
                          to="/mis-pedidos"
                          onClick={() =>
                            setBellOpen(false)
                          }
                          className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                        >
                          <Package className="h-4 w-4" />
                          Ver todos mis pedidos
                        </Link>

                      </div>

                    </div>
                  )}
              </div>
            )}

            {/* =================================================
                MENÚ USUARIO
            ================================================= */}

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

                  <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                    {user?.name}
                  </span>

                  <div className="relative">

                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold">
                      {user?.name
                        ?.slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />

                  </div>

                </button>

                {/* =========================================
                    DROPDOWN USUARIO
                ========================================= */}

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
                        {user?.role === 'artisan'
                          ? '🧵 Artesano'
                          : user?.role === 'admin'
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

                      {user?.role === 'artisan'
                        ? 'Panel Artesano'
                        : 'Mi Perfil'}
                    </Link>

                    {user?.role === 'admin' && (
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
    </nav>
  );
}