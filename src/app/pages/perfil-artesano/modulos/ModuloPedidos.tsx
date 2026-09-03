import { useState, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Producto, Kardex, getKardex } from '../../../data/artesanoApi';
import { Pedido } from '../types';
import { generarGuiaEnvio } from '../../../utils/guiaEnvio';

import { API_BASE } from '../../../utils/config';

const BASE = API_BASE;

const inputCls = 'px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => {
  const colors = { success: 'bg-green-100 text-green-800 border-green-200', error: 'bg-red-100 text-red-800 border-red-200' };
  return <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}>{msg}</div>;
};

const SIGUIENTES: Record<string, string[]> = {
  'Pago confirmado': ['Pendiente'],
  'Pendiente': ['En proceso'],
  'En proceso': ['Enviado'],
  'Enviado': ['Entregado'],
  'Entregado': [],
  'Devolucion solicitada': ['Devolucion aprobada', 'Devolucion rechazada'],
  'Cancelado': [],
  'Devolucion aprobada': [],
  'Devolucion rechazada': [],
  'Devuelto': [],
};

const FINALIZADOS = ['Entregado', 'Cancelado', 'Devolucion aprobada', 'Devolucion rechazada', 'Devuelto'];

const BTN_COLOR: Record<string, string> = {
  'Pendiente': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  'En proceso': 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  Enviado: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  Entregado: 'bg-green-100 text-green-700 hover:bg-green-200',
  Cancelado: 'bg-red-100 text-red-700 hover:bg-red-200',
  Devuelto: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
};

const MENSAJES_ESTADO: Record<string, string> = {
  'En proceso': '⚙️ Pedido en preparación',
  Enviado: '🚚 Pedido marcado como enviado',
  Entregado: '✅ Entregado — stock descontado',
  Cancelado: '❌ Cancelado — stock liberado',
  Devolucion: '↩️ Devolución registrada — stock repuesto',
  Devuelto: '↩️ Devolución aprobada — stock repuesto',
  Rechazado: '🚫 Devolución rechazada',
};

interface ModuloPedidosProps {
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  setKardex: React.Dispatch<React.SetStateAction<Kardex[]>>;
}

