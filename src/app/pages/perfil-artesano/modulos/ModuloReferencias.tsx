import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Search, Package, Truck } from 'lucide-react';
import { Producto, Kardex, getKardex, descargarReporte } from '../../../data/artesanoApi';
import { Pedido } from '../types';
import { API_BASE } from '../../../utils/config';

const BASE = API_BASE;
const ARTESANO_ID = Number(localStorage.getItem('usuario_id') ?? 1);

const inputCls = 'px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => {
  const colors = { success: 'bg-green-100 text-green-800 border-green-200', error: 'bg-red-100 text-red-800 border-red-200' };
  return <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}>{msg}</div>;
};

const ESTADO_STYLE: Record<string, string> = {
  Enviado: 'bg-blue-100 text-blue-700',
  Entregado: 'bg-green-100 text-green-700',
};

// Normaliza para comparar códigos de pedido sin importar mayúsculas/espacios/guiones
function normalizar(valor: string): string {
  return valor.trim().toUpperCase().replace(/[\s-]+/g, '');
}

function buscarPedidoPorCodigo(pedidos: Pedido[], valorIngresado: string): Pedido | undefined {
  const objetivo = normalizar(valorIngresado);
  if (!objetivo) return undefined;
  let encontrado = pedidos.find(p => normalizar(p.codigo) === objetivo);
  if (encontrado) return encontrado;
  if (/^\d+$/.test(valorIngresado.trim())) {
    encontrado = pedidos.find(p => normalizar(p.codigo) === normalizar(`PED${valorIngresado}`));
  }
  return encontrado;
}

interface ModuloReferenciasProps {
  pedidos: Pedido[];
  onRefrescar: () => void | Promise<void>;
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  setKardex: React.Dispatch<React.SetStateAction<Kardex[]>>;
  /** Llega desde la pestaña "Pedidos": "enviar" precarga el formulario, "confirmar" filtra la tabla en ese pedido */
  prefill?: { codigo: string; accion: 'enviar' | 'confirmar' } | null;
  onPrefillUsado?: () => void;
}

