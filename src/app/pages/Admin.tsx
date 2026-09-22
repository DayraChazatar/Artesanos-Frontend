import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/config';

const BASE = API_BASE;

const authHeaders = () => ({ Authorization: `Token ${localStorage.getItem('token') ?? ''}` });

interface UsuarioAdmin {
  id: number;
  nombre: string;
  correo: string;
  tipo: 'cliente' | 'artesano';
  telefono?: string;
  activo: boolean;
  categoria_id?: number | null;
  categoria_nombre?: string | null;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Pedido {
  id: number;
  codigo: string;
  cliente_nombre: string;
  artesano_nombre: string;
  estado: string;
  total: number;
  metodo_pago: string;
  fecha: string;
}

type Tab = 'artesanos' | 'clientes' | 'pedidos';

const ESTADOS_PEDIDO = [
  'Pago pendiente', 'Pago confirmado', 'Pendiente', 'En proceso', 'Enviado', 'Entregado',
  'Cancelado', 'Devolucion solicitada', 'Devolucion aprobada', 'Devolucion rechazada',
];

const ESTADO_COLOR: Record<string, string> = {
  'Pago pendiente': 'bg-amber-100 text-amber-700',
  'Pago confirmado': 'bg-emerald-100 text-emerald-700',
  'Pendiente': 'bg-yellow-100 text-yellow-700',
  'En proceso': 'bg-orange-100 text-orange-700',
  'Enviado': 'bg-blue-100 text-blue-700',
  'Entregado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
  'Devolucion solicitada': 'bg-purple-100 text-purple-700',
  'Devolucion aprobada': 'bg-teal-100 text-teal-700',
  'Devolucion rechazada': 'bg-red-100 text-red-700',
};

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${
    type === 'success' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
  }`}>
    {msg}
  </div>
);

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('artesanos');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [artesanos, setArtesanos] = useState<UsuarioAdmin[]>([]);
  const [clientes, setClientes] = useState<UsuarioAdmin[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const [qArtesanos, setQArtesanos] = useState('');
  const [qClientes, setQClientes] = useState('');
  const [qPedidos, setQPedidos] = useState('');
  const [estadoPedidos, setEstadoPedidos] = useState('');

  const mostrarAlerta = (msg: string, type: 'success' | 'error') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const cargarUsuarios = useCallback(async () => {
    try {
      const [rArt, rCli, rCat] = await Promise.all([
        fetch(`${BASE}/admin/usuarios/?tipo=artesano`, { headers: authHeaders() }),
        fetch(`${BASE}/admin/usuarios/?tipo=cliente`, { headers: authHeaders() }),
        // ?disponibles=true trae TODAS las categorías — sin el parámetro,
        // este endpoint solo devuelve la categoría propia de quien pregunta
        // (pensado para el artesano), que para un admin siempre es ninguna.
        fetch(`${BASE}/categorias/?disponibles=true`, { headers: authHeaders() }),
      ]);
      setArtesanos(rArt.ok ? await rArt.json() : []);
      setClientes(rCli.ok ? await rCli.json() : []);
      setCategorias(rCat.ok ? await rCat.json() : []);
    } catch {
      mostrarAlerta('No se pudo conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarPedidos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (estadoPedidos) params.set('estado', estadoPedidos);
      if (qPedidos) params.set('q', qPedidos);
      const r = await fetch(`${BASE}/admin/pedidos/?${params}`, { headers: authHeaders() });
      setPedidos(r.ok ? await r.json() : []);
    } catch {
      mostrarAlerta('No se pudieron cargar los pedidos', 'error');
    }
  }, [estadoPedidos, qPedidos]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);
  useEffect(() => { if (tab === 'pedidos') cargarPedidos(); }, [tab, cargarPedidos]);

  const handleLogout = () => { logout(); navigate('/'); };

  const cambiarCategoria = async (u: UsuarioAdmin, categoriaId: string) => {
    try {
      const r = await fetch(`${BASE}/admin/usuarios/${u.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ categoria_id: categoriaId === '' ? null : Number(categoriaId) }),
      });
      const data = await r.json();
      if (!r.ok) return mostrarAlerta(data.error ?? 'No se pudo cambiar la categoría', 'error');
      setArtesanos(prev => prev.map(a => a.id === u.id ? { ...a, categoria_id: data.categoria_id, categoria_nombre: data.categoria_nombre } : a));
      mostrarAlerta(`✓ Categoría de ${u.nombre} actualizada`, 'success');
    } catch {
      mostrarAlerta('Error de conexión', 'error');
    }
  };

  const toggleActivo = async (u: UsuarioAdmin, lista: 'artesanos' | 'clientes') => {
    const accion = u.activo ? 'suspender' : 'reactivar';
    if (!window.confirm(`¿Seguro que quieres ${accion} la cuenta de ${u.nombre}? ${u.activo ? 'No podrá iniciar sesión ni usar la página hasta que la reactives.' : ''}`)) return;
    try {
      const r = await fetch(`${BASE}/admin/usuarios/${u.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ activo: !u.activo }),
      });
      const data = await r.json();
      if (!r.ok) return mostrarAlerta(data.error ?? 'No se pudo cambiar el estado de la cuenta', 'error');
      const setter = lista === 'artesanos' ? setArtesanos : setClientes;
      setter(prev => prev.map(x => x.id === u.id ? { ...x, activo: data.activo } : x));
      mostrarAlerta(`✓ Cuenta de ${u.nombre} ${data.activo ? 'reactivada' : 'suspendida'}`, 'success');
    } catch {
      mostrarAlerta('Error de conexión', 'error');
    }
  };

  const artesanosFiltrados = artesanos.filter(a =>
    !qArtesanos || a.nombre.toLowerCase().includes(qArtesanos.toLowerCase()) || a.correo.toLowerCase().includes(qArtesanos.toLowerCase())
  );
  const clientesFiltrados = clientes.filter(c =>
    !qClientes || c.nombre.toLowerCase().includes(qClientes.toLowerCase()) || c.correo.toLowerCase().includes(qClientes.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-amber-50/60 font-sans text-base">
      {/* Barra superior — distinta de la del cliente/artesano, para que quede claro que es otra vista */}
      <nav className="sticky top-0 z-50 border-b bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <span className="font-serif text-xl font-bold">Pakari Shop — Administración</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-300 hidden sm:block">{user?.name}</span>
            <button onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm font-semibold transition">
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {alert && <Alert msg={alert.msg} type={alert.type} />}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-3">
          {([
            ['artesanos', `🧵 Artesanos (${artesanos.length})`],
            ['clientes', `🛍️ Clientes (${clientes.length})`],
            ['pedidos', '📦 Pedidos'],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                tab === id ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Ayuda rápida por pestaña — para quien no usa esto todos los días */}
        <p className="text-xs text-stone-500 mb-6">
          {tab === 'artesanos' && 'Aquí asignas la categoría de cada artesano y puedes suspender una cuenta si hace falta (no podrá iniciar sesión ni vender mientras esté suspendida).'}
          {tab === 'clientes' && 'Aquí puedes suspender la cuenta de un cliente si hace falta (no podrá iniciar sesión mientras esté suspendida). Suspender no borra su información.'}
          {tab === 'pedidos' && 'Vista de solo consulta: aquí ves todos los pedidos de la página, pero los cambios de estado (confirmar pago, marcar enviado, etc.) los hace cada artesano desde su propio panel.'}
        </p>

        {loading ? (
          <p className="text-stone-400 text-sm">Cargando...</p>
        ) : tab === 'artesanos' ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-amber-100">
              <input value={qArtesanos} onChange={e => setQArtesanos(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full max-w-sm px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-amber-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Correo</th>
                  <th className="text-left px-4 py-3">Teléfono</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {artesanosFiltrados.map(a => (
                  <tr key={a.id} className="border-t border-amber-50">
                    <td className="px-4 py-3 font-medium text-stone-800">{a.nombre}</td>
                    <td className="px-4 py-3 text-stone-500">{a.correo}</td>
                    <td className="px-4 py-3 text-stone-500">{a.telefono || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={a.categoria_id ?? ''} onChange={e => cambiarCategoria(a, e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-xs focus:outline-none focus:border-amber-500">
                        <option value="">— Sin categoría —</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {a.activo ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActivo(a, 'artesanos')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          a.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}>
                        {a.activo ? 'Suspender' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {artesanosFiltrados.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-400">No hay artesanos que coincidan.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        ) : tab === 'clientes' ? (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-amber-100">
              <input value={qClientes} onChange={e => setQClientes(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full max-w-sm px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-amber-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Correo</th>
                  <th className="text-left px-4 py-3">Teléfono</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map(c => (
                  <tr key={c.id} className="border-t border-amber-50">
                    <td className="px-4 py-3 font-medium text-stone-800">{c.nombre}</td>
                    <td className="px-4 py-3 text-stone-500">{c.correo}</td>
                    <td className="px-4 py-3 text-stone-500">{c.telefono || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.activo ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActivo(c, 'clientes')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          c.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}>
                        {c.activo ? 'Suspender' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">No hay clientes que coincidan.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-amber-100 flex flex-wrap gap-3">
              <input value={qPedidos} onChange={e => setQPedidos(e.target.value)}
                placeholder="Buscar por código, cliente o artesano..."
                className="flex-1 min-w-[220px] px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-sm focus:outline-none focus:border-amber-500" />
              <select value={estadoPedidos} onChange={e => setEstadoPedidos(e.target.value)}
                className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-sm focus:outline-none focus:border-amber-500">
                <option value="">Todos los estados</option>
                {ESTADOS_PEDIDO.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-amber-700 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Código</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Artesano</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Método</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id} className="border-t border-amber-50">
                    <td className="px-4 py-3 font-mono text-xs text-stone-600">{p.codigo}</td>
                    <td className="px-4 py-3 text-stone-700">{p.cliente_nombre}</td>
                    <td className="px-4 py-3 text-stone-700">{p.artesano_nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ESTADO_COLOR[p.estado] ?? 'bg-stone-100 text-stone-600'}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{p.metodo_pago === 'transferencia' ? 'Transferencia' : 'Wompi'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-800">${Number(p.total).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-stone-400 text-xs">{new Date(p.fecha).toLocaleDateString('es-CO')}</td>
                  </tr>
                ))}
                {pedidos.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-400">No hay pedidos que coincidan.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