export function ModuloPedidos({ productos, setProductos, setKardex }: ModuloPedidosProps) {
  const artesanoId = Number(localStorage.getItem('usuario_id') ?? 1);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState<Pedido | null>(null);
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [pestaña, setPestaña] = useState<'pedidos' | 'historial'>('pedidos');

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500);
  };

  const fetchPedidos = useCallback(async () => {
    if (!artesanoId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${BASE}/inventario/pedidos/artesano/${artesanoId}/`, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (!res.ok) throw new Error('Error al cargar pedidos');
      const data: Pedido[] = await res.json();
      setPedidos(data);
    } catch {
      showAlert('No se pudieron cargar los pedidos', 'error');
    } finally {
      setLoading(false);
    }
  }, [artesanoId]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const actualizarEstado = async (pedido: Pedido, estadoNuevo: string) => {
    if (pedido.estado === estadoNuevo) return;
    setLoadingId(pedido.id);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${BASE}/inventario/pedido/estado/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
        body: JSON.stringify({ pedido_id: pedido.id, estado_nuevo: estadoNuevo }),
      });
      const data = await res.json();
      if (!res.ok) { showAlert(data.error ?? 'Error al actualizar el pedido', 'error'); return; }
      if (data.stock_actual !== undefined) {
        const productosAfectados = new Set(pedido.detalles.map(d => d.producto));
        setProductos(prev => prev.map(p => {
          if (!p.id || !productosAfectados.has(p.id)) return p;
          return { ...p, cantidad: data.stock_actual ?? p.cantidad, cantidad_reservada: data.stock_reservado ?? p.cantidad_reservada ?? 0 };
        }));
      }
      showAlert(MENSAJES_ESTADO[estadoNuevo] ?? 'Estado actualizado');
      await fetchPedidos();
      try { const k = await getKardex(); setKardex(k); } catch { }
    } catch {
      showAlert('Error de conexión con el servidor', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const toggleSeleccionado = (id: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionados.size === pedidosFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(pedidosFiltrados.map(p => p.id)));
    }
  };

  const actualizarEstadoMasivo = async (estadoNuevo: 'Enviado' | 'Entregado') => {
    if (seleccionados.size === 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${BASE}/inventario/pedido/estado-masivo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
        body: JSON.stringify({ pedido_ids: Array.from(seleccionados), estado_nuevo: estadoNuevo }),
      });
      const data = await res.json();
      if (!res.ok) { showAlert(data.error ?? 'Error al actualizar los pedidos', 'error'); return; }
      const { exitosos, fallidos } = data;
      if (fallidos.length === 0) {
        showAlert(`${exitosos.length} pedido(s) marcados como ${estadoNuevo}`);
      } else {
        showAlert(`${exitosos.length} actualizados, ${fallidos.length} no se pudieron actualizar`, 'error');
      }
      setSeleccionados(new Set());
      await fetchPedidos();
    } catch {
      showAlert('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = pedidos
    .filter(p => {
      const matchEstado = filtroEstado === '' || p.estado === filtroEstado;
      const q = busqueda.toLowerCase();
      const matchBusqueda = q === '' || p.cliente_nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q) || p.detalles.some(d => d.producto_nombre.toLowerCase().includes(q));
      const fechaPedido = p.fecha.split('T')[0];
      const matchDesde = filtroDesde === '' || fechaPedido >= filtroDesde;
      const matchHasta = filtroHasta === '' || fechaPedido <= filtroHasta;
      const matchPestaña = pestaña === 'pedidos' ? !FINALIZADOS.includes(p.estado) : FINALIZADOS.includes(p.estado);
      return matchEstado && matchBusqueda && matchDesde && matchHasta && matchPestaña;
    })
    .sort((a, b) => {
      if (pestaña === 'pedidos') return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });

  const resumen = {
    total: pedidos.length,
    gestion: pedidos.filter(p => p.estado === 'Pendiente' || p.estado === 'En proceso').length,
    enviado: pedidos.filter(p => p.estado === 'Enviado').length,
    entregado: pedidos.filter(p => p.estado === 'Entregado').length,
    atencion: pedidos.filter(p => p.estado === 'Devolucion solicitada').length,
    cancelado: pedidos.filter(p => p.estado === 'Cancelado').length,
  };

  return (
    <div className="space-y-5">
      {alert && <Alert msg={alert.msg} type={alert.type} />}

      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-amber-800">🛒 Gestión de Pedidos</h2>
          <p className="text-stone-500 text-sm mt-1">Los cambios de estado actualizan el inventario automáticamente</p>
        </div>
        <button onClick={fetchPedidos} className="p-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: resumen.total, color: 'text-stone-700', bg: 'bg-white', border: 'border-stone-200' },
          { label: 'Pendientes de gestión', value: resumen.gestion, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
          { label: 'En camino', value: resumen.enviado, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Entregado', value: resumen.entregado, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Requieren atención', value: resumen.atencion, color: 'text-purple-700', bg: resumen.atencion > 0 ? 'bg-purple-100 animate-pulse' : 'bg-purple-50', border: 'border-purple-200' },
          { label: 'Cancelado', value: resumen.cancelado, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl border ${card.border} px-4 py-3 text-center shadow-sm transition`}>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[11px] text-stone-400 mt-0.5 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4">
          <input type="text" placeholder="Buscar cliente, código o producto..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)} className={`${inputCls} flex-1 min-w-[200px]`} />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={inputCls}>
            <option value="">Todos los estados</option>
            {['Pendiente', 'En proceso', 'Enviado', 'Entregado', 'Cancelado', 'Devolucion solicitada', 'Devuelto', 'Devolucion aprobada', 'Devolucion rechazada'].map(e => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Desde</span>
            <input type="date" max={new Date().toISOString().split('T')[0]} value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Hasta</span>
            <input type="date" max={new Date().toISOString().split('T')[0]} value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-amber-800">📋 Lista de pedidos</h2>
          <span className="text-xs text-stone-400">{pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex gap-2 mb-4 border-b border-amber-100">
          <button
            onClick={() => { setPestaña('pedidos'); setSeleccionados(new Set()); }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${pestaña === 'pedidos' ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            Pedidos ({pedidos.filter(p => !FINALIZADOS.includes(p.estado)).length})
          </button>
          <button
            onClick={() => { setPestaña('historial'); setSeleccionados(new Set()); }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${pestaña === 'historial' ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
          >
            Historial ({pedidos.filter(p => FINALIZADOS.includes(p.estado)).length})
          </button>
        </div>
        {pestaña === 'pedidos' && seleccionados.size > 0 && (
          <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <span className="text-sm text-amber-800 font-medium">{seleccionados.size} seleccionado(s)</span>
            <button
              onClick={() => actualizarEstadoMasivo('Enviado')}
              className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              Marcar como Enviado
            </button>
            <button
              onClick={() => actualizarEstadoMasivo('Entregado')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
            >
              Marcar como Entregado
            </button>
          </div>
        )}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-amber-50 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-amber-100">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                    {pestaña === 'pedidos' && (
                      <input
                        type="checkbox"
                        checked={pedidosFiltrados.length > 0 && seleccionados.size === pedidosFiltrados.length}
                        onChange={toggleSeleccionarTodos}
                      />
                    )}
                  </th>
                  {['Código / Estado', 'Cliente', 'Productos', 'Total', 'Fecha', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-stone-400">{pedidos.length === 0 ? 'Aún no tienes pedidos' : 'No hay pedidos con los filtros aplicados'}</td></tr>
                ) : pedidosFiltrados.map(pedido => {
                  const isLoading = loadingId === pedido.id;
                  return (
                    <>
                      <tr key={pedido.id} className="border-t border-amber-50 hover:bg-amber-50/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {pestaña === 'pedidos' && (
                            <input
                              type="checkbox"
                              checked={seleccionados.has(pedido.id)}
                              onChange={() => toggleSeleccionado(pedido.id)}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-mono text-xs text-stone-400 mb-1">{pedido.codigo}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${pedido.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : pedido.estado === 'En proceso' ? 'bg-orange-100 text-orange-700' : pedido.estado === 'Enviado' ? 'bg-blue-100 text-blue-700' : pedido.estado === 'Entregado' ? 'bg-green-100 text-green-700' : pedido.estado === 'Cancelado' ? 'bg-red-100 text-red-700' : pedido.estado?.includes('Devolucion') ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-500'}`}>
                            {pedido.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-semibold text-stone-800 text-sm">{pedido.cliente_nombre}</p>
                          {pedido.telefono && <p className="text-xs text-stone-400">{pedido.telefono}</p>}
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="truncate text-stone-600 text-xs">{pedido.detalles.map(d => `${d.producto_nombre} x${d.cantidad}`).join(', ')}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{pedido.detalles.length} {pedido.detalles.length === 1 ? 'producto' : 'productos'}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-green-700 whitespace-nowrap text-sm">${Number(pedido.total).toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">{new Date(pedido.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(SIGUIENTES[pedido.estado] ?? []).length === 0 ? (
                              <span className="text-xs text-stone-300 italic">Finalizado</span>
                            ) : (SIGUIENTES[pedido.estado] ?? []).map(siguiente => (
                              <button key={siguiente} disabled={isLoading} onClick={() => actualizarEstado(pedido, siguiente)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${BTN_COLOR[siguiente] ?? 'bg-gray-100 text-gray-600'}`}>
                                {isLoading ? '⏳' : `→ ${siguiente}`}
                              </button>
                            ))}
                            {pedido.estado === 'Devolucion solicitada' && (
                              <button onClick={() => setDevolucionSeleccionada(pedido)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition">
                                👁 Ver
                              </button>
                            )}
                            <button onClick={() => setPedidoExpandido(pedidoExpandido === pedido.id ? null : pedido.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-600 hover:bg-stone-200 transition">
                              {pedidoExpandido === pedido.id ? '▲' : '▼ Ver'}
                            </button>
                            {!['Cancelado', 'Pendiente', 'En proceso'].includes(pedido.estado) && (
                              <button onClick={() => generarGuiaEnvio(pedido)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition">
                                📄 PDF
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {pedidoExpandido === pedido.id && (
                        <tr key={`exp-${pedido.id}`}>
                          <td colSpan={7} className="bg-amber-50/30 px-6 py-4 border-b border-amber-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
                                <h3 className="font-bold text-stone-700 text-sm mb-3">📦 Productos</h3>
                                <div className="space-y-2">
                                  {pedido.detalles.map((d, idx) => (
                                    <div key={idx} className="flex justify-between text-sm border-b border-amber-50 pb-1.5">
                                      <span className="text-stone-700">{d.producto_nombre}</span>
                                      <span className="font-semibold text-stone-500">x{d.cantidad}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
                                <h3 className="font-bold text-stone-700 text-sm mb-3">📋 Información</h3>
                                <div className="space-y-1.5 text-sm text-stone-600">
                                  <p><span className="font-semibold text-stone-700">Cliente:</span> {pedido.cliente_nombre}</p>
                                  <p><span className="font-semibold text-stone-700">Dirección:</span> {pedido.direccion || '—'}</p>
                                  <p><span className="font-semibold text-stone-700">Total:</span> ${Number(pedido.total).toLocaleString('es-CO')}</p>
                                  {pedido.numero_guia && <p><span className="font-semibold text-stone-700">Guía:</span> {pedido.numero_guia}</p>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {devolucionSeleccionada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Detalle devolución</h2>
              <button onClick={() => setDevolucionSeleccionada(null)} className="text-gray-400 hover:text-black text-lg">✕</button>
            </div>
            <div className="mb-4">
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">{devolucionSeleccionada.estado}</span>
            </div>
            <div className="mb-5">
              <h3 className="font-semibold text-gray-700 mb-2">Motivo</h3>
              <div className="bg-gray-50 border rounded-xl p-4 text-sm text-gray-700">{(devolucionSeleccionada as any).devolucion?.motivo || 'Sin motivo'}</div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { actualizarEstado(devolucionSeleccionada!, 'Devolucion rechazada'); setDevolucionSeleccionada(null); }}
                className="px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition">Rechazar</button>
              <button onClick={() => { actualizarEstado(devolucionSeleccionada!, 'Devolucion aprobada'); setDevolucionSeleccionada(null); }}
                className="px-4 py-2 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition">Aprobar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}