export function ModuloReferencias({ pedidos, onRefrescar, setProductos, setKardex, prefill, onPrefillUsado }: ModuloReferenciasProps) {
  const [guardando, setGuardando] = useState(false);
  const [entregandoId, setEntregandoId] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [form, setForm] = useState({ pedido: '', referencia: '' });
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000);
  };

  // Si se llega desde "Pedidos": "enviar" precarga el formulario de registro;
  // "confirmar" (pedido ya Enviado) filtra la tabla para mostrar esa fila
  // con el botón "Marcar entregado" listo, sin tocar el formulario.
  useEffect(() => {
    if (!prefill) return;
    if (prefill.accion === 'confirmar') {
      setBusqueda(prefill.codigo);
    } else {
      setForm(f => ({ ...f, pedido: prefill.codigo }));
    }
    onPrefillUsado?.();
  }, [prefill, onPrefillUsado]);

  // Cerrar el desplegable al hacer clic afuera
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownAbierto(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const listosParaEnviar = useMemo(
    () => pedidos.filter(p => p.estado === 'En proceso'),
    [pedidos]
  );

  const elegirPedido = (pedido: Pedido) => {
    setForm(f => ({ ...f, pedido: pedido.codigo }));
    setDropdownAbierto(false);
  };

  // ── Guardar referencia de envío → pasa el pedido a "Enviado" ────────────
  const handleGuardar = async () => {
    const pedidoTexto = form.pedido.trim();
    const referencia = form.referencia.trim();

    if (!pedidoTexto) return showAlert('Indica el número de pedido', 'error');
    if (!referencia) return showAlert('Indica el número de referencia o ticket que te dio la transportadora', 'error');

    const pedido = buscarPedidoPorCodigo(pedidos, pedidoTexto);
    if (!pedido) {
      return showAlert('No se encontró un pedido con ese número. Revisa el código (ej: PED-00007).', 'error');
    }
    if (pedido.estado !== 'En proceso') {
      return showAlert(
        `Ese pedido está en estado "${pedido.estado}". Solo se puede registrar el envío de un pedido "En proceso".`,
        'error'
      );
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${BASE}/inventario/pedido/estado/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
        body: JSON.stringify({
          pedido_id: pedido.id,
          estado_nuevo: 'Enviado',
          numero_guia: referencia,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showAlert(data.error ?? 'No se pudo registrar el envío', 'error'); return; }

      showAlert(`✓ Pedido ${pedido.codigo} marcado como Enviado con referencia ${referencia}`);
      setForm({ pedido: '', referencia: '' });
      await onRefrescar();
    } catch {
      showAlert('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ── Marcar entregado (una vez la transportadora confirma la entrega) ────
  const handleMarcarEntregado = async (pedido: Pedido) => {
    if (!confirm(`¿Confirmas que el pedido ${pedido.codigo} ya fue entregado al cliente?\nEsto descontará el stock definitivo.`)) return;

    setEntregandoId(pedido.id);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${BASE}/inventario/pedido/estado/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
        body: JSON.stringify({ pedido_id: pedido.id, estado_nuevo: 'Entregado' }),
      });
      const data = await res.json();
      if (!res.ok) { showAlert(data.error ?? 'No se pudo marcar como entregado', 'error'); return; }

      if (data.stock_actual !== undefined) {
        const productosAfectados = new Set(pedido.detalles.map(d => d.producto));
        setProductos(prev => prev.map(p => {
          if (!p.id || !productosAfectados.has(p.id)) return p;
          return { ...p, cantidad: data.stock_actual ?? p.cantidad, cantidad_reservada: data.stock_reservado ?? p.cantidad_reservada ?? 0 };
        }));
      }
      showAlert(`✓ Pedido ${pedido.codigo} marcado como Entregado`);
      await onRefrescar();
      try { const k = await getKardex(); setKardex(k); } catch { /* no crítico */ }
    } catch {
      showAlert('Error de conexión con el servidor', 'error');
    } finally {
      setEntregandoId(null);
    }
  };

  // ── Tabla: un grupo por pedido, una fila por producto ────────────────────
  const pedidosConReferencia = useMemo(
    () => pedidos
      .filter(p => !!p.numero_guia)
      .sort((a, b) => new Date(b.fecha_envio ?? b.fecha).getTime() - new Date(a.fecha_envio ?? a.fecha).getTime()),
    [pedidos]
  );

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidosConReferencia
      .filter(p => {
        if (!q) return true;
        return (
          p.codigo.toLowerCase().includes(q) ||
          (p.numero_guia ?? '').toLowerCase().includes(q) ||
          p.cliente_nombre.toLowerCase().includes(q) ||
          p.estado.toLowerCase().includes(q) ||
          p.detalles.some(d =>
            d.producto_nombre.toLowerCase().includes(q) ||
            (d.producto_codigo ?? '').toLowerCase().includes(q)
          )
        );
      })
      .map(pedido => ({ pedido, detalles: pedido.detalles.length > 0 ? pedido.detalles : [null] }));
  }, [pedidosConReferencia, busqueda]);

  return (
    <div className="space-y-5">
      {alert && <Alert msg={alert.msg} type={alert.type} />}

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-stone-600">
        Como no manejamos ninguna transportadora conectada al sistema, aquí registras el número de guía o ticket que te dieron
        al despachar el paquete — eso marca el pedido como <b>Enviado</b>. Luego, cuando la transportadora te confirme la entrega,
        usa el botón <b>Marcar entregado</b> en la tabla de abajo.
      </div>

      {/* ── Formulario ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-serif text-lg text-amber-800 mb-4">Registrar envío</h3>
        <div className="flex flex-wrap items-end gap-4">

          <div className="flex flex-col gap-1 flex-1 min-w-[200px] relative" ref={dropdownRef}>
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">No. Pedido</label>
            <div className="flex gap-1">
              <input
                className={`${inputCls} flex-1`}
                placeholder="Ej: PED-00007"
                value={form.pedido}
                onChange={e => setForm(f => ({ ...f, pedido: e.target.value }))}
              />
              <button
                type="button"
                title="Ver pedidos listos para enviar"
                onClick={() => setDropdownAbierto(o => !o)}
                className="px-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {dropdownAbierto && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-amber-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                <p className="px-3 py-2 text-xs font-semibold text-amber-900/60 uppercase tracking-wider border-b border-amber-50 sticky top-0 bg-white">
                  Pedidos listos para enviar ({listosParaEnviar.length})
                </p>
                {listosParaEnviar.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-stone-400">No hay pedidos "En proceso" en este momento.</p>
                ) : listosParaEnviar.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => elegirPedido(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-amber-50 transition border-b border-amber-50 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-stone-500">{p.codigo}</span>
                      <span className="font-semibold text-green-700 text-xs">${Number(p.total).toLocaleString('es-CO')}</span>
                    </div>
                    <p className="text-sm text-stone-700 truncate">{p.cliente_nombre}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {p.detalles.map(d => d.producto_nombre).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Referencia o Ticket</label>
            <input
              className={inputCls}
              placeholder="Número que te dio la transportadora"
              value={form.referencia}
              onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
            />
          </div>

          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-serif text-lg text-amber-800">Historial de envíos</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                className={`${inputCls} pl-9 py-2`}
                placeholder="Buscar por pedido, referencia, cliente o producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            <button onClick={() => descargarReporte('envios', 'excel', ARTESANO_ID)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition">
              📊 Excel
            </button>
            <button onClick={() => descargarReporte('envios', 'pdf', ARTESANO_ID)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition">
              📄 PDF
            </button>
          </div>
        </div>
        <p className="text-xs text-stone-400 -mt-2 mb-3">El reporte descarga todo el historial de envíos, sin importar el filtro de búsqueda.</p>

        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
              <tr>
                {['Código/Id', 'Producto', 'Pedido + referencia', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grupos.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-stone-400">
                  {pedidosConReferencia.length === 0 ? 'Todavía no has registrado ningún envío' : 'No hay resultados para esa búsqueda'}
                </td></tr>
              ) : grupos.map(({ pedido, detalles }) => (
                detalles.map((detalle, idx) => (
                  <tr key={`${pedido.id}-${idx}`} className="border-t border-amber-50 hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-stone-500 whitespace-nowrap">
                      {detalle?.producto_codigo || (detalle ? `#${detalle.producto}` : '—')}
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {detalle ? detalle.producto_nombre : <span className="text-stone-400 italic">Sin productos</span>}
                      {detalle && <span className="text-stone-400 text-xs"> x{detalle.cantidad}</span>}
                    </td>

                    {idx === 0 && (
                      <td className="px-4 py-3 align-top" rowSpan={detalles.length}>
                        <p className="font-mono text-xs text-stone-500">{pedido.codigo}</p>
                        <p className="text-sm font-semibold text-amber-800 flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5" /> {pedido.numero_guia}
                        </p>
                        <p className="text-xs text-stone-400">{pedido.cliente_nombre}</p>
                      </td>
                    )}

                    {idx === 0 && (
                      <td className="px-4 py-3 align-top" rowSpan={detalles.length}>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_STYLE[pedido.estado] ?? 'bg-stone-100 text-stone-600'}`}>
                          {pedido.estado}
                        </span>
                        {pedido.fecha_envio && (
                          <p className="text-xs text-stone-400 mt-1">📤 {new Date(pedido.fecha_envio).toLocaleDateString('es-CO')}</p>
                        )}
                        {pedido.fecha_entrega && (
                          <p className="text-xs text-green-600 mt-0.5">✅ {new Date(pedido.fecha_entrega).toLocaleDateString('es-CO')}</p>
                        )}
                      </td>
                    )}

                    {idx === 0 && (
                      <td className="px-4 py-3 align-top" rowSpan={detalles.length}>
                        {pedido.estado === 'Enviado' && (
                          <button
                            onClick={() => handleMarcarEntregado(pedido)}
                            disabled={entregandoId === pedido.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition text-xs font-semibold disabled:opacity-50"
                          >
                            <Package className="h-3.5 w-3.5" />
                            {entregandoId === pedido.id ? 'Guardando...' : 'Marcar entregado'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
