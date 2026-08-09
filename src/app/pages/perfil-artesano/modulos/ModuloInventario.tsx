import { useState, useEffect } from 'react';
import { Producto, Kardex, createKardex, reponerStock, getKardex, getResumenInventario, type ResumenInventario } from '../../../data/artesanoApi';
import { ModalReposicion } from '../components/ModalReposicion';

const inputCls = 'w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition';
const labelCls = 'block text-[10px] font-semibold tracking-widest uppercase text-stone-500 mb-1';

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => {
  const colors = { success: 'bg-green-100 text-green-800 border-green-200', error: 'bg-red-100 text-red-800 border-red-200' };
  return <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}>{msg}</div>;
};

interface ModuloInventarioProps {
  productos: Producto[];
  kardex: Kardex[];
  setKardex: React.Dispatch<React.SetStateAction<Kardex[]>>;
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  filtroProductoInicial?: string;
  onFiltroUsado?: () => void;
}

export function ModuloInventario({
  productos, kardex, setKardex, setProductos,
  filtroProductoInicial = 'todos', onFiltroUsado,
}: ModuloInventarioProps) {
  const [form, setForm] = useState({ producto: productos[0]?.id ?? 0, fecha: new Date().toISOString().slice(0, 10), cantidad: '', precio_pvp: '', nota: '' });
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalProd, setModalProd] = useState<Producto | null>(null);
  const [activeTab, setActiveTab] = useState<'entrada' | 'historial'>('entrada');
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', tipo: 'todos', origen: 'todos', producto: filtroProductoInicial });
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [limiteVisible, setLimiteVisible] = useState(10);

  useEffect(() => {
    if (filtroProductoInicial !== 'todos') {
      setFiltros(prev => ({ ...prev, producto: filtroProductoInicial }));
      const prod = productos.find(p => String(p.id) === filtroProductoInicial);
      if (prod?.id) setForm(prev => ({ ...prev, producto: prod.id! }));
      onFiltroUsado?.();
    }
  }, [filtroProductoInicial]);

  useEffect(() => {
    setLimiteVisible(10);
  }, [filtros, busquedaHistorial]);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500);
  };

  const productoSeleccionado = productos.find(p => p.id === form.producto);

  const handleAdd = async () => {
    if (!form.producto || !form.fecha) return showAlert('Producto y fecha son obligatorios', 'error');
    const cantidad = parseInt(form.cantidad);
    if (!cantidad || cantidad <= 0) return showAlert('La cantidad debe ser mayor a 0', 'error');
    setLoading(true);
    try {
      const nuevo = await createKardex({ producto: form.producto, cantidad, fecha: form.fecha, nota: form.nota, ...(form.precio_pvp ? { precio_pvp: parseFloat(form.precio_pvp) } : {}) });
      setKardex(prev => [nuevo, ...prev]);
      if (nuevo.stock_resultante !== undefined) {
        setProductos(prev => prev.map(p => p.id === form.producto ? { ...p, cantidad: nuevo.stock_resultante! } : p));
      }
      try { const k = await getKardex(); setKardex(k); } catch { }
      setForm({ producto: productos[0]?.id ?? 0, fecha: new Date().toISOString().slice(0, 10), cantidad: '', precio_pvp: '', nota: '' });
      showAlert('✓ Entrada registrada correctamente');
    } catch (err: any) {
      let msg = 'Error al registrar el movimiento';
      try { msg = JSON.parse(err?.message ?? '').error ?? msg; } catch { msg = err?.message ?? msg; }
      showAlert(msg, 'error');
    } finally { setLoading(false); }
  };

  const handleReposicion = async (cantidad: number, nota: string) => {
    if (!modalProd?.id) return;
    const movimiento = await reponerStock({ producto: modalProd.id, cantidad, nota });
    setKardex(prev => [movimiento, ...prev]);
    setProductos(prev => prev.map(p => p.id === modalProd.id ? { ...p, cantidad: movimiento.stock_resultante ?? p.cantidad } : p));
    try { const k = await getKardex(); setKardex(k); } catch { }
    showAlert(`✓ Entrada registrada — nuevo stock: ${movimiento.stock_resultante}`);
  };

  const kardexFiltrado = kardex.filter(k => {
    if (!k || !k.tipo) return false;
    if (filtros.desde && k.fecha < filtros.desde) return false;
    if (filtros.hasta && k.fecha > filtros.hasta) return false;
    if (filtros.tipo !== 'todos' && String(k.tipo ?? '').toLowerCase() !== filtros.tipo) return false;
    if (filtros.origen !== 'todos' && String((k as any).origen ?? '') !== filtros.origen) return false;
    if (filtros.producto !== 'todos' && String(k.producto) !== filtros.producto) return false;
    if (busquedaHistorial) {
      const texto = busquedaHistorial.toLowerCase();
      const nota = (k.nota ?? '').toLowerCase();
      const pedidoRef = ((k as any).pedido_ref ?? '').toLowerCase();
      if (!nota.includes(texto) && !pedidoRef.includes(texto)) return false;
    }
    return true;
  });

  const tabCls = (t: string) => `px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === t ? 'bg-amber-700 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`;
  const kardexVisible = kardexFiltrado.slice(0, limiteVisible);
  return (
    <div className="space-y-5 font-sans">
      {modalProd && <ModalReposicion producto={modalProd} onClose={() => setModalProd(null)} onConfirm={handleReposicion} />}
      {alert && <Alert msg={alert.msg} type={alert.type} />}

      <div className="flex gap-3 flex-wrap">
        <button className={tabCls('entrada')} onClick={() => setActiveTab('entrada')}>📦 Registrar entrada</button>
        <button className={tabCls('historial')} onClick={() => setActiveTab('historial')}>📊 Historial de movimientos</button>
      </div>

      {activeTab === 'entrada' && (
        <>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
            <h2 className="font-serif text-lg text-amber-800 font-semibold mb-1">📦 Registrar entrada de mercancía</h2>
            <p className="text-xs text-stone-400 mb-5">
              Usa esta opción para sumar stock a un producto ya registrado (ej. nueva producción, reposición, compra de materiales). El sistema registra automáticamente el tipo, subtipo y quién lo hizo.
            </p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Producto</label>
                <select className={inputCls} value={form.producto} onChange={e => setForm({ ...form, producto: Number(e.target.value) })}>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} [PROD-{String(p.id).padStart(4, '0')}]</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px]">
                  <label className={labelCls}>Cantidad *</label>
                  <input type="number" min={1} className={inputCls} placeholder="Ej: 10" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className={labelCls}>Fecha *</label>
                  <input type="date" className={inputCls} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Nota u observación</label>
                <input className={inputCls} placeholder="Ej: Compra feria artesanal mayo 2026" value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} />
              </div>
              <button onClick={handleAdd} disabled={loading}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold transition">
                {loading ? 'Guardando...' : '✓ Registrar entrada'}
              </button>
            </div>
          </div>

          {productoSeleccionado && (() => {
            const reservado = productoSeleccionado.cantidad_reservada ?? 0;
            const disponible = productoSeleccionado.cantidad - reservado;
            const bajo = disponible <= productoSeleccionado.stock_minimo;
            const alto = productoSeleccionado.stock_maximo > 0 && disponible >= productoSeleccionado.stock_maximo;
            return (
              <div className={`bg-white rounded-xl border p-5 ${bajo ? 'border-red-200' : alto ? 'border-blue-200' : 'border-amber-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-stone-700">📦 Stock de "{productoSeleccionado.nombre.toUpperCase()}" <span className="text-xs font-normal text-stone-400">(solo lectura)</span></p>
                    {bajo && <p className="text-xs text-red-500 font-semibold mt-0.5">⚠️ Stock disponible por debajo del mínimo</p>}
                    {alto && <p className="text-xs text-blue-500 font-semibold mt-0.5">📦 Stock en máximo</p>}
                  </div>
                  <button onClick={() => setModalProd(productoSeleccionado)} className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold rounded-lg transition">+ Stock</button>
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
              </div>
            );
          })()}
        </>
      )}

      {activeTab === 'historial' && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
          <h2 className="font-serif text-lg text-amber-800 font-semibold mb-4">📊 Historial de movimientos</h2>
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-stone-500">
            <span className="font-semibold">FILTRAR:</span>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Buscar por nota o referencia de pedido..."
                className="border border-amber-200 bg-amber-50/40 rounded-lg px-3 py-1.5 text-xs flex-1 min-w-[220px]"
                value={busquedaHistorial}
                onChange={e => setBusquedaHistorial(e.target.value)}
              />
            </div>
            <span>Desde</span>
            <input type="date" className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs" value={filtros.desde} onChange={e => setFiltros({ ...filtros, desde: e.target.value })} />
            <span>Hasta</span>
            <input type="date" className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs" value={filtros.hasta} onChange={e => setFiltros({ ...filtros, hasta: e.target.value })} />
            <select className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs" value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
              <option value="todos">Tipo: todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="devolucion">Devolución</option>
              <option value="ajuste">Ajuste</option>
            </select>
            <select className="border border-amber-200 bg-amber-50/40 rounded-lg px-2 py-1 text-xs" value={filtros.producto} onChange={e => setFiltros({ ...filtros, producto: e.target.value })}>
              <option value="todos">Producto: todos</option>
              {productos.map(p => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
            </select>
            {(Object.values(filtros).some(v => v !== 'todos' && v !== '') || busquedaHistorial) && (
              <button onClick={() => { setFiltros({ desde: '', hasta: '', tipo: 'todos', origen: 'todos', producto: 'todos' }); setBusquedaHistorial(''); }}
                className="px-2 py-1 rounded-lg bg-stone-100 text-stone-500 text-xs hover:bg-stone-200 transition">✕ Limpiar</button>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-amber-100">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-[10px] font-semibold uppercase tracking-widest text-amber-900/60">
                <tr>
                  {['Fecha', 'Producto', 'Tipo', 'Subtipo', 'Origen', 'Cant.', 'Stock Result.', 'PVP Unit.', 'Pedido ref.', 'Registrado por', 'Nota'].map(h => (
                    <th key={h} className="px-3 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kardexFiltrado.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-stone-400 text-sm">Sin movimientos</td></tr>
                ) : kardexVisible.map(k => (
                  <tr key={k.id} className="border-t border-amber-50 hover:bg-amber-50/50 transition">
                    <td className="px-3 py-3 text-stone-500 whitespace-nowrap">{k.fecha}</td>
                    <td className="px-3 py-3 font-semibold">{k.producto_nombre}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${String(k.tipo).toLowerCase() === 'entrada' ? 'bg-green-100 text-green-700' : String(k.tipo).toLowerCase() === 'salida' ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'}`}>{k.tipo}</span>
                    </td>
                    <td className="px-3 py-3"><span className="text-xs bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full text-stone-500">{(k as any).subtipo ?? '—'}</span></td>
                    <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${(k as any).origen === 'automatico' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>{(k as any).origen === 'automatico' ? '⚡ auto' : '✍️ manual'}</span></td>
                    <td className="px-3 py-3 font-bold">{k.cantidad}</td>
                    <td className="px-3 py-3 font-semibold text-green-700">{k.stock_resultante}</td>
                    <td className="px-3 py-3 text-stone-600">{(k as any).precio_unitario ? `$${Math.round(Number((k as any).precio_unitario)).toLocaleString('es-CO')}` : '—'}</td>
                    <td className="px-3 py-3 text-xs text-stone-400 font-mono">{(k as any).pedido_ref ?? '—'}</td>
                    <td className="px-3 py-3 text-xs text-stone-400">{(k as any).creado_por ?? '—'}</td>
                    <td className="px-3 py-3 text-xs text-stone-400">{k.nota ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {limiteVisible < kardexFiltrado.length && (
              <div className="flex justify-center mt-4">
                <button onClick={() => setLimiteVisible(prev => prev + 10)}
                  className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition">
                  Cargar más movimientos
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-2">{kardexVisible.length} de {kardexFiltrado.length} movimiento{kardexFiltrado.length !== 1 ? 's' : ''}{kardexFiltrado.length !== kardex.length && ` (filtrado de ${kardex.length} total)`}</p>
        </div>
      )}
    </div>
  );
}