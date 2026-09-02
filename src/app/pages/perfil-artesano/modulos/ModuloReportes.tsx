import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Producto, Kardex, descargarReporte } from '../../../data/artesanoApi';

const ARTESANO_ID = Number(localStorage.getItem('usuario_id') ?? 1);
const COLORS = ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#92400e', '#78350f', '#fde68a'];
const tooltipStyle = { backgroundColor: '#fff', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12 };

const selCls = 'px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-sm text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';
const dateCls = (err: string) => `px-3 py-2 rounded-xl border text-sm text-stone-800 bg-amber-50 focus:outline-none focus:ring-2 transition ${err ? 'border-red-400 focus:ring-red-200' : 'border-amber-200 focus:border-amber-500 focus:ring-amber-200'}`;

interface ModuloReportesProps {
  productos: Producto[];
  kardex: Kardex[];
}

export function ModuloReportes({ productos, kardex }: ModuloReportesProps) {
  const [tabReporte, setTabReporte] = useState<'ventas' | 'inventario' | 'productos' | 'contable'>('ventas');
  const [vista, setVista] = useState<Record<string, 'tabla' | 'dashboard'>>({ ventas: 'tabla', inventario: 'tabla', productos: 'tabla', contable: 'tabla' });

  const hoy = new Date().toISOString().split('T')[0];
  const [fVentas, setFVentas] = useState({ producto: '', desde: '', hasta: '' });
  const [fInventario, setFInventario] = useState({ producto: '', desde: '', hasta: '', tipo: 'todos', subtipo: 'todos' });
  const [fProductos, setFProductos] = useState({ producto: '', desde: '', hasta: '' });
  const [fContable, setFContable] = useState({ producto: '', desde: '', hasta: '', subtipo: 'todos' });
  const [errVentas, setErrVentas] = useState({ desde: '', hasta: '' });
  const [errInventario, setErrInventario] = useState({ desde: '', hasta: '' });
  const [errProductos, setErrProductos] = useState({ desde: '', hasta: '' });
  const [errContable, setErrContable] = useState({ desde: '', hasta: '' });

  const toggleVista = (tab: string) => setVista(prev => ({ ...prev, [tab]: prev[tab] === 'tabla' ? 'dashboard' : 'tabla' }));

  function validarFechas(desde: string, hasta: string, setErr: any): boolean {
    const err = { desde: '', hasta: '' };
    if (desde && desde > hoy) err.desde = 'No puede ser una fecha futura';
    if (hasta && hasta > hoy) err.hasta = 'No puede ser una fecha futura';
    if (desde && hasta && desde > hasta) err.desde = '"Desde" no puede ser mayor que "Hasta"';
    setErr(err);
    return !err.desde && !err.hasta;
  }

  function enRango(fecha: string, desde: string, hasta: string) {
    const f = fecha.split('T')[0];
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    return true;
  }

  const kardexVentas = kardex.filter(k => String((k as any).subtipo ?? '').toLowerCase() === 'venta');
  const ventasFiltradas = kardexVentas.filter(k => {
    if (!enRango(k.fecha, fVentas.desde, fVentas.hasta)) return false;
    if (fVentas.producto && String(k.producto) !== fVentas.producto) return false;
    return true;
  });
  const inventarioFiltrado = kardex.filter(k => {
    if (!enRango(k.fecha, fInventario.desde, fInventario.hasta)) return false;
    if (fInventario.producto && String(k.producto) !== fInventario.producto) return false;
    if (fInventario.tipo !== 'todos' && String(k.tipo ?? '').toLowerCase() !== fInventario.tipo) return false;
    if (fInventario.subtipo !== 'todos' && String((k as any).subtipo ?? '').toLowerCase() !== fInventario.subtipo) return false;
    return true;
  });
  const productosFiltrados = productos.filter(p => {
    if (fProductos.producto && String(p.id) !== fProductos.producto) return false;
    return true;
  });
  const contableFiltrado = kardex.filter(k => {
    if (!enRango(k.fecha, fContable.desde, fContable.hasta)) return false;
    if (fContable.producto && String(k.producto) !== fContable.producto) return false;
    const sub = String((k as any).subtipo ?? '').toLowerCase();
    if (fContable.subtipo !== 'todos' && sub !== fContable.subtipo) return false;
    return ['venta', 'reposicion', 'ajuste_manual', 'devolucion_cliente', 'stock_inicial'].includes(sub);
  });

  const kardexDevoluciones = kardex.filter(k => String((k as any).subtipo ?? '').toLowerCase() === 'devolucion_cliente');
  const totalDevoluciones = kardexDevoluciones
    .filter(k => enRango(k.fecha, fVentas.desde, fVentas.hasta) && (!fVentas.producto || String(k.producto) === fVentas.producto))
    .reduce((a, k) => a + k.cantidad * Number((k as any).precio_unitario ?? 0), 0);

  const totalVentas = ventasFiltradas.reduce((a, k) => a + k.cantidad * Number((k as any).precio_unitario ?? 0), 0) - totalDevoluciones;
  const totalEntradas = inventarioFiltrado.filter(k => String(k.tipo).toLowerCase() === 'entrada').reduce((a, k) => a + k.cantidad, 0);
  const totalSalidas = inventarioFiltrado.filter(k => String(k.tipo).toLowerCase() === 'salida').reduce((a, k) => a + k.cantidad, 0);
  const valorContable = contableFiltrado.reduce((a, k) => a + k.cantidad * Number((k as any).precio_unitario ?? 0), 0);

  const ventasPorFecha = Object.entries(ventasFiltradas.reduce((acc: Record<string, number>, k) => {
    const f = k.fecha.split('T')[0]; acc[f] = (acc[f] ?? 0) + k.cantidad * Number((k as any).precio_unitario ?? 0); return acc;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).slice(-10).map(([fecha, total]) => ({ fecha: fecha.slice(5), total }));

  const stockActual = productos.map(p => ({ nombre: p.nombre.length > 13 ? p.nombre.slice(0, 13) + '…' : p.nombre, stock: p.cantidad - (p.cantidad_reservada ?? 0), minimo: p.stock_minimo })).sort((a, b) => b.stock - a.stock).slice(0, 8);
  const stockDisponible = productosFiltrados.map(p => ({ nombre: p.nombre.length > 13 ? p.nombre.slice(0, 13) + '…' : p.nombre, disponible: p.cantidad - (p.cantidad_reservada ?? 0), bajo: (p.cantidad - (p.cantidad_reservada ?? 0)) <= p.stock_minimo })).sort((a, b) => a.disponible - b.disponible).slice(0, 8);

    const masVistos = [...productos]
    .sort((a, b) => (b.visitas ?? 0) - (a.visitas ?? 0))
    .slice(0, 8)
    .map(p => ({ nombre: p.nombre.length > 13 ? p.nombre.slice(0, 13) + '…' : p.nombre, vistas: p.visitas ?? 0 }));
  const tabCls = (t: string) => `px-5 py-2 rounded-xl text-sm font-semibold transition ${tabReporte === t ? 'bg-amber-700 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`;

  function KPI({ label, value, sub, color = 'text-amber-900' }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-stone-400">{sub}</p>}
      </div>
    );
  }

  function Grafica({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-3">{title}</p>
        {children}
      </div>
    );
  }

  const SinGrafica = () => <div className="h-48 flex items-center justify-center text-stone-400 text-sm">Sin datos suficientes</div>;
  const SinDatos = ({ cols }: { cols: number }) => <tr><td colSpan={cols} className="px-4 py-8 text-center text-stone-400 text-sm">Sin resultados</td></tr>;

  const TipoBadge = ({ tipo }: { tipo: string | undefined }) => {
    const t = (tipo ?? '').toLowerCase();
    const cls = t === 'entrada' ? 'bg-green-100 text-green-700' : t === 'salida' ? 'bg-red-100 text-red-600' : t === 'devolucion' ? 'bg-blue-100 text-blue-600' : 'bg-stone-100 text-stone-500';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{tipo}</span>;
  };

  function Filtros({ f, setF, err, setErr }: { f: any; setF: any; err: any; setErr: any }) {
    return (
      <div className="flex flex-wrap items-end gap-3 mb-5 p-4 bg-amber-50 rounded-xl border border-amber-100">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Producto</label>
          <select className={selCls} value={f.producto ?? ''} onChange={e => setF({ ...f, producto: e.target.value })}>
            <option value="">Todos</option>
            {productos.map(p => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
          </select>
        </div>
        {f.tipo !== undefined && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Tipo</label>
            <select className={selCls} value={f.tipo ?? 'todos'} onChange={e => setF({ ...f, tipo: e.target.value })}>
              <option value="todos">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="devolucion">Devolución</option>
            </select>
          </div>
        )}
        {f.subtipo !== undefined && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Subtipo</label>
            <select className={selCls} value={f.subtipo ?? 'todos'} onChange={e => setF({ ...f, subtipo: e.target.value })}>
              <option value="todos">Todos</option>
              <option value="venta">Venta</option>
              <option value="reposicion">Reposición</option>
              <option value="stock_inicial">Stock inicial</option>
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Desde</label>
          <input type="date" max={hoy} className={dateCls(err.desde)} value={f.desde}
            onChange={e => { setF({ ...f, desde: e.target.value }); validarFechas(e.target.value, f.hasta, setErr); }} />
          {err.desde && <span className="text-xs text-red-500 font-medium">{err.desde}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Hasta</label>
          <input type="date" max={hoy} className={dateCls(err.hasta)} value={f.hasta}
            onChange={e => { setF({ ...f, hasta: e.target.value }); validarFechas(f.desde, e.target.value, setErr); }} />
          {err.hasta && <span className="text-xs text-red-500 font-medium">{err.hasta}</span>}
        </div>
        {(f.producto || f.desde || f.hasta) && (
          <button onClick={() => { setF({ producto: '', desde: '', hasta: '', ...(f.tipo !== undefined ? { tipo: 'todos' } : {}), ...(f.subtipo !== undefined ? { subtipo: 'todos' } : {}) }); setErr({ desde: '', hasta: '' }); }}
            className="px-3 py-2 rounded-xl bg-stone-100 text-stone-500 text-xs font-semibold hover:bg-stone-200 transition">✕ Limpiar</button>
        )}
      </div>
    );
  }

  function Acciones({ tipo, tab }: { tipo: string; tab: string }) {
    const esDash = vista[tab] === 'dashboard';
    return (
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => toggleVista(tab)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${esDash ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
          {esDash ? '📋 Ver tabla' : '📊 Dashboard'}
        </button>
        <button onClick={() => descargarReporte(tipo, 'excel', ARTESANO_ID)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition">📊 Excel</button>
        <button onClick={() => descargarReporte(tipo, 'pdf', ARTESANO_ID)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition">📄 PDF</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-2xl text-amber-800 mb-1">📈 Reportería</h2>
        <p className="text-stone-500 text-sm">Estadísticas y movimientos en tiempo real</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className={tabCls('ventas')} onClick={() => setTabReporte('ventas')}>📈 Ventas</button>
        <button className={tabCls('inventario')} onClick={() => setTabReporte('inventario')}>📦 Inventario</button>
        <button className={tabCls('productos')} onClick={() => setTabReporte('productos')}>🛍️ Productos</button>
        <button className={tabCls('contable')} onClick={() => setTabReporte('contable')}>📒 Contable</button>
      </div>

      {tabReporte === 'ventas' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-amber-800">📈 Reporte de Ventas</h3>
            <Acciones tipo="kardex" tab="ventas" />
          </div>
          <Filtros f={fVentas} setF={setFVentas} err={errVentas} setErr={setErrVentas} />
          {vista['ventas'] === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KPI label="Ventas Totales" value={`$${totalVentas.toLocaleString('es-CO')}`} color="text-green-700" />
                <KPI label="Productos vendidos" value={ventasFiltradas.reduce((a, k) => a + k.cantidad, 0)} color="text-amber-700" />
                <KPI label="Pedidos realizados" value={ventasFiltradas.length} />
                <KPI label="Promedio por pedido" value={ventasFiltradas.length > 0 ? `$${Math.round(totalVentas / ventasFiltradas.length).toLocaleString('es-CO')}` : '$0'} color="text-blue-700" />
              </div>
              <Grafica title="Ingresos por fecha">
                {ventasPorFecha.length === 0 ? <SinGrafica /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={ventasPorFecha}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ingresos']} />
                      <Line type="monotone" dataKey="total" stroke="#b45309" strokeWidth={2} dot={{ fill: '#b45309', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Grafica>
            </div>
          )}
          {vista['ventas'] === 'tabla' && (
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                  <tr>{['Fecha', 'Producto', 'Tipo', 'Subtipo', 'Cantidad', 'PVP Unit.', 'Total', 'Pedido ref.', 'Registrado por'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 ? <SinDatos cols={9} /> : ventasFiltradas.map(k => {
                    const pvp = Number((k as any).precio_unitario ?? 0);
                    return (
                      <tr key={k.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                        <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{k.fecha}</td>
                        <td className="px-4 py-3 font-semibold">{k.producto_nombre}</td>
                        <td className="px-4 py-3"><TipoBadge tipo={k.tipo} /></td>
                        <td className="px-4 py-3"><span className="text-xs bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full text-stone-500">{(k as any).subtipo ?? '—'}</span></td>
                        <td className="px-4 py-3 font-bold text-center">{k.cantidad}</td>
                        <td className="px-4 py-3 text-stone-600">{pvp ? `$${pvp.toLocaleString('es-CO')}` : '—'}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">${(pvp * k.cantidad).toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-xs text-stone-400 font-mono">{(k as any).pedido_ref ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-stone-400">{(k as any).creado_por ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-stone-400 p-3">{ventasFiltradas.length} registro{ventasFiltradas.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {tabReporte === 'inventario' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-amber-800">📦 Reporte de Inventario</h3>
            <Acciones tipo="inventario" tab="inventario" />
          </div>
          <Filtros f={fInventario} setF={setFInventario} err={errInventario} setErr={setErrInventario} />
          {vista['inventario'] === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KPI label="Productos activos" value={productos.length} />
                <KPI label="Stock bajo mínimo" value={productos.filter(p => (p.cantidad - (p.cantidad_reservada ?? 0)) <= p.stock_minimo).length} color="text-red-600" sub="requieren reposición" />
                <KPI label="Entradas (uds)" value={`+${totalEntradas}`} color="text-green-700" />
                <KPI label="Salidas (uds)" value={`-${totalSalidas}`} color="text-red-600" />
              </div>
              <Grafica title="Stock disponible por producto">
                {stockActual.length === 0 ? <SinGrafica /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stockActual}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="stock" name="Disponible" fill="#b45309" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="minimo" name="Mínimo" fill="#fde68a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Grafica>
            </div>
          )}
          {vista['inventario'] === 'tabla' && (
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                  <tr>{['Fecha', 'Producto', 'Tipo', 'Subtipo', 'Origen', 'Cant.', 'Stock result.', 'PVP Unit.', 'Pedido ref.', 'Registrado por', 'Nota'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {inventarioFiltrado.length === 0 ? <SinDatos cols={11} /> : inventarioFiltrado.map(k => (
                    <tr key={k.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                      <td className="px-3 py-3 text-stone-500 whitespace-nowrap">{k.fecha}</td>
                      <td className="px-3 py-3 font-semibold">{k.producto_nombre}</td>
                      <td className="px-3 py-3"><TipoBadge tipo={k.tipo} /></td>
                      <td className="px-3 py-3"><span className="text-xs bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full text-stone-500">{(k as any).subtipo ?? '—'}</span></td>
                      <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${(k as any).origen === 'automatico' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>{(k as any).origen === 'automatico' ? '⚡ auto' : '✍️ manual'}</span></td>
                      <td className="px-3 py-3 font-bold text-center">{k.cantidad}</td>
                      <td className="px-3 py-3 font-semibold text-green-700 text-center">{k.stock_resultante}</td>
                      <td className="px-3 py-3 text-stone-600">{(k as any).precio_unitario ? `$${Number((k as any).precio_unitario).toLocaleString('es-CO')}` : '—'}</td>
                      <td className="px-3 py-3 text-xs text-stone-400 font-mono">{(k as any).pedido_ref ?? '—'}</td>
                      <td className="px-3 py-3 text-xs text-stone-400">{(k as any).creado_por ?? '—'}</td>
                      <td className="px-3 py-3 text-xs text-stone-400">{k.nota ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-stone-400 p-3">{inventarioFiltrado.length} movimiento{inventarioFiltrado.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {tabReporte === 'productos' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-amber-800">🛍️ Reporte de Productos</h3>
            <Acciones tipo="productos" tab="productos" />
          </div>
          <Filtros f={fProductos} setF={setFProductos} err={errProductos} setErr={setErrProductos} />
          {vista['productos'] === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KPI label="Total productos" value={productosFiltrados.length} />
                <KPI label="Stock total (uds)" value={productosFiltrados.reduce((a, p) => a + p.cantidad, 0)} color="text-amber-700" />
                <KPI label="Valor en stock" value={`$${productosFiltrados.reduce((a, p) => a + p.cantidad * Number(p.precio_neto), 0).toLocaleString('es-CO')}`} color="text-green-700" />
                <KPI label="Con stock bajo" value={productosFiltrados.filter(p => (p.cantidad - (p.cantidad_reservada ?? 0)) <= p.stock_minimo).length} color="text-red-600" sub="bajo mínimo" />
              </div>
                            <Grafica title="Stock disponible (menor a mayor)">
                {stockDisponible.length === 0 ? <SinGrafica /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stockDisponible} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={110} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="disponible" name="Disponible" radius={[0, 4, 4, 0]}>
                        {stockDisponible.map((entry, i) => <Cell key={i} fill={entry.bajo ? '#dc2626' : '#b45309'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Grafica>
              <Grafica title="Productos más vistos">
                {masVistos.every(m => m.vistas === 0) ? <SinGrafica /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={masVistos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={110} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="vistas" name="Vistas" radius={[0, 4, 4, 0]} fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Grafica>
            </div>
          )}
          {vista['productos'] === 'tabla' && (
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                  <tr>{['Código', 'Lote', 'Producto', 'Categoría', 'Precio neto', 'PVP', 'IVA', 'Stock', 'Mín.', 'Máx.', 'Estado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {productosFiltrados.length === 0 ? <SinDatos cols={11} /> : productosFiltrados.map(p => {
                    const disponible = p.cantidad - (p.cantidad_reservada ?? 0);
                    const bajo = disponible <= p.stock_minimo;
                    const alto = p.stock_maximo > 0 && disponible >= p.stock_maximo;
                    return (
                      <tr key={p.id} className={`border-t border-amber-50 hover:bg-amber-50/50 ${bajo ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-stone-500">{p.codigo_barra || '—'}</td>
                        <td className="px-4 py-3 text-xs text-stone-400">{p.lote || '—'}</td>
                        <td className="px-4 py-3 font-semibold">{p.nombre}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">{p.categoria_nombre ?? '—'}</span></td>
                        <td className="px-4 py-3 text-stone-600">${Number(p.precio_neto).toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-green-700 font-semibold">{p.precio_final ? `$${Number(p.precio_final).toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '—'}</td>
                        <td className="px-4 py-3 text-stone-500">{p.iva}%</td>
                        <td className="px-4 py-3 font-bold text-center">{disponible}</td>
                        <td className="px-4 py-3 text-center text-stone-400">{p.stock_minimo}</td>
                        <td className="px-4 py-3 text-center text-stone-400">{p.stock_maximo || '—'}</td>
                        <td className="px-4 py-3">
                          {bajo ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">⚠️ Bajo</span>
                            : alto ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">📦 Máximo</span>
                              : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">✓ OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-stone-400 p-3">{productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {tabReporte === 'contable' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-amber-800">📒 Reporte Contable</h3>
            <Acciones tipo="contable" tab="contable" />
          </div>
          <Filtros f={fContable} setF={setFContable} err={errContable} setErr={setErrContable} />
          {vista['contable'] === 'dashboard' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <KPI label="Valor Inventario" value={`$${valorContable.toLocaleString('es-CO')}`} color="text-green-700" />
              <KPI label="Ingresos por ventas" value={`$${contableFiltrado.filter(k => String((k as any).subtipo).toLowerCase() === 'venta').reduce((a, k) => a + k.cantidad * Number((k as any).precio_unitario ?? 0), 0).toLocaleString('es-CO')}`} color="text-amber-700" />
              <KPI label="Movimientos" value={contableFiltrado.length} />
            </div>
          )}
          {vista['contable'] === 'tabla' && (
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                  <tr>{['Fecha', 'Producto', 'Tipo', 'Subtipo', 'Cantidad', 'PVP Unit.', 'Ventas', 'Inventario', 'Pedido ref.', 'Nota'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {contableFiltrado.length === 0 ? <SinDatos cols={10} /> : contableFiltrado.map(k => {
                    const pvp = Number((k as any).precio_unitario ?? 0);
                    const esIngreso = String((k as any).subtipo ?? '').toLowerCase() === 'venta';
                    return (
                      <tr key={k.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                        <td className="px-3 py-3 text-stone-500 whitespace-nowrap">{k.fecha}</td>
                        <td className="px-3 py-3 font-semibold">{k.producto_nombre}</td>
                        <td className="px-3 py-3"><TipoBadge tipo={k.tipo} /></td>
                        <td className="px-3 py-3"><span className="text-xs bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full text-stone-500">{(k as any).subtipo ?? '—'}</span></td>
                        <td className="px-3 py-3 font-bold text-center">{k.cantidad}</td>
                        <td className="px-3 py-3 text-stone-600">{pvp ? `$${pvp.toLocaleString('es-CO')}` : '—'}</td>
                        <td className="px-3 py-3 font-semibold text-green-700">{esIngreso && pvp ? `$${(pvp * k.cantidad).toLocaleString('es-CO')}` : '—'}</td>
                        <td className="px-3 py-3 font-semibold text-amber-700">{!esIngreso && pvp ? `$${(pvp * k.cantidad).toLocaleString('es-CO')}` : '—'}</td>
                        <td className="px-3 py-3 text-xs text-stone-400 font-mono">{(k as any).pedido_ref ?? '—'}</td>
                        <td className="px-3 py-3 text-xs text-stone-400">{k.nota ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-stone-400 p-3">{contableFiltrado.length} registro{contableFiltrado.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}