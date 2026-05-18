import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import {
  getCategorias, createCategoria, deleteCategoria, updateCategoria,
  getProductos, createProducto, deleteProducto, updateProducto,
  getKardex, createKardex, reponerStock, getResumenInventario,
  descargarReporte,
  type Categoria, type Producto, type Kardex, type ResumenInventario,
} from '../data/artesanoApi';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const ARTESANO_ID: number = Number(localStorage.getItem('usuario_id') ?? 1);
const BASE = 'http://localhost:8000/api';

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const Badge = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{children}</span>
);

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'info' | 'error' }) => {
  const colors = {
    success: 'bg-green-100 text-green-800 border-green-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };
  return <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}>{msg}</div>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
    <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">{label}</label>
    {children}
  </div>
);

const inputCls =
  'px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';

function StockBadge({ p }: { p: Producto }) {
  const reservado = p.cantidad_reservada ?? 0;
  const disponible = p.cantidad - reservado;

  if (disponible <= p.stock_minimo)
    return (
      <span className="inline-flex flex-col gap-0.5">
        <Badge color="bg-red-100 text-red-700">⚠️ {disponible} disp.</Badge>
        {reservado > 0 && <span className="text-[10px] text-stone-400">{reservado} reservados</span>}
      </span>
    );

  if (p.stock_maximo > 0 && disponible >= p.stock_maximo)
    return (
      <span className="inline-flex flex-col gap-0.5">
        <Badge color="bg-blue-100 text-blue-700">📦 {disponible} (máx)</Badge>
        {reservado > 0 && <span className="text-[10px] text-stone-400">{reservado} reservados</span>}
      </span>
    );

  return (
    <span className="inline-flex flex-col gap-0.5">
      <Badge color="bg-green-100 text-green-700">{disponible}</Badge>
      {reservado > 0 && <span className="text-[10px] text-amber-600 font-semibold">{reservado} reservados</span>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK NOTIFICACIONES
// ─────────────────────────────────────────────────────────────────────────────
export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  detalle: string;
  leida: boolean;
  fecha: string;
  referencia_id?: number;
  ruta?: string;
}

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/notificaciones/`);
      const data = await res.json();
      setNotificaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando notificaciones', e);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30_000);
    return () => clearInterval(interval);
  }, [cargar]);

  const marcarLeida = async (id: number) => {
    await fetch(`${BASE}/notificaciones/${id}/leer/`, { method: 'PATCH' });
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const marcarTodasLeidas = async () => {
    await fetch(`${BASE}/notificaciones/leer-todas/`, { method: 'PATCH' });
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  return { notificaciones, marcarLeida, marcarTodasLeidas, recargar: cargar };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────
function Topbar({ noLeidas }: { noLeidas: number }) {
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
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-amber-100 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="font-serif text-lg font-bold text-amber-700">Pakari Shop</span>
      </div>
      <nav>
        <a href="/" className="text-sm text-stone-500 hover:text-amber-700 font-medium transition px-3 py-1.5 rounded-lg hover:bg-amber-50">
          Inicio
        </a>
      </nav>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
            <span className="text-xl">🔔</span>
            {noLeidas > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                {noLeidas}
              </span>
            )}
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-100 bg-amber-50 hover:bg-amber-100 transition"
          >
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
                <span className="inline-block mt-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  🧵 Artesano
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <span>↩</span> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'catalogo' | 'contable' | 'productos' | 'inventario' | 'pedidos' | 'reportes';

const NAV_ITEMS: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'catalogo', icon: '📋', label: 'Catálogo' },
  { tab: 'contable', icon: '📒', label: 'Contable' },
  { tab: 'productos', icon: '🛍️', label: 'Productos' },
  { tab: 'inventario', icon: '📊', label: 'Inventario' },
  { tab: 'pedidos', icon: '🛒', label: 'Pedidos' },
  { tab: 'reportes', icon: '📈', label: 'Reportes' },
];

function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <aside className="fixed top-16 left-0 bottom-0 z-20 w-40 bg-white border-r border-amber-100 flex flex-col items-center py-8 gap-4 shadow-sm overflow-y-auto">
      {NAV_ITEMS.map(({ tab, icon, label }) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          title={label}
          className={`flex flex-col items-center gap-2 w-24 py-4 rounded-2xl text-center transition
            ${active === tab ? 'bg-amber-600 text-white shadow-md' : 'text-amber-800 hover:bg-amber-50'}`}
        >
          <span className="text-4xl leading-none">{icon}</span>
          <span className={`text-sm font-semibold leading-tight ${active === tab ? 'text-white' : 'text-stone-500'}`}>
            {label}
          </span>
        </button>
      ))}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR NOTIFICACIONES
// ─────────────────────────────────────────────────────────────────────────────
function SidebarNotificaciones({
  notificaciones, marcarLeida, marcarTodasLeidas, onNavegar,
}: {
  notificaciones: Notificacion[];
  marcarLeida: (id: number) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  onNavegar: (tab: Tab) => void;
}) {
  const [detalle, setDetalle] = useState<Notificacion | null>(null);
  const iconoTipo = (tipo: string) =>
    tipo === 'stock' ? '📦' : tipo === 'pedido' ? '🛍️' : '🔔';

  const handleClick = async (n: Notificacion) => {
    await marcarLeida(n.id);
    setDetalle(n);
  };

  return (
    <aside className="fixed top-16 right-0 bottom-0 z-20 w-64 bg-white border-l border-amber-100 flex flex-col shadow-sm">
      <div className="flex items-center justify-between px-5 py-5 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔔</span>
          <span className="font-serif text-base font-bold text-amber-800">Notificaciones</span>
        </div>
        {notificaciones.filter(n => !n.leida).length > 0 && (
          <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {notificaciones.filter(n => !n.leida).length}
          </span>
        )}
      </div>
      {detalle ? (
        <div className="flex-1 overflow-y-auto p-5">
          <button onClick={() => setDetalle(null)}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 mb-4 font-semibold transition">
            ← Volver
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">{iconoTipo(detalle.tipo)}</span>
            <span className="font-semibold text-stone-800 text-sm">{detalle.titulo}</span>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed mb-4">{detalle.detalle}</p>
          <p className="text-xs text-stone-400 mb-5">{detalle.fecha}</p>
          {detalle.ruta && (
            <button
              onClick={() => { onNavegar(detalle.ruta!.replace('/', '') as Tab); setDetalle(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              {detalle.tipo === 'pedido' ? '🛍️ Ir a pedidos' : '📦 Ir a inventario'} →
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-3">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-300">
              <span className="text-5xl">🔕</span>
              <span className="text-sm">Sin notificaciones</span>
            </div>
          ) : (
            <>
              {notificaciones.filter(n => !n.leida).length > 0 && (
                <button onClick={marcarTodasLeidas}
                  className="w-full text-xs text-amber-600 hover:text-amber-800 font-semibold px-5 py-2 text-right transition">
                  Marcar todas como leídas
                </button>
              )}
              {notificaciones.map(n => (
                <button key={n.id} onClick={() => handleClick(n)}
                  className={`w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-amber-50 transition border-b border-amber-50 last:border-0 ${!n.leida ? 'bg-amber-50/60' : ''}`}>
                  <span className="text-2xl mt-0.5 leading-none">{iconoTipo(n.tipo)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-sm font-semibold truncate ${!n.leida ? 'text-stone-800' : 'text-stone-400'}`}>
                        {n.titulo}
                      </span>
                      {!n.leida && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{n.detalle}</p>
                    {n.ruta && (
                      <span className="text-xs text-amber-500 font-semibold mt-1 inline-block">
                        Toca para {n.tipo === 'pedido' ? 'ver el pedido' : 'ver inventario'} →
                      </span>
                    )}
                    <p className="text-xs text-stone-300 mt-1">{n.fecha}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO CATÁLOGO
// ─────────────────────────────────────────────────────────────────────────────
function ModuloCatalogo({ productos, imagenes }: { productos: Producto[]; imagenes: Record<number, string> }) {
  const [visibles, setVisibles] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(productos.map(p => [p.id!, true]))
  );
  const [modalImg, setModalImg] = useState<{ nombre: string; src: string } | null>(null);

  useEffect(() => {
    setVisibles(prev => {
      const next = { ...prev };
      productos.forEach(p => { if (p.id !== undefined && !(p.id in next)) next[p.id] = true; });
      return next;
    });
  }, [productos]);

  const toggleVisible = (id: number) => setVisibles(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-5">
      {modalImg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setModalImg(null)}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', maxWidth: '480px', width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{modalImg.nombre}</span>
              <button onClick={() => setModalImg(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>
            <img src={modalImg.src} alt={modalImg.nombre} style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '0.75rem' }} />
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-4">📋 Productos en catálogo</h2>
        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-base">
            <thead className="bg-amber-50 text-sm uppercase tracking-wider text-amber-900/60">
              <tr>
                {['Código', 'Lote', 'Producto', 'Categoría', 'Precio neto', 'Precio PVP', 'IVA', 'Desc.', 'Stock', 'Imagen', 'Visible'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map(p => {
                const esVisible = visibles[p.id!] ?? true;
                return (
                  <tr key={p.id} className={`border-t border-amber-50 transition ${esVisible ? 'hover:bg-amber-50/50' : 'opacity-40 bg-stone-50'}`}>
                    <td className="px-3 py-3 font-mono text-sm">{p.codigo_barra || '—'}</td>
                    <td className="px-3 py-3 text-sm">{p.lote || '—'}</td>
                    <td className="px-3 py-3 font-semibold">{p.nombre}</td>
                    <td className="px-3 py-3"><Badge color="bg-amber-100 text-amber-800">{p.categoria_nombre ?? '—'}</Badge></td>
                    <td className="px-3 py-3">${Number(p.precio_neto).toLocaleString()}</td>
                    <td className="px-3 py-3">
                      {p.precio_pvp
                        ? <span className="font-semibold text-green-700">${Number(p.precio_pvp).toLocaleString()}</span>
                        : <span className="text-stone-300 text-xs italic">Sin definir</span>}
                    </td>
                    <td className="px-3 py-3">{p.iva}%</td>
                    <td className="px-3 py-3">{p.descuento ? <Badge color="bg-green-100 text-green-700">Sí</Badge> : '—'}</td>
                    <td className="px-3 py-3"><StockBadge p={p} /></td>
                    <td className="px-3 py-3">
                      {imagenes[p.id!] ? (
                        <button onClick={() => setModalImg({ nombre: p.nombre, src: imagenes[p.id!] })} className="relative group">
                          <img src={imagenes[p.id!]} alt={p.nombre} className="w-9 h-9 rounded-lg object-cover border border-amber-200 group-hover:ring-2 group-hover:ring-amber-400 transition cursor-pointer" />
                        </button>
                      ) : (
                        <div className="w-9 h-9 rounded-lg border-2 border-dashed border-amber-200 flex items-center justify-center text-stone-300 text-lg">🖼️</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleVisible(p.id!)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition shadow-sm ${esVisible ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-stone-100 hover:bg-stone-200 text-stone-400'}`}>
                        {esVisible ? '👁️' : '🚫'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {productos.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-6 text-center text-stone-400">Sin productos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO CONTABLE
// ─────────────────────────────────────────────────────────────────────────────
function ModuloContable({ productos }: { productos: Producto[] }) {
  const [selId, setSelId] = useState<number>(productos[0]?.id ?? 0);
  const producto = productos.find(p => p.id === selId);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl shadow-md p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-5">🧾 Detalle de Artículo</h2>
        <Field label="Seleccionar artículo">
          <select className={inputCls} value={selId} onChange={e => setSelId(Number(e.target.value))}>
            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>
        {producto && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Código de barra', value: producto.codigo_barra || '—' },
                { label: 'Lote', value: producto.lote || '—' },
                { label: 'Nombre', value: producto.nombre },
                { label: 'Categoría', value: producto.categoria_nombre ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 min-w-[130px] bg-amber-50 rounded-xl px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-amber-900/60 font-semibold mb-1">{label}</div>
                  <div className="text-sm font-semibold text-stone-800 font-mono">{value}</div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-amber-700 to-amber-500 rounded-2xl p-5 text-white">
              <div className="text-xs uppercase tracking-wider opacity-70 font-semibold mb-3">Resumen de precios</div>
              <div className="flex gap-8 flex-wrap">
                <div>
                  <div className="text-xs opacity-70">Precio + IVA</div>
                  <div className="text-2xl font-serif font-bold">${(producto.precio_con_iva ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                {producto.descuento && (
                  <div>
                    <div className="text-xs opacity-70">Con descuento ({producto.valor_descuento}%)</div>
                    <div className="text-2xl font-serif font-bold text-green-200">${(producto.precio_final ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {productos.length === 0 && <p className="text-sm text-stone-400 mt-4">No hay productos registrados.</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL +STOCK
// ─────────────────────────────────────────────────────────────────────────────
function ModalReposicion({
  producto, onClose, onConfirm,
}: {
  producto: Producto;
  onClose: () => void;
  onConfirm: (cantidad: number, nota: string) => Promise<void>;
}) {
  const [cantidad, setCantidad] = useState(0);
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stockNuevo = producto.cantidad + (cantidad > 0 ? cantidad : 0);
  const superaMaximo = producto.stock_maximo > 0 && stockNuevo > producto.stock_maximo;

  const handleConfirm = async () => {
    if (cantidad <= 0) return setError('La cantidad debe ser mayor a 0.');
    if (superaMaximo) return setError(`Superaría el stock máximo (${producto.stock_maximo}).`);
    setLoading(true);
    try {
      await onConfirm(cantidad, nota);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Error al registrar la reposición.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📦</span>
          <div>
            <h3 className="font-semibold text-stone-800 text-sm">Agregar stock — {producto.nombre}</h3>
            <p className="text-xs text-stone-400">{producto.codigo_barra} · ${Number(producto.precio_neto).toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-3 mb-4 p-3 bg-stone-50 rounded-xl text-xs text-stone-500 flex gap-4">
          <span>Stock actual: <strong className="text-green-700">{producto.cantidad}</strong></span>
          <span>Mín: <strong>{producto.stock_minimo}</strong></span>
          <span>Máx: <strong>{producto.stock_maximo || '—'}</strong></span>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Cantidad a ingresar *</label>
            <input type="number" min={1} value={cantidad || ''}
              onChange={e => { setCantidad(Number(e.target.value)); setError(''); }}
              placeholder="Ej: 5"
              className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
          </div>
          {cantidad > 0 && (
            <div className={`text-xs px-3 py-2 rounded-lg font-medium ${superaMaximo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              Stock resultante: <strong>{stockNuevo} uds.</strong>{superaMaximo && ' — supera el máximo'}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Nota u observación</label>
            <textarea value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Ej: Compra feria artesanal junio 2025" rows={2}
              className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-stone-800 focus:outline-none focus:border-amber-500 resize-none" />
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-500 text-sm font-semibold hover:bg-stone-50 transition">
              Cancelar
            </button>
            <button onClick={handleConfirm} disabled={loading || superaMaximo || cantidad <= 0}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-green-700 to-green-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60">
              {loading ? 'Registrando...' : '✓ Registrar entrada'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO PRODUCTOS
// ─────────────────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  'rojo': '#ff0000', 'verde': '#00ff00', 'azul': '#0000ff',
  'amarillo': '#ffff00', 'naranja': '#ffa500', 'morado': '#800080',
  'rosado': '#ffc0cb', 'rosa': '#ff69b4', 'café': '#a52a2a',
  'cafe': '#a52a2a', 'gris': '#808080', 'negro': '#000000',
  'blanco': '#ffffff', 'dorado': '#c8a96e', 'turquesa': '#40e0d0',
  'azul marino': '#001f5b', 'azul cielo': '#87ceeb',
  'verde oscuro': '#006400', 'verde claro': '#90ee90',
  'rojo oscuro': '#8b0000', 'beige': '#f5f5dc', 'crema': '#fffdd0',
  'lila': '#c8a2c8', 'coral': '#ff7f50', 'salmon': '#fa8072',
  'magenta': '#ff00ff', 'cian': '#00ffff',
};
const HEX_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_MAP).map(([nombre, hex]) => [hex, nombre])
);

function generarCodigo(productos: Producto[]): string {
  const ultimo = productos
    .map(p => p.codigo_barra).filter(c => c?.startsWith('PROD-'))
    .map(c => parseInt(c!.replace('PROD-', '')) || 0)
    .sort((a, b) => b - a)[0] ?? 0;
  return `PROD-${String(ultimo + 1).padStart(4, '0')}`;
}

function generarLote(productos: Producto[]): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const ultimo = productos
    .map(p => p.lote).filter(l => l?.match(/^\d{6}-\d{4}$/))
    .map(l => parseInt(l!.split('-')[1]) || 0)
    .sort((a, b) => b - a)[0] ?? 0;
  return `${anio}${mes}-${String(ultimo + 1).padStart(4, '0')}`;
}

function ModuloProductos({ productos, setProductos, categorias, setCategorias, imagenes, setImagenes }: {
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  categorias: Categoria[];
  setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
  imagenes: Record<number, string>;
  setImagenes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  const [tabLocal, setTabLocal] = useState<'producto' | 'categoria' | 'lista'>('categoria');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  // ✅ ERROR 3 CORREGIDO: modalStockProd como estado dentro del componente
  const [modalStockProd, setModalStockProd] = useState<Producto | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoCatId, setEditandoCatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [archivos, setArchivos] = useState<string[]>([]);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const colorNombreRef = useRef<HTMLInputElement>(null);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500);
  };

  const [prod, setProd] = useState<Omit<Producto, 'id'>>({
    codigo_barra: '', lote: '', nombre: '', categoria: null,
    precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0,
    cantidad: 0, stock_minimo: 0, stock_maximo: 0,
    artesano: ARTESANO_ID, colores: [], maneja_tallas: false, tallas: [],
  });

  useEffect(() => {
    const codigo = generarCodigo(productos);
    const lote = generarLote(productos);
    setProd(prev => ({
      ...prev,
      codigo_barra: prev.codigo_barra || codigo,
      lote: prev.lote || lote,
    }));
  }, [productos]);

  const handleAddProducto = async () => {
    if (!prod.nombre || !prod.precio_neto) return showAlert('Nombre y precio son obligatorios', 'error');
    if (prod.stock_maximo > 0 && prod.stock_minimo > prod.stock_maximo)
      return showAlert('El stock mínimo no puede ser mayor al máximo', 'error');
    if (prod.descuento && (prod.valor_descuento ?? 0) <= 0)
      return showAlert('El porcentaje de descuento debe ser mayor a 0', 'error');

    setLoading(true);
    try {
      if (editandoId !== null) {
        const actualizado = await updateProducto(editandoId, prod);
        setProductos(prev => prev.map(p => p.id === editandoId ? actualizado : p));
        setEditandoId(null);
        showAlert('✓ Producto actualizado correctamente');
      } else {

  const formData = new FormData();
  console.log('imagenFile al guardar:', imagenFile);
  formData.append('codigo_barra', prod.codigo_barra || '');  // ← agregar
  formData.append('lote', prod.lote || ''); 
  formData.append('nombre', prod.nombre);
  formData.append('precio_neto', String(prod.precio_neto));
  formData.append('iva', String(prod.iva));
  formData.append('cantidad', String(prod.cantidad));
  formData.append('stock_minimo', String(prod.stock_minimo));
  formData.append('stock_maximo', String(prod.stock_maximo));
  formData.append('artesano', String(prod.artesano));

  if (prod.categoria) {
    formData.append('categoria', String(prod.categoria));
  }

  formData.append('descuento', String(prod.descuento));
  formData.append('valor_descuento', String(prod.valor_descuento));

  // Obtener imagen seleccionada
  if (imagenFile) {
  formData.append('imagen', imagenFile);
  } 

  const response = await fetch(
    'http://127.0.0.1:8000/api/productos/',
    {
      method: 'POST',
      body: formData,
    }
  );

  const nuevo = await response.json();

  setProductos(prev => [...prev, nuevo]);

  showAlert('✓ Producto creado correctamente');
}
      const nuevoCodigo = generarCodigo(productos);
      const nuevoLote = generarLote(productos);
      setProd({
        codigo_barra: nuevoCodigo, lote: nuevoLote, nombre: '', categoria: null,
        precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0,
        cantidad: 0, stock_minimo: 0, stock_maximo: 0,
        artesano: ARTESANO_ID, colores: [], maneja_tallas: false, tallas: [],
      });
    } catch (err: any) {
      showAlert(`Error: ${err?.message ?? 'Error desconocido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProducto = (id: number) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    setEditandoId(id);
    setProd({
      codigo_barra: producto.codigo_barra, lote: producto.lote,
      nombre: producto.nombre, categoria: producto.categoria,
      precio_neto: producto.precio_neto, iva: producto.iva,
      descuento: producto.descuento, valor_descuento: producto.valor_descuento,
      cantidad: producto.cantidad, stock_minimo: producto.stock_minimo,
      stock_maximo: producto.stock_maximo, artesano: ARTESANO_ID,
      colores: producto.colores ?? [], maneja_tallas: producto.maneja_tallas ?? false,
      tallas: producto.tallas ?? [],
    });
    setTabLocal('producto');
  };

  const [cat, setCat] = useState({ nombre: '', descripcion: '' });

  const handleAddCategoria = async () => {
    if (!cat.nombre) return showAlert('El nombre es obligatorio', 'error');
    setLoading(true);
    try {
      if (editandoCatId !== null) {
        const actualizada = await updateCategoria(editandoCatId, { ...cat, artesano: ARTESANO_ID });
        setCategorias(prev => prev.map(c => c.id === editandoCatId ? actualizada : c));
        setEditandoCatId(null);
        showAlert('✓ Categoría actualizada correctamente');
      } else {
        const nueva = await createCategoria({ ...cat, artesano: ARTESANO_ID });
        setCategorias(prev => [...prev, nueva]);
        showAlert('✓ Categoría creada correctamente');
      }
      setCat({ nombre: '', descripcion: '' });
    } catch {
      showAlert('Error al guardar la categoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategoria = (id: number) => {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;
    setEditandoCatId(id);
    setCat({ nombre: categoria.nombre, descripcion: categoria.descripcion });
    setTabLocal('categoria');
  };

  const handleAgregarColor = () => {
    const nombre = colorNombreRef.current?.value.trim() ?? '';
    const hex = colorPickerRef.current?.value ?? '#c8a96e';
    if (!nombre) return;
    setProd(prev => ({ ...prev, colores: [...(prev.colores ?? []), { hex, nombre }] }));
    if (colorNombreRef.current) colorNombreRef.current.value = '';
    if (colorPickerRef.current) colorPickerRef.current.value = '#c8a96e';
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.toLowerCase();
    const nombreConocido = HEX_MAP[hex];
    if (nombreConocido && colorNombreRef.current && colorNombreRef.current.value === '')
      colorNombreRef.current.value = nombreConocido;
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nombre = e.target.value.trim().toLowerCase();
    const hexConocido = COLOR_MAP[nombre];
    if (hexConocido && colorPickerRef.current) colorPickerRef.current.value = hexConocido;
  };

  const tabCls = (t: string) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition ${tabLocal === t ? 'bg-amber-700 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`;

  // ✅ ERROR 3 CORREGIDO: modal DENTRO del return, no fuera
  return (
    <div className="space-y-5">
      {/* Modal +Stock dentro del return */}
      {modalStockProd && (
        <ModalReposicion
          producto={modalStockProd}
          onClose={() => setModalStockProd(null)}

          onConfirm={async (cantidad, nota) => {
            const movimiento = await reponerStock({
              producto: modalStockProd.id!,
              cantidad,
              nota
            });

            setProductos(prev =>
              prev.map(p =>
                p.id === modalStockProd.id
                  ? { ...p, cantidad: movimiento.stock_resultante ?? p.cantidad }
                  : p
              )
            );

          }}
        />
      )}

      {alert && <Alert msg={alert.msg} type={alert.type} />}
      <div className="flex gap-3 flex-wrap">
        <button className={tabCls('categoria')} onClick={() => setTabLocal('categoria')}>🏷️ Nueva Categoría</button>
        <button className={tabCls('producto')} onClick={() => setTabLocal('producto')}>➕ Nuevo Producto</button>
        <button className={tabCls('lista')} onClick={() => setTabLocal('lista')}>📋 Ver todo</button>
      </div>

      {tabLocal === 'producto' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm p-6">
  <h2 className="font-serif text-xl text-amber-800 mb-4">📂 Seleccionar Imagen</h2>
  <div
    onClick={() => document.getElementById('input-imagen')?.click()}
    className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-xl p-8 cursor-pointer hover:bg-amber-50 transition text-stone-500"
  >
    <span className="text-4xl mb-2">🖼️</span>
    <p className="text-sm">
      {archivos.length > 0 ? archivos[0] : 'Arrastra imágenes o haz clic para seleccionar'}
    </p>
    <span className="text-xs opacity-60 mt-1">JPG, PNG — máx. 10 MB</span>
    {imagenFile && (
      <img
        src={URL.createObjectURL(imagenFile)}
        className="mt-3 h-24 w-24 object-cover rounded-xl border border-amber-200"
      />
    )}
  </div>
  <input
    id="input-imagen"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={e => {
      const file = e.target.files?.[0];
      if (file) {
        console.log('✅ Imagen seleccionada:', file.name);
        setImagenFile(file);
        setArchivos([file.name]);
      }
    }}
  />
</div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-5">
              {editandoId ? '✏️ Editar Producto' : '➕ Crear Producto'}
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">🔖 Identificación</p>
                <div className="flex flex-wrap gap-4">
                  <Field label="Código de barra / QR">
                    <input className={`${inputCls} bg-amber-100 cursor-not-allowed`} value={prod.codigo_barra || ''} readOnly />
                  </Field>
                  <Field label="Lote">
                    <input className={`${inputCls} bg-amber-100 cursor-not-allowed`} value={prod.lote || ''} readOnly />
                  </Field>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Field label="Nombre *">
                  <input className={inputCls} value={prod.nombre}
                    onChange={e => setProd({ ...prod, nombre: e.target.value })} placeholder="Ej: Mochila wayuu" />
                </Field>
                <Field label="Categoría">
                  <select className={inputCls} value={prod.categoria ?? ''}
                    onChange={e => setProd({ ...prod, categoria: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">— Seleccionar —</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </Field>
              </div>

              <div className="flex flex-wrap gap-4">
                <Field label="Precio neto *">
                  <input className={inputCls} type="number" min="0" value={prod.precio_neto || ''}
                    onChange={e => setProd({ ...prod, precio_neto: Number(e.target.value) })} placeholder="0" />
                </Field>
                <Field label="IVA (%)">
                  <select className={inputCls} value={prod.iva}
                    onChange={e => setProd({ ...prod, iva: Number(e.target.value) })}>
                    <option value={0}>0% — Excluido</option>
                    <option value={5}>5%</option>
                    <option value={19}>19%</option>
                  </select>
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={prod.descuento}
                  onChange={e => setProd({ ...prod, descuento: e.target.checked, valor_descuento: 0 })}
                  className="w-4 h-4 accent-orange-600" />
                <span>¿Obtiene descuento?</span>
              </label>
              {prod.descuento && (
                <Field label="Porcentaje de descuento (%) *">
                  <input className={inputCls} type="number" min="1" max="99"
                    value={prod.valor_descuento || ''}
                    onChange={e => setProd({ ...prod, valor_descuento: Number(e.target.value) })} placeholder="Ej: 10" />
                </Field>
              )}

              {/* Control de stock — bloqueado si se está editando */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">📦 Control de stock</p>
                <div className="flex flex-wrap gap-4">
                  {editandoId ? (
                    // Al editar: stock actual bloqueado, mín y máx editables
                    <>
                      <div className="flex-1 min-w-[120px] bg-amber-100 rounded-xl px-4 py-3 border border-amber-200">
                        <div className="text-xs uppercase tracking-wider text-amber-700/60 font-semibold mb-1">Stock actual (solo lectura)</div>
                        <div className="text-lg font-bold text-stone-600">{prod.cantidad} uds.</div>
                        <div className="text-xs text-stone-400 mt-1">Usa el botón + Stock para reponer</div>
                      </div>
                      <Field label="Stock mínimo">
                        <input className={inputCls} type="number" min="0" value={prod.stock_minimo || ''}
                          onChange={e => setProd({ ...prod, stock_minimo: Number(e.target.value) })} />
                      </Field>
                      <Field label="Stock máximo">
                        <input className={inputCls} type="number" min="0" value={prod.stock_maximo || ''}
                          onChange={e => setProd({ ...prod, stock_maximo: Number(e.target.value) })} />
                      </Field>
                    </>
                  ) : (
                    // Al crear: todos editables
                    <>
                      <Field label="Cantidad inicial">
                        <input className={inputCls} type="number" min="0" value={prod.cantidad || ''}
                          onChange={e => setProd({ ...prod, cantidad: Number(e.target.value) })} placeholder="0" />
                        <span className="text-xs text-stone-400">Solo para el primer registro</span>
                      </Field>
                      <Field label="Stock mínimo">
                        <input className={inputCls} type="number" min="0" value={prod.stock_minimo || ''}
                          onChange={e => setProd({ ...prod, stock_minimo: Number(e.target.value) })} placeholder="0" />
                      </Field>
                      <Field label="Stock máximo">
                        <input className={inputCls} type="number" min="0" value={prod.stock_maximo || ''}
                          onChange={e => setProd({ ...prod, stock_maximo: Number(e.target.value) })} placeholder="0" />
                      </Field>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={handleAddProducto} disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60">
                  {loading ? 'Guardando...' : editandoId ? 'Actualizar producto' : 'Guardar producto'}
                </button>
                <button onClick={() => {
                  setEditandoId(null);
                  setProd({
                    codigo_barra: generarCodigo(productos), lote: generarLote(productos),
                    nombre: '', categoria: null, precio_neto: 0, iva: 0,
                    descuento: false, valor_descuento: 0, cantidad: 0,
                    stock_minimo: 0, stock_maximo: 0, artesano: ARTESANO_ID,
                    colores: [], maneja_tallas: false, tallas: [],
                  });
                }} className="px-5 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition">
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabLocal === 'categoria' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-serif text-xl text-amber-800 mb-5">🏷️ {editandoCatId ? 'Editar' : 'Crear'} Categoría</h2>
          <div className="space-y-4">
            <Field label="Nombre *">
              <input className={inputCls} value={cat.nombre}
                onChange={e => setCat({ ...cat, nombre: e.target.value })} placeholder="Ej: Bisutería" />
            </Field>
            <Field label="Descripción">
              <textarea className={`${inputCls} min-h-[80px] resize-y`} value={cat.descripcion}
                onChange={e => setCat({ ...cat, descripcion: e.target.value })} placeholder="Descripción breve..." />
            </Field>
            <button onClick={handleAddCategoria} disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60">
              {loading ? 'Guardando...' : editandoCatId ? 'Actualizar categoría' : 'Guardar categoría'}
            </button>
          </div>
        </div>
      )}

      {tabLocal === 'lista' && (
        <>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-4">📦 Productos registrados</h2>
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                  <tr>{['Código', 'Lote', 'Nombre', 'Categoría', 'Precio', 'IVA', 'Desc.', 'Stock', 'Mín.', 'Máx.', 'Acciones'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                      <td className="px-3 py-3 font-mono text-xs">{p.codigo_barra || '—'}</td>
                      <td className="px-3 py-3 text-xs">{p.lote || '—'}</td>
                      <td className="px-3 py-3 font-semibold">{p.nombre}</td>
                      <td className="px-3 py-3"><Badge color="bg-amber-100 text-amber-800">{p.categoria_nombre ?? '—'}</Badge></td>
                      <td className="px-3 py-3">${Number(p.precio_neto).toLocaleString()}</td>
                      <td className="px-3 py-3">{p.iva}%</td>
                      <td className="px-3 py-3">{p.descuento ? <Badge color="bg-green-100 text-green-700">Sí</Badge> : '—'}</td>
                      <td className="px-3 py-3"><StockBadge p={p} /></td>
                      <td className="px-3 py-3 text-xs text-stone-400">{p.stock_minimo}</td>
                      <td className="px-3 py-3 text-xs text-stone-400">{p.stock_maximo}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditProducto(p.id!)}
                            className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition">
                            Editar
                          </button>
                          <button onClick={() => setModalStockProd(p)}
                            className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition">
                            + Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {productos.length === 0 && (
                    <tr><td colSpan={11} className="px-4 py-6 text-center text-stone-400">Sin productos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-4">🏷️ Categorías</h2>
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                  <tr>{['Nombre', 'Descripción', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {categorias.map(c => (
                    <tr key={c.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                      <td className="px-4 py-3 font-semibold">{c.nombre}</td>
                      <td className="px-4 py-3 text-stone-500">{c.descripcion || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleEditCategoria(c.id!)}
                          className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categorias.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-stone-400">Sin categorías</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO INVENTARIO
// ─────────────────────────────────────────────────────────────────────────────
function ModuloInventario({
  productos, kardex, setKardex, setProductos,
}: {
  productos: Producto[];
  kardex: Kardex[];
  setKardex: React.Dispatch<React.SetStateAction<Kardex[]>>;
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
}) {
  const [form, setForm] = useState({
    producto: productos[0]?.id ?? 0,
    fecha: '',
    cantidad: '',
    precio_pvp: '',
    nota: '',
  });

  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalProd, setModalProd] = useState<Producto | null>(null);
  const [resumen, setResumen] = useState<ResumenInventario | null>(null);

  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
    tipo: 'todos',
    origen: 'todos',
    producto: 'todos',
  });

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  useEffect(() => {
    getResumenInventario().then(setResumen).catch(() => { });
  }, [kardex]);

  const productoSeleccionado = productos.find(p => p.id === form.producto);

  // ── Registrar entrada manual ────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.producto || !form.fecha)
      return showAlert('Producto y fecha son obligatorios', 'error');

    const cantidad = parseInt(form.cantidad);
    if (!cantidad || cantidad <= 0)
      return showAlert('La cantidad debe ser mayor a 0', 'error');

    setLoading(true);
    try {
      const nuevo = await createKardex({
        producto: form.producto,
        cantidad,
        fecha: form.fecha,
        nota: form.nota,
        ...(form.precio_pvp ? { precio_pvp: parseFloat(form.precio_pvp) } : {}),
      });
      setKardex(prev => [nuevo, ...prev]);

      if (nuevo.stock_resultante !== undefined) {
        setProductos(prev =>
          prev.map(p =>
            p.id === form.producto
              ? {
                ...p,
                cantidad: nuevo.stock_resultante!,
                // Actualizar precio_pvp si se envió
                ...(form.precio_pvp ? { precio_pvp: parseFloat(form.precio_pvp) } : {}),
              }
              : p
          )
        );
      }

      setForm({ producto: productos[0]?.id ?? 0, fecha: '', cantidad: '', precio_pvp: '', nota: '' });
      showAlert('✓ Entrada registrada correctamente');
    } catch (err: any) {
      let msg = 'Error al registrar el movimiento';
      try { msg = JSON.parse(err?.message ?? '').error ?? msg; } catch { msg = err?.message ?? msg; }
      showAlert(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReposicion = async (cantidad: number, nota: string) => {
    if (!modalProd?.id) return;
    const movimiento = await reponerStock({ producto: modalProd.id, cantidad, nota });
    setKardex(prev => [movimiento, ...prev]);
    setProductos(prev =>
      prev.map(p =>
        p.id === modalProd.id
          ? { ...p, cantidad: movimiento.stock_resultante ?? p.cantidad }
          : p
      )
    );
    showAlert(`✓ Entrada registrada — nuevo stock: ${movimiento.stock_resultante}`);
  };

  // ── Filtros ─────────────────────────────────────────────────────────────
  const kardexFiltrado = kardex.filter(k => {
    if (filtros.desde && k.fecha < filtros.desde) return false;
    if (filtros.hasta && k.fecha > filtros.hasta) return false;
    if (filtros.tipo !== 'todos' && (k.tipo as string).toLowerCase() !== filtros.tipo) return false;
    if (filtros.origen !== 'todos' && (k as any).origen !== filtros.origen) return false;
    if (filtros.producto !== 'todos' && String(k.producto) !== filtros.producto) return false;
    return true;
  });

  // ── Valor movido ($) calculado ──────────────────────────────────────────
  const valorMovido = resumen?.valor_movido ?? 0;

  const labelCls = "block text-[10px] font-semibold tracking-widest uppercase text-stone-500 mb-1";
  const inputCls =
    "w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition";

  return (
    <div className="space-y-5 font-sans">

      {modalProd && (
        <ModalReposicion
          producto={modalProd}
          onClose={() => setModalProd(null)}
          onConfirm={handleReposicion}
        />
      )}

      {alert && <Alert msg={alert.msg} type={alert.type} />}

      {/* ── TARJETAS RESUMEN ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-stone-400 mb-1">Total Entradas</p>
          <p className="text-2xl font-bold text-green-600">+{resumen?.total_entradas ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-stone-400 mb-1">Total Salidas</p>
          <p className="text-2xl font-bold text-red-500">-{resumen?.total_salidas ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-stone-400 mb-1">Balance Neto</p>
          <p className="text-2xl font-bold text-stone-700">{resumen?.balance_neto ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-stone-400 mb-1">Valor Movido ($)</p>
          <p className="text-xl font-bold text-stone-700">
            ${valorMovido.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* ── FORMULARIO ENTRADA MANUAL ── */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
        <h2 className="font-serif text-lg text-amber-800 font-semibold mb-1 flex items-center gap-2">
          📦 Registrar entrada de mercancía
        </h2>
        <p className="text-xs text-stone-400 mb-5">
          El sistema registra automáticamente el tipo, subtipo y quién lo registró.
        </p>

        <div className="space-y-4">
          {/* Producto */}
          <div>
            <label className={labelCls}>Producto</label>
            <select
              className={inputCls}
              value={form.producto}
              onChange={e => setForm({ ...form, producto: Number(e.target.value) })}
            >
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} [PROD-{String(p.id).padStart(4, '0')}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Cantidad */}
            <div className="flex-1 min-w-[140px]">
              <label className={labelCls}>Cantidad <span className="text-red-400">*</span></label>
              <input
                type="number"
                min={1}
                className={inputCls}
                placeholder="Ej: 10"
                value={form.cantidad}
                onChange={e => setForm({ ...form, cantidad: e.target.value })}
              />
            </div>

            {/* Precio PVP */}
            <div className="flex-1 min-w-[140px]">
              <label className={labelCls}>
                Precio venta al público ($)
                {productoSeleccionado?.precio_pvp && (
                  <span className="ml-1 text-amber-500 normal-case font-normal">
                    actual: ${Number(productoSeleccionado.precio_pvp).toLocaleString()}
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0}
                className={inputCls}
                placeholder={
                  productoSeleccionado?.precio_pvp
                    ? String(productoSeleccionado.precio_pvp)
                    : 'Ej: 25000'
                }
                value={form.precio_pvp}
                onChange={e => setForm({ ...form, precio_pvp: e.target.value })}
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Déjalo vacío para mantener el precio actual del producto
              </span>
            </div>

            {/* Fecha */}
            <div className="flex-1 min-w-[140px]">
              <label className={labelCls}>Fecha <span className="text-red-400">*</span></label>
              <input
                type="date"
                className={inputCls}
                value={form.fecha}
                onChange={e => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
          </div>

          {/* Nota */}
          <div>
            <label className={labelCls}>Nota u observación</label>
            <input
              className={inputCls}
              placeholder="Ej: Compra feria artesanal mayo 2026"
              value={form.nota}
              onChange={e => setForm({ ...form, nota: e.target.value })}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold transition"
          >
            {loading ? 'Guardando...' : '✓ Registrar entrada'}
          </button>
        </div>
      </div>

      {/* ── STOCK DEL PRODUCTO ── */}
      {productoSeleccionado && (() => {
        const reservado = productoSeleccionado.cantidad_reservada ?? 0;
        const disponible = productoSeleccionado.cantidad - reservado;
        const bajo = disponible <= productoSeleccionado.stock_minimo;
        const alto = productoSeleccionado.stock_maximo > 0 && disponible >= productoSeleccionado.stock_maximo;

        return (
          <div className={`bg-white rounded-xl border p-5 ${bajo ? 'border-red-200' : alto ? 'border-blue-200' : 'border-amber-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-stone-700">
                  📦 Stock de &quot;{productoSeleccionado.nombre.toUpperCase()}&quot;{' '}
                  <span className="text-xs font-normal text-stone-400">(solo lectura)</span>
                </p>
                {bajo && (
                  <p className="text-xs text-red-500 font-semibold mt-0.5">⚠️ Stock disponible por debajo del mínimo</p>
                )}
                {alto && (
                  <p className="text-xs text-blue-500 font-semibold mt-0.5">📦 Stock en máximo</p>
                )}
              </div>
              <button
                onClick={() => setModalProd(productoSeleccionado)}
                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold rounded-lg transition"
              >
                + Stock
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: 'Stock Total', value: productoSeleccionado.cantidad, color: 'text-stone-700' },
                { label: 'Reservado', value: reservado, color: 'text-amber-600' },
                { label: 'Disponible', value: disponible, color: bajo ? 'text-red-600' : 'text-green-600' },
                { label: 'Mínimo', value: productoSeleccionado.stock_minimo, color: 'text-stone-400' },
                { label: 'Máximo', value: productoSeleccionado.stock_maximo || '—', color: 'text-stone-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-stone-50 rounded-lg py-3 border border-stone-100">
                  <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Barra de stock visual */}
            {productoSeleccionado.stock_maximo > 0 && (
              <div className="mt-3">
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${bajo ? 'bg-red-400' : alto ? 'bg-blue-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(100, (disponible / productoSeleccionado.stock_maximo) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-stone-300 mt-0.5">
                  <span>0</span>
                  <span>{productoSeleccionado.stock_maximo}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── HISTORIAL ── */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
        <h2 className="font-serif text-lg text-amber-800 font-semibold mb-4 flex items-center gap-2">
          📊 Historial de movimientos
        </h2>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-stone-500">
          <span className="font-semibold">FILTRAR:</span>
          <span>Desde</span>
          <input type="date"
            className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-300"
            value={filtros.desde} onChange={e => setFiltros({ ...filtros, desde: e.target.value })} />
          <span>Hasta</span>
          <input type="date"
            className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-300"
            value={filtros.hasta} onChange={e => setFiltros({ ...filtros, hasta: e.target.value })} />

          <select className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none"
            value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="todos">Tipo: todos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="devolucion">Devolución</option>
            <option value="ajuste">Ajuste</option>
          </select>

          <select className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none"
            value={filtros.origen} onChange={e => setFiltros({ ...filtros, origen: e.target.value })}>
            <option value="todos">Origen: todos</option>
            <option value="manual">Manual</option>
            <option value="automatico">Automático</option>
          </select>

          <select className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none"
            value={filtros.producto} onChange={e => setFiltros({ ...filtros, producto: e.target.value })}>
            <option value="todos">Producto: todos</option>
            {productos.map(p => (
              <option key={p.id} value={String(p.id)}>{p.nombre}</option>
            ))}
          </select>

          {/* Botón limpiar filtros */}
          {Object.values(filtros).some(v => v !== 'todos' && v !== '') && (
            <button
              onClick={() => setFiltros({ desde: '', hasta: '', tipo: 'todos', origen: 'todos', producto: 'todos' })}
              className="px-2 py-1 rounded-lg bg-stone-100 text-stone-500 text-xs hover:bg-stone-200 transition"
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-[10px] font-semibold uppercase tracking-widest text-amber-900/60">
              <tr>
                <th className="px-3 py-3 text-left">Fecha</th>
                <th className="px-3 py-3 text-left">Producto</th>
                <th className="px-3 py-3 text-left">Tipo</th>
                <th className="px-3 py-3 text-left">Subtipo</th>
                <th className="px-3 py-3 text-left">Origen</th>
                <th className="px-3 py-3 text-left">Cant.</th>
                <th className="px-3 py-3 text-left">Stock Result.</th>
                <th className="px-3 py-3 text-left">PVP Unit.</th>
                <th className="px-3 py-3 text-left">Pedido ref.</th>
                <th className="px-3 py-3 text-left">Registrado por</th>
                <th className="px-3 py-3 text-left">Nota</th>
              </tr>
            </thead>
            <tbody>
              {kardexFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-stone-400 text-sm">
                    Sin movimientos
                  </td>
                </tr>
              ) : (
                kardexFiltrado.map(k => (
                  <tr key={k.id} className="border-t border-amber-50 hover:bg-amber-50/50 transition">
                    <td className="px-3 py-3 text-stone-500 whitespace-nowrap">{k.fecha}</td>
                    <td className="px-3 py-3 font-semibold text-stone-800">{k.producto_nombre}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(k.tipo as string).toLowerCase() === 'entrada' ? 'bg-green-100 text-green-700' :
                        (k.tipo as string).toLowerCase() === 'salida' ? 'bg-red-100 text-red-600' :
                          (k.tipo as string).toLowerCase() === 'devolucion' ? 'bg-blue-100 text-blue-600' :
                            'bg-stone-100 text-stone-500'
                        }`}>
                        {k.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-stone-500 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-100">
                        {(k as any).subtipo ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${(k as any).origen === 'automatico'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-amber-50 text-amber-600'
                        }`}>
                        {(k as any).origen === 'automatico' ? '⚡ auto' : '✍️ manual'}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-stone-800">{k.cantidad}</td>
                    <td className="px-3 py-3 font-semibold text-green-700">{k.stock_resultante}</td>
                    <td className="px-3 py-3 text-stone-600">
                      {(k as any).precio_unitario
                        ? `$${Number((k as any).precio_unitario).toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-stone-400 font-mono">
                      {(k as any).pedido_ref ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-stone-400">
                      {(k as any).creado_por ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-stone-400">{k.nota ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Contador de resultados */}
        <p className="text-xs text-stone-400 mt-2">
          {kardexFiltrado.length} movimiento{kardexFiltrado.length !== 1 ? 's' : ''}
          {kardexFiltrado.length !== kardex.length && ` de ${kardex.length} total`}
        </p>
      </div>
    </div>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface DetallePedido {
  id: number;
  producto: number;
  producto_nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}
 
interface Pedido {
  id: number;
  codigo: string;
  cliente: number;
  cliente_nombre: string;
  artesano: number;
  artesano_nombre: string;
  estado: string;
  total: number;
  direccion: string;
  telefono: string;
  fecha: string;
  updated: string;
  detalles: DetallePedido[];
}
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
const ESTADO_COLOR: Record<string, string> = {
  Pendiente:              'bg-yellow-100 text-yellow-700',
  'En proceso':           'bg-orange-100 text-orange-700',
  Enviado:                'bg-blue-100   text-blue-700',
  Entregado:              'bg-green-100  text-green-700',
  Cancelado:              'bg-red-100    text-red-700',
  Devolucion:             'bg-purple-100 text-purple-700',
  'Devolucion solicitada':'bg-purple-100 text-purple-700',
  Devuelto:               'bg-teal-100   text-teal-700',
  Rechazado:              'bg-red-200    text-red-800',
};
 
const ESTADO_ICONO: Record<string, string> = {
  Pendiente:              '🕐',
  'En proceso':           '⚙️',
  Enviado:                '🚚',
  Entregado:              '✅',
  Cancelado:              '❌',
  Devolucion:             '↩️',
  'Devolucion solicitada':'🔄',
  Devuelto:               '↩️',
  Rechazado:              '🚫',
};
 
/** Transiciones que el artesano puede hacer desde cada estado */
const SIGUIENTES: Record<string, string[]> = {
  Pendiente:              ['En proceso', 'Enviado', 'Cancelado'],
  'En proceso':           ['Enviado', 'Cancelado'],
  Enviado:                ['Entregado', 'Cancelado'],
  Entregado:              ['Devolucion'],
  'Devolucion solicitada':['Devuelto', 'Rechazado'],
  Cancelado:              [],
  Devolucion:             [],
  Devuelto:               [],
  Rechazado:              [],
};
 
const BTN_COLOR: Record<string, string> = {
  'En proceso': 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  Enviado:      'bg-blue-100   text-blue-700   hover:bg-blue-200',
  Entregado:    'bg-green-100  text-green-700  hover:bg-green-200',
  Cancelado:    'bg-red-100    text-red-700    hover:bg-red-200',
  Devolucion:   'bg-purple-100 text-purple-700 hover:bg-purple-200',
  Devuelto:     'bg-teal-100   text-teal-700   hover:bg-teal-200',
  Rechazado:    'bg-red-200    text-red-800    hover:bg-red-300',
};
 
const MENSAJES_ESTADO: Record<string, string> = {
  'En proceso': '⚙️ Pedido en preparación',
  Enviado:      '🚚 Pedido marcado como enviado',
  Entregado:    '✅ Entregado — stock descontado',
  Cancelado:    '❌ Cancelado — stock liberado',
  Devolucion:   '↩️ Devolución registrada — stock repuesto',
  Devuelto:     '↩️ Devolución aprobada — stock repuesto',
  Rechazado:    '🚫 Devolución rechazada',
};
 
// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO PEDIDOS (simulado, pendiente de backend)
// ─────────────────────────────────────────────────────────────────────────────
function ModuloPedidosArtesano({
  productos,
  setProductos,
}: {
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
}) {
  const [pedidos,      setPedidos]      = useState<Pedido[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingId,    setLoadingId]    = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda,     setBusqueda]     = useState('');
  const [alert,        setAlert]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
 
  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };
 
  // ── Obtener ID del artesano desde localStorage (igual que el AuthContext) ──
  const artesanoId = ARTESANO_ID;
 
  // ── Cargar pedidos desde el backend ────────────────────────────────────────
  const fetchPedidos = useCallback(async () => {
    if (!artesanoId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res   = await fetch(`${BASE}/inventario/pedidos/artesano/${artesanoId}/`, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (!res.ok) throw new Error('Error al cargar pedidos');
      const data: Pedido[] = await res.json();
      setPedidos(data);
    } catch (e) {
      showAlert('No se pudieron cargar los pedidos', 'error');
    } finally {
      setLoading(false);
    }
  }, [artesanoId]);
 
  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);
 
  // ── Cambiar estado ──────────────────────────────────────────────────────────
  const actualizarEstado = async (pedido: Pedido, estadoNuevo: string) => {
    if (pedido.estado === estadoNuevo) return;
    setLoadingId(pedido.id);
 
    try {
      const token = localStorage.getItem('token') ?? '';
      const res   = await fetch(`${BASE}/inventario/pedido/estado/`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pedido_id:   pedido.id,
          estado_nuevo: estadoNuevo,
        }),
      });
 
      const data = await res.json();
 
      if (!res.ok) {
        showAlert(data.error ?? 'Error al actualizar el pedido', 'error');
        return;
      }
 
      // Actualizar estado del pedido en el frontend
      setPedidos(prev =>
        prev.map(p => p.id === pedido.id ? { ...p, estado: estadoNuevo } : p)
      );
 
      // Actualizar stock de los productos afectados en el frontend
      if (data.stock_actual !== undefined) {
        // El backend devuelve el stock del primer producto; actualizamos todos
        // los productos del pedido de forma optimista usando los detalles
        const productosAfectados = new Set(pedido.detalles.map(d => d.producto));
        setProductos(prev =>
          prev.map(p => {
            if (!p.id || !productosAfectados.has(p.id)) return p;
            // Si el backend devuelve el valor exacto (solo primer producto),
            // lo usamos; si no, recalculamos de forma conservadora
            if (pedido.detalles.length === 1 || pedido.detalles[0].producto === p.id) {
              return {
                ...p,
                cantidad:           data.stock_actual    ?? p.cantidad,
                cantidad_reservada: data.stock_reservado ?? p.cantidad_reservada ?? 0,
              };
            }
            return p;
          })
        );
      }
 
      showAlert(MENSAJES_ESTADO[estadoNuevo] ?? 'Estado actualizado');
    } catch {
      showAlert('Error de conexión con el servidor', 'error');
    } finally {
      setLoadingId(null);
    }
  };
 
  // ── Filtros ─────────────────────────────────────────────────────────────────
  const pedidosFiltrados = pedidos.filter(p => {
    const matchEstado   = filtroEstado === '' || p.estado === filtroEstado;
    const q             = busqueda.toLowerCase();
    const matchBusqueda = q === ''
      || p.cliente_nombre.toLowerCase().includes(q)
      || p.codigo.toLowerCase().includes(q)
      || p.detalles.some(d => d.producto_nombre.toLowerCase().includes(q));
    return matchEstado && matchBusqueda;
  });
 
  const inputCls =
    'px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 ' +
    'focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';
 
  // ── Resumen rápido ──────────────────────────────────────────────────────────
  const resumen = {
    total:     pedidos.length,
    pendiente: pedidos.filter(p => p.estado === 'Pendiente').length,
    enviado:   pedidos.filter(p => p.estado === 'Enviado').length,
    entregado: pedidos.filter(p => p.estado === 'Entregado').length,
  };
 
  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {alert && <Alert msg={alert.msg} type={alert.type} />}
 
      {/* Encabezado */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-amber-800">🛒 Gestión de Pedidos</h2>
          <p className="text-stone-500 text-sm mt-1">
            Los cambios de estado actualizan el inventario automáticamente
          </p>
        </div>
        <button
          onClick={fetchPedidos}
          title="Actualizar"
          className="p-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
 
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: resumen.total,     color: 'text-stone-700',  bg: 'bg-stone-50'  },
          { label: 'Pendiente', value: resumen.pendiente, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Enviado',   value: resumen.enviado,   color: 'text-blue-700',   bg: 'bg-blue-50'   },
          { label: 'Entregado', value: resumen.entregado, color: 'text-green-700',  bg: 'bg-green-50'  },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl border border-amber-100 p-4 text-center`}>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-stone-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
 
      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Buscar cliente, código o producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className={`${inputCls} flex-1 min-w-[200px]`}
          />
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className={inputCls}
          >
            <option value="">Todos los estados</option>
            <option>Pendiente</option>
            <option>En proceso</option>
            <option>Enviado</option>
            <option>Entregado</option>
            <option>Cancelado</option>
            <option>Devolucion solicitada</option>
            <option>Devuelto</option>
            <option>Rechazado</option>
          </select>
        </div>
      </div>
 
      {/* Leyenda de flujo */}
      <div className="bg-amber-50 rounded-xl border border-amber-100 px-5 py-3 text-xs text-amber-800 flex flex-wrap gap-3 items-center">
        <span className="font-semibold">Flujo:</span>
        <span>🕐 Pendiente → reserva stock</span>
        <span>→</span>
        <span>✅ Entregado → descuenta stock real</span>
        <span>|</span>
        <span>❌ Cancelado → libera reserva</span>
        <span>|</span>
        <span>↩️ Devolución → repone stock</span>
      </div>
 
      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-amber-800">📋 Lista de pedidos</h2>
          <span className="text-xs text-stone-400">
            {pedidosFiltrados.length} de {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
          </span>
        </div>
 
        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-amber-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-amber-100">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                <tr>
                  {['Código','Cliente','Productos','Total','Estado','Fecha','Cambiar estado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-stone-400">
                      {pedidos.length === 0
                        ? 'Aún no tienes pedidos'
                        : 'No hay pedidos con los filtros aplicados'}
                    </td>
                  </tr>
                ) : pedidosFiltrados.map(pedido => {
                  const siguientes = SIGUIENTES[pedido.estado] ?? [];
                  const isLoading  = loadingId === pedido.id;
 
                  return (
                    <tr key={pedido.id} className="border-t border-amber-50 hover:bg-amber-50/50 transition-colors">
                      {/* Código */}
                      <td className="px-4 py-3 font-mono text-xs text-stone-500 whitespace-nowrap">
                        {pedido.codigo}
                      </td>
 
                      {/* Cliente */}
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        {pedido.cliente_nombre}
                        {pedido.telefono && (
                          <div className="text-xs text-stone-400 font-normal">{pedido.telefono}</div>
                        )}
                      </td>
 
                      {/* Productos */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="truncate text-stone-700">
                          {pedido.detalles.map(d => `${d.producto_nombre} x${d.cantidad}`).join(', ')}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {pedido.detalles.length} {pedido.detalles.length === 1 ? 'producto' : 'productos'}
                        </div>
                      </td>
 
                      {/* Total */}
                      <td className="px-4 py-3 font-semibold text-green-700 whitespace-nowrap">
                        ${Number(pedido.total).toLocaleString('es-CO')}
                      </td>
 
                      {/* Estado */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_COLOR[pedido.estado] ?? 'bg-gray-100 text-gray-700'}`}>
                          {ESTADO_ICONO[pedido.estado] ?? '•'} {pedido.estado}
                        </span>
                      </td>
 
                      {/* Fecha */}
                      <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">
                        {new Date(pedido.fecha).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
 
                      {/* Acciones */}
                      <td className="px-4 py-3">
                        {siguientes.length > 0 ? (
                          <div className="flex gap-2 flex-wrap">
                            {siguientes.map(sig => (
                              <button
                                key={sig}
                                disabled={isLoading}
                                onClick={() => actualizarEstado(pedido, sig)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60 whitespace-nowrap ${BTN_COLOR[sig] ?? 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                              >
                                {isLoading ? (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3 animate-spin" /> ...
                                  </span>
                                ) : (
                                  `→ ${sig}`
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-stone-300">Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO REPORTES
// ─────────────────────────────────────────────────────────────────────────────
function ModuloReportes({ productos, kardex }: { productos: Producto[]; kardex: Kardex[] }) {
  const [tabReporte, setTabReporte] = useState<'ventas' | 'inventario' | 'productos' | 'contable'>('ventas');

  const totalProductos = productos.length;
  const stockBajo = productos.filter(p => p.cantidad <= p.stock_minimo).length;
  const totalEntradas = kardex.filter(k => k.tipo === 'Entrada' || k.tipo === 'Devolucion').reduce((a, k) => a + k.cantidad, 0);
  const totalSalidas = kardex.filter(k => k.tipo === 'Salida' || k.tipo === 'Ajuste').reduce((a, k) => a + k.cantidad, 0);

  const tabCls = (t: string) =>
    `px-5 py-2 rounded-xl text-sm font-semibold transition ${tabReporte === t ? 'bg-amber-700 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`;

  const BotonesDescarga = ({ tipo }: { tipo: string }) => (
    <div className="flex gap-2">
      <button onClick={() => descargarReporte(tipo, 'excel', ARTESANO_ID)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition">
        📊 Excel
      </button>
      <button onClick={() => descargarReporte(tipo, 'pdf', ARTESANO_ID)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition">
        📄 PDF
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-2xl text-amber-800 mb-2">📈 Reportería</h2>
        <p className="text-stone-500 text-sm">Visualiza estadísticas generales del sistema artesanal</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className={tabCls('ventas')} onClick={() => setTabReporte('ventas')}>📈 Ventas</button>
        <button className={tabCls('inventario')} onClick={() => setTabReporte('inventario')}>📦 Inventario</button>
        <button className={tabCls('productos')} onClick={() => setTabReporte('productos')}>🛍️ Productos</button>
        <button className={tabCls('contable')} onClick={() => setTabReporte('contable')}>📒 Contable</button>
      </div>

      {tabReporte === 'inventario' && (
        <div className="space-y-5">
          <div className="flex justify-end"><BotonesDescarga tipo="inventario" /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-amber-100">
              <p className="text-xs uppercase tracking-wider text-amber-700 font-bold">Productos registrados</p>
              <h3 className="text-3xl font-bold text-amber-900 mt-3">{totalProductos}</h3>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-red-100">
              <p className="text-xs uppercase tracking-wider text-red-700 font-bold">Stock bajo</p>
              <h3 className="text-3xl font-bold text-red-600 mt-3">{stockBajo}</h3>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-blue-100">
              <p className="text-xs uppercase tracking-wider text-blue-700 font-bold">Movimientos</p>
              <h3 className="text-xl font-bold text-blue-700 mt-3">+{totalEntradas} / -{totalSalidas}</h3>
            </div>
          </div>
        </div>
      )}

      {tabReporte === 'productos' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-amber-800">🛍️ Reporte de productos</h2>
            <BotonesDescarga tipo="productos" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-amber-100">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                <tr>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Precio</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id} className="border-t border-amber-50">
                    <td className="px-4 py-3 font-mono text-xs">{p.codigo_barra}</td>
                    <td className="px-4 py-3 font-semibold">{p.nombre}</td>
                    <td className="px-4 py-3 text-green-700 font-semibold">${Number(p.precio_neto).toLocaleString()}</td>
                    <td className="px-4 py-3">{p.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabReporte === 'ventas' && (
        <div className="space-y-5">
          <div className="flex justify-end"><BotonesDescarga tipo="kardex" /></div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-stone-400 text-sm">Las ventas se calcularán automáticamente cuando el módulo de pedidos esté conectado al backend.</p>
          </div>
        </div>
      )}

      {tabReporte === 'contable' && (
        <div className="space-y-5">
          <div className="flex justify-end"><BotonesDescarga tipo="contable" /></div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-stone-400 text-sm">Los datos contables se calcularán en tiempo real cuando los movimientos de inventario estén conectados.</p>
          </div>
        </div>
      )}
    </div>
  )

}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PerfilArtesano() {
  const ARTESANO_ID = Number(localStorage.getItem('usuario_id') ?? 1);
  const [tab, setTab] = useState<Tab>('catalogo');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [kardex, setKardex] = useState<Kardex[]>([]);
  const [imagenes, setImagenes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { notificaciones, marcarLeida, marcarTodasLeidas } = useNotificaciones();

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, kard] = await Promise.all([
        getProductos(ARTESANO_ID),
        getCategorias(ARTESANO_ID),
        getKardex(),
      ]);
      setProductos(prods);
      setCategorias(cats);
      setKardex(kard);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <div className="min-h-screen bg-amber-50/60 font-sans text-base">
      <Topbar noLeidas={notificaciones.filter(n => !n.leida).length} />
      <Sidebar active={tab} onChange={setTab} />
      <SidebarNotificaciones
        notificaciones={notificaciones}
        marcarLeida={marcarLeida}
        marcarTodasLeidas={marcarTodasLeidas}
        onNavegar={setTab}
      />
      <main className="pt-16 pl-40 pr-64 min-h-screen text-base">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-amber-700 text-sm gap-3">
              <span className="animate-spin text-xl">⏳</span>
              Cargando datos del servidor...
            </div>
          ) : error ? (
            <Alert msg={error} type="error" />
          ) : (
            <>
              {tab === 'catalogo' && <ModuloCatalogo productos={productos} imagenes={imagenes} />}
              {tab === 'contable' && <ModuloContable productos={productos} />}
              {tab === 'productos' && (
                <ModuloProductos
                  productos={productos} setProductos={setProductos}
                  categorias={categorias} setCategorias={setCategorias}
                  imagenes={imagenes} setImagenes={setImagenes}
                />
              )}
              {/* ✅ ERROR 2 CORREGIDO: setProductos ahora se pasa a ModuloInventario */}
              {tab === 'inventario' && (
                <ModuloInventario
                  productos={productos} kardex={kardex}
                  setKardex={setKardex} setProductos={setProductos}
                />
              )}
              {tab === 'pedidos' && (
                <ModuloPedidosArtesano
                  productos={productos}
                  setProductos={setProductos}
                />
              )}
              {tab === 'reportes' && <ModuloReportes productos={productos} kardex={kardex} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}