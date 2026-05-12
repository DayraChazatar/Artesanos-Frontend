import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  getCategorias, createCategoria, deleteCategoria,
  getProductos,  createProducto,  deleteProducto,
  getKardex,     createKardex,
  type Categoria, type Producto, type Kardex,
} from '../data/artesanoApi';

const ARTESANO_ID: number = Number(localStorage.getItem('usuario_id') ?? 1);
const ARTESANO_NOMBRE: string = localStorage.getItem('usuario_nombre') ?? 'Artesano';

// ── UI helpers ───────────────────────────────────────────────────────────────
const Badge = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{children}</span>
);

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'info' | 'error' }) => {
  const colors = { success: 'bg-green-100 text-green-800 border-green-200', info: 'bg-blue-100 text-blue-800 border-blue-200', error: 'bg-red-100 text-red-800 border-red-200' };
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

// ── Stock badge ──────────────────────────────────────────────────────────────
function StockBadge({ p }: { p: Producto }) {
  if (p.estado_stock === 'bajo' || p.cantidad <= p.stock_minimo)
    return <Badge color="bg-red-100 text-red-700">⚠️ {p.cantidad} (bajo)</Badge>;
  if (p.stock_maximo > 0 && p.cantidad >= p.stock_maximo)
    return <Badge color="bg-blue-100 text-blue-700">📦 {p.cantidad} (máx)</Badge>;
  return <Badge color="bg-green-100 text-green-700">{p.cantidad}</Badge>;
}

// ── Topbar ───────────────────────────────────────────────────────────────────
function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-amber-100 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="font-serif text-lg font-bold text-amber-700">Pakari Shop</span>
        <span className="text-pink-400 text-sm"></span>
      </div>
      <nav>
        <a href="/" className="text-sm text-stone-500 hover:text-amber-700 font-medium transition px-3 py-1.5 rounded-lg hover:bg-amber-50">
          Inicio
        </a>
      </nav>

      {/* Menú de usuario */}
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
    </header>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
type Tab = 'catalogo' | 'contable' | 'productos' | 'inventario';

const NAV_ITEMS: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'catalogo',   icon: '📋', label: 'Catálogo'   },
  { tab: 'contable',   icon: '📒', label: 'Contable'   },
  { tab: 'productos',  icon: '🛍️',  label: 'Productos'  },
  { tab: 'inventario', icon: '📊', label: 'Inventario' },
];

function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <aside className="fixed top-14 left-0 bottom-0 z-20 w-40 bg-white border-r border-amber-100 flex flex-col items-center py-8 gap-4 shadow-sm">
      {NAV_ITEMS.map(({ tab, icon, label }) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          title={label}
          className={`flex flex-col items-center gap-3 w-28 py-6 rounded-2xl text-center transition
            ${active === tab
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-amber-800 hover:bg-amber-50'
            }`}
        >
          <span className="text-5xl leading-none">{icon}</span>
          <span className={`text-sm font-semibold leading-tight ${active === tab ? 'text-white' : 'text-stone-500'}`}>
            {label}
          </span>
        </button>
      ))}
    </aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO CATÁLOGO
// ════════════════════════════════════════════════════════════════════════════
function ModuloCatalogo({ productos }: { productos: Producto[] }) {
  const [visibles, setVisibles] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(productos.map(p => [p.id!, true]))
  );
  const [imagenes, setImagenes] = useState<Record<number, string>>({});
  const [modalImg, setModalImg] = useState<{ nombre: string; src: string } | null>(null);

  useEffect(() => {
    setVisibles(prev => {
      const next = { ...prev };
      productos.forEach(p => { if (p.id !== undefined && !(p.id in next)) next[p.id] = true; });
      return next;
    });
  }, [productos]);

  const toggleVisible = (id: number) =>
    setVisibles(prev => ({ ...prev, [id]: !prev[id] }));

  const handleImagen = (id: number, file: File) => {
    const reader = new FileReader();
    reader.onload = e => setImagenes(prev => ({ ...prev, [id]: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {modalImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalImg(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-stone-800 text-sm">{modalImg.nombre}</span>
              <button onClick={() => setModalImg(null)} className="text-stone-400 hover:text-stone-700 text-lg font-bold leading-none">✕</button>
            </div>
            <img src={modalImg.src} alt={modalImg.nombre} className="w-full rounded-xl object-contain max-h-64" />
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-4">📋 Productos en catálogo</h2>
        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-base">
            <thead className="bg-amber-50 text-sm uppercase tracking-wider text-amber-900/60">
              <tr>{['Código','Lote','Producto','Categoría','Precio neto','IVA','Desc.','Stock','Imagen','Visible'].map(h => <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {productos.map(p => {
                const esVisible = visibles[p.id!] ?? true;
                const imgSrc = imagenes[p.id!];
                return (
                  <tr key={p.id} className={`border-t border-amber-50 transition ${esVisible ? 'hover:bg-amber-50/50' : 'opacity-40 bg-stone-50'}`}>
                    <td className="px-3 py-3 font-mono text-sm">{p.codigo_barra || '—'}</td>
                    <td className="px-3 py-3 text-sm">{p.lote || '—'}</td>
                    <td className="px-3 py-3 font-semibold">{p.nombre}</td>
                    <td className="px-3 py-3"><Badge color="bg-amber-100 text-amber-800">{p.categoria_nombre ?? '—'}</Badge></td>
                    <td className="px-3 py-3">${Number(p.precio_neto).toLocaleString()}</td>
                    <td className="px-3 py-3">{p.iva}%</td>
                    <td className="px-3 py-3">{p.descuento ? <Badge color="bg-green-100 text-green-700">Sí</Badge> : '—'}</td>
                    <td className="px-3 py-3"><StockBadge p={p} /></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {imgSrc ? (
                          <button title="Ver imagen" onClick={() => setModalImg({ nombre: p.nombre, src: imgSrc })} className="relative group">
                            <img src={imgSrc} alt={p.nombre} className="w-9 h-9 rounded-lg object-cover border border-amber-200 group-hover:ring-2 group-hover:ring-amber-400 transition" />
                          </button>
                        ) : (
                          <div className="w-9 h-9 rounded-lg border-2 border-dashed border-amber-200 flex items-center justify-center text-stone-300 text-lg">🖼️</div>
                        )}
                        <label className="cursor-pointer px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 hover:bg-amber-100 transition" title="Subir imagen">
                          📎
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImagen(p.id!, f); }} />
                        </label>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleVisible(p.id!)}
                        title={esVisible ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition shadow-sm
                          ${esVisible ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-stone-100 hover:bg-stone-200 text-stone-400'}`}
                      >
                        {esVisible ? '👁️' : '🚫'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {productos.length === 0 && <tr><td colSpan={10} className="px-4 py-6 text-center text-stone-400">Sin productos</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-stone-400">
          <span className="flex items-center gap-1"><span className="text-green-600">👁️</span> Visible en catálogo</span>
          <span className="flex items-center gap-1"><span>🚫</span> Oculto del catálogo</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO CONTABLE
// ════════════════════════════════════════════════════════════════════════════
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
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Stock actual', value: `${producto.cantidad} uds`, color: producto.cantidad <= producto.stock_minimo ? 'text-red-600' : 'text-green-700' },
                { label: 'Stock mínimo', value: `${producto.stock_minimo} uds`, color: 'text-stone-800' },
                { label: 'Stock máximo', value: `${producto.stock_maximo} uds`, color: 'text-stone-800' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex-1 min-w-[120px] bg-amber-50 rounded-xl px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-amber-900/60 font-semibold mb-1">{label}</div>
                  <div className={`text-sm font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Precio Neto', value: `$${Number(producto.precio_neto).toLocaleString()}` },
                { label: 'IVA', value: `${producto.iva}%` },
                { label: '¿Descuento?', value: producto.descuento ? `Sí (${producto.valor_descuento}%)` : 'No' },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 min-w-[120px] bg-amber-50 rounded-xl px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-amber-900/60 font-semibold mb-1">{label}</div>
                  <div className="text-sm font-semibold text-stone-800">{value}</div>
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

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO PRODUCTOS + CATEGORÍAS
// ════════════════════════════════════════════════════════════════════════════
function generarCodigo(productos: Producto[]): string {
  const ultimo = productos
    .map(p => p.codigo_barra)
    .filter(c => c?.startsWith('PROD-'))
    .map(c => parseInt(c!.replace('PROD-', '')) || 0)
    .sort((a, b) => b - a)[0] ?? 0;
  return `PROD-${String(ultimo + 1).padStart(4, '0')}`;
}

function generarLote(productos: Producto[]): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const ultimo = productos
    .map(p => p.lote)
    .filter(l => l?.match(/^\d{6}-\d{4}$/))
    .map(l => parseInt(l!.split('-')[1]) || 0)
    .sort((a, b) => b - a)[0] ?? 0;
  return `${anio}${mes}-${String(ultimo + 1).padStart(4, '0')}`;
}

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

function ModuloProductos({ productos, setProductos, categorias, setCategorias }: {
  productos: Producto[];   setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  categorias: Categoria[]; setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
}) {
  const [tabLocal, setTabLocal] = useState<'producto' | 'categoria' | 'lista'>('categoria');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [archivos, setArchivos] = useState<string[]>([]);

  const colorPickerRef = useRef<HTMLInputElement>(null);
  const colorNombreRef = useRef<HTMLInputElement>(null);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500);
  };

  const [prod, setProd] = useState<Omit<Producto, 'id'>>({
    codigo_barra: '', lote: '',
    nombre: '', categoria: null,
    precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0,
    // ✅ CONTROL DE STOCK — vive aquí, en el producto
    cantidad: 0, stock_minimo: 0, stock_maximo: 0,
    artesano: ARTESANO_ID,
    colores: [],
    maneja_tallas: false,
    tallas: [],
  });

  useEffect(() => {
    const codigo = generarCodigo(productos);
    const lote   = generarLote(productos);
    setProd(prev => ({
      ...prev,
      codigo_barra: prev.codigo_barra || codigo,
      lote:         prev.lote         || lote,
    }));
  }, [productos]);

  const handleAddProducto = async () => {
    if (!prod.nombre || !prod.precio_neto)
      return showAlert('Nombre y precio son obligatorios', 'error');
    if (prod.cantidad < 0 || prod.stock_minimo < 0 || prod.stock_maximo < 0)
      return showAlert('Los valores de stock no pueden ser negativos', 'error');
    if (prod.stock_maximo > 0 && prod.stock_minimo > prod.stock_maximo)
      return showAlert('El stock mínimo no puede ser mayor al máximo', 'error');
    if (prod.descuento && (prod.valor_descuento ?? 0) <= 0)
      return showAlert('El porcentaje de descuento debe ser mayor a 0', 'error');
    if (prod.descuento && (prod.valor_descuento ?? 0) >= 100)
      return showAlert('El descuento no puede ser 100% o más', 'error');
    setLoading(true);
    try {
      const nuevo = await createProducto(prod);
      setProductos(prev => [...prev, nuevo]);
      const nuevoCodigo = generarCodigo([...productos, nuevo]);
      const nuevoLote   = generarLote([...productos, nuevo]);
      setProd({
        codigo_barra: nuevoCodigo, lote: nuevoLote,
        nombre: '', categoria: null,
        precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0,
        cantidad: 0, stock_minimo: 0, stock_maximo: 0,
        artesano: ARTESANO_ID,
        colores: [], maneja_tallas: false, tallas: [],
      });
      showAlert('✓ Producto creado correctamente');
    } catch (err: any) {
      showAlert(`Error: ${err?.message ?? 'Error desconocido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProducto = async (id: number) => {
    await deleteProducto(id);
    setProductos(prev => prev.filter(p => p.id !== id));
    showAlert('Producto eliminado');
  };

    const handleEditProducto = (id: number) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    setProd({
      codigo_barra: producto.codigo_barra,
      lote: producto.lote,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio_neto: producto.precio_neto,
      iva: producto.iva,
      descuento: producto.descuento,
      valor_descuento: producto.valor_descuento,
      cantidad: producto.cantidad,
      stock_minimo: producto.stock_minimo,
      stock_maximo: producto.stock_maximo,
      artesano: ARTESANO_ID,
      colores: producto.colores ?? [],
      maneja_tallas: producto.maneja_tallas ?? false,
      tallas: producto.tallas ?? [],
    });
    setTabLocal('producto');
  };

  const [cat, setCat] = useState({ nombre: '', descripcion: '' });

  const handleAddCategoria = async () => {
    if (!cat.nombre) return showAlert('El nombre es obligatorio', 'error');
    setLoading(true);
    try {
      const nueva = await createCategoria({ ...cat, artesano: ARTESANO_ID });
      setCategorias(prev => [...prev, nueva]);
      setCat({ nombre: '', descripcion: '' });
      showAlert('✓ Categoría creada correctamente');
    } catch { showAlert('Error al guardar la categoría', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteCategoria = async (id: number) => {
    await deleteCategoria(id);
    setCategorias(prev => prev.filter(c => c.id !== id));
  };

  const handleEditCategoria = (id: number) => {
  const categoria = categorias.find(c => c.id === id);
  if (!categoria) return;
  setCat({
    nombre: categoria.nombre,
    descripcion: categoria.descripcion,
  });
  setTabLocal('categoria'); // lleva al formulario de categoría
};

  const handleAgregarColor = () => {
    const nombre = colorNombreRef.current?.value.trim() ?? '';
    const hex    = colorPickerRef.current?.value ?? '#c8a96e';
    if (!nombre) return;
    setProd(prev => ({ ...prev, colores: [...(prev.colores ?? []), { hex, nombre }] }));
    if (colorNombreRef.current) colorNombreRef.current.value = '';
    if (colorPickerRef.current) colorPickerRef.current.value = '#c8a96e';
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.toLowerCase();
    const nombreConocido = HEX_MAP[hex];
    if (nombreConocido && colorNombreRef.current && colorNombreRef.current.value === '') {
      colorNombreRef.current.value = nombreConocido;
    }
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nombre = e.target.value.trim().toLowerCase();
    const hexConocido = COLOR_MAP[nombre];
    if (hexConocido && colorPickerRef.current) {
      colorPickerRef.current.value = hexConocido;
    }
  };

  const tabCls = (t: string) => `px-4 py-2 rounded-xl text-sm font-semibold transition ${tabLocal === t ? 'bg-amber-700 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`;

  return (
    <div className="space-y-5">
      {alert && <Alert msg={alert.msg} type={alert.type} />}
      <div className="flex gap-3 flex-wrap">
        <button className={tabCls('categoria')} onClick={() => setTabLocal('categoria')}>🏷️ Nueva Categoría</button>
        <button className={tabCls('producto')}  onClick={() => setTabLocal('producto')}>➕ Nuevo Producto</button>
        <button className={tabCls('lista')}     onClick={() => setTabLocal('lista')}>📋 Ver todo</button>
      </div>

      {tabLocal === 'producto' && (
        <div className="space-y-5">
          {/* Selector de imagen */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-4">📂 Seleccionar Imagen</h2>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-xl p-8 cursor-pointer hover:bg-amber-50 transition text-stone-500">
              <span className="text-4xl mb-2">🖼️</span>
              <p className="text-sm">Arrastra imágenes o haz clic para seleccionar</p>
              <span className="text-xs opacity-60 mt-1">JPG, PNG, PDF — máx. 10 MB</span>
              <input type="file" multiple accept="image/*,.pdf" className="hidden"
                onChange={e => setArchivos(Array.from(e.target.files ?? []).map(f => f.name))} />
            </label>
            {archivos.length > 0 && (
              <div className="mt-4 space-y-2">
                {archivos.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm">
                    <span>📄</span>{f}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario producto */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-5">➕ Crear Producto</h2>
            <div className="space-y-4">

              {/* Identificación */}
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

              {/* Nombre y Categoría */}
              <div className="flex flex-wrap gap-4">
                <Field label="Nombre *">
                  <input className={inputCls} value={prod.nombre}
                    onChange={e => setProd({ ...prod, nombre: e.target.value })}
                    placeholder="Ej: Mochila wayuu" />
                </Field>
                <Field label="Categoría">
                  <select className={inputCls} value={prod.categoria ?? ''}
                    onChange={e => setProd({ ...prod, categoria: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">— Seleccionar —</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </Field>
              </div>

              {/* Colores */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[220px] p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">🎨 Colores disponibles</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(prod.colores ?? []).map((color, i) => (
                      <div key={i} className="flex items-center gap-1 bg-white border border-amber-200 rounded-full px-3 py-1 text-sm">
                        <span className="w-3 h-3 rounded-full border border-stone-300 inline-block" style={{ backgroundColor: color.hex }} />
                        <span className="text-stone-700">{color.nombre}</span>
                        <button onClick={() => setProd({ ...prod, colores: (prod.colores ?? []).filter((_, j) => j !== i) })}
                          className="ml-1 text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input ref={colorPickerRef} type="color" className="w-9 h-9 rounded-lg border border-amber-200 cursor-pointer p-0.5" defaultValue="#c8a96e" onChange={handlePickerChange} />
                    <input ref={colorNombreRef} type="text" className={inputCls} placeholder="Ej: Rojo, Azul marino..." onChange={handleNombreChange} />
                    <button onClick={handleAgregarColor} className="px-3 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition whitespace-nowrap">+ Agregar</button>
                  </div>
                  {(prod.colores ?? []).length === 0 && <p className="text-xs text-stone-400 mt-2">Sin colores agregados aún</p>}
                </div>

                {/* Tallas */}
                <div className="flex-1 min-w-[220px] p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                    <input type="checkbox" checked={prod.maneja_tallas ?? false}
                      onChange={e => setProd({ ...prod, maneja_tallas: e.target.checked, tallas: [] })}
                      className="w-4 h-4 accent-orange-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-700">¿Maneja tallas?</span>
                  </label>
                  {prod.maneja_tallas && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {['XS','S','M','L','XL','XXL','6','8','10','12','14','16','Única'].map(t => (
                          <button key={t}
                            onClick={() => {
                              const yaEsta = (prod.tallas ?? []).includes(t);
                              setProd({ ...prod, tallas: yaEsta ? (prod.tallas ?? []).filter(x => x !== t) : [...(prod.tallas ?? []), t] });
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                              (prod.tallas ?? []).includes(t)
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'
                            }`}>{t}</button>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <input id="tallaCustom" type="text" className={inputCls} placeholder="Talla personalizada... Ej: 38" />
                        <button
                          onClick={() => {
                            const val = (document.getElementById('tallaCustom') as HTMLInputElement).value.trim();
                            if (!val || (prod.tallas ?? []).includes(val)) return;
                            setProd({ ...prod, tallas: [...(prod.tallas ?? []), val] });
                            (document.getElementById('tallaCustom') as HTMLInputElement).value = '';
                          }}
                          className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition whitespace-nowrap">
                          + Agregar
                        </button>
                      </div>
                      {(prod.tallas ?? []).length > 0 && (
                        <p className="text-xs text-orange-700 font-semibold mt-2">
                          Tallas seleccionadas: {(prod.tallas ?? []).join(', ')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Precio e IVA */}
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

              {/* Descuento */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={prod.descuento}
                    onChange={e => setProd({ ...prod, descuento: e.target.checked, valor_descuento: 0 })}
                    className="w-4 h-4 accent-orange-600" />
                  <span>¿Obtiene descuento?</span>
                </label>
                {prod.descuento && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-3">
                    <Field label="Porcentaje de descuento (%) *">
                      <input className={inputCls} type="number" min="1" max="99"
                        value={prod.valor_descuento || ''}
                        onChange={e => setProd({ ...prod, valor_descuento: Number(e.target.value) })}
                        placeholder="Ej: 10" />
                    </Field>
                    {prod.precio_neto > 0 && (prod.valor_descuento ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex-1 min-w-[130px] bg-white rounded-xl px-4 py-3 border border-orange-100">
                          <div className="text-xs uppercase tracking-wider text-orange-700/70 font-semibold mb-1">Precio neto</div>
                          <div className="text-lg font-bold text-stone-800">${Number(prod.precio_neto).toLocaleString()}</div>
                        </div>
                        <div className="flex-1 min-w-[130px] bg-white rounded-xl px-4 py-3 border border-orange-100">
                          <div className="text-xs uppercase tracking-wider text-orange-700/70 font-semibold mb-1">Precio con {prod.valor_descuento}% descuento</div>
                          <div className="text-lg font-bold text-green-600">${Math.round(prod.precio_neto * (1 - (prod.valor_descuento ?? 0) / 100)).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ✅ CONTROL DE STOCK — movido aquí, dentro del formulario de producto */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">📦 Control de stock</p>
                <p className="text-xs text-stone-400 mb-3">
                  Estos valores pertenecen al producto. Desde el módulo de inventario solo se registran movimientos.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Field label="Cantidad inicial">
                    <input className={inputCls} type="number" min="0"
                      value={prod.cantidad || ''}
                      onChange={e => setProd({ ...prod, cantidad: Number(e.target.value) })}
                      placeholder="0" />
                    <span className="text-xs text-stone-400">Solo para el primer registro del producto</span>
                  </Field>
                  <Field label="Stock mínimo">
                    <input className={inputCls} type="number" min="0"
                      value={prod.stock_minimo || ''}
                      onChange={e => setProd({ ...prod, stock_minimo: Number(e.target.value) })}
                      placeholder="0" />
                    <span className="text-xs text-stone-400">Activa alerta cuando baje de este valor</span>
                  </Field>
                  <Field label="Stock máximo">
                    <input className={inputCls} type="number" min="0"
                      value={prod.stock_maximo || ''}
                      onChange={e => setProd({ ...prod, stock_maximo: Number(e.target.value) })}
                      placeholder="0" />
                    <span className="text-xs text-stone-400">Referencia de capacidad máxima</span>
                  </Field>
                </div>
                <p className="text-xs text-amber-700 font-medium mt-3">
                  ⚠️ Recibirás alerta cuando el stock baje del mínimo configurado
                </p>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 mt-2">
                <button onClick={handleAddProducto} disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60">
                  {loading ? 'Guardando...' : 'Guardar producto'}
                </button>
                <button onClick={() => {
                  const codigo = generarCodigo(productos);
                  const lote = generarLote(productos);
                  setProd({
                    codigo_barra: codigo, lote,
                    nombre: '', categoria: null,
                    precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0,
                    cantidad: 0, stock_minimo: 0, stock_maximo: 0,
                    artesano: ARTESANO_ID,
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
          <h2 className="font-serif text-xl text-amber-800 mb-5">🏷️ Crear Categoría</h2>
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
              {loading ? 'Guardando...' : 'Guardar categoría'}
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
                <thead className="bg-amber-50 text-sm uppercase tracking-wider text-amber-900/60">
                  <tr>{['Código','Lote','Nombre','Categoría','Precio','IVA','Desc.','Stock','Mín.','Máx.',''].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold text-sm">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                      <td className="px-3 py-3 font-mono text-sm">{p.codigo_barra || '—'}</td>
                      <td className="px-3 py-3 text-sm">{p.lote || '—'}</td>
                      <td className="px-3 py-3 font-semibold">{p.nombre}</td>
                      <td className="px-3 py-3"><Badge color="bg-amber-100 text-amber-800">{p.categoria_nombre ?? '—'}</Badge></td>
                      <td className="px-3 py-3">${Number(p.precio_neto).toLocaleString()}</td>
                      <td className="px-3 py-3">{p.iva}%</td>
                      <td className="px-3 py-3">{p.descuento ? <Badge color="bg-green-100 text-green-700">Sí</Badge> : '—'}</td>
                      <td className="px-3 py-3"><StockBadge p={p} /></td>
                      <td className="px-3 py-3 text-sm text-stone-400">{p.stock_minimo}</td>
                      <td className="px-3 py-3 text-sm text-stone-400">{p.stock_maximo}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => handleEditProducto(p.id!)}
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition">
                          Editar
                        </button>
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
                  <tr>{['Nombre','Descripción',''].map(h => (
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
                          className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition">
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

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO INVENTARIO (Kardex)
// ════════════════════════════════════════════════════════════════════════════
function ModuloInventario({ productos, kardex, setKardex }: {
  productos: Producto[]; kardex: Kardex[]; setKardex: React.Dispatch<React.SetStateAction<Kardex[]>>;
}) {
  // ✅ El form ya NO tiene cantidad_inicial, stock_minimo, stock_maximo
  const [form, setForm] = useState<Omit<Kardex, 'id'>>({
    producto: productos[0]?.id ?? 0,
    tipo: 'Entrada',
    cantidad: 0,
    fecha: '',
    nota: '',
  });
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500);
  };

  const totalEntradas = kardex.filter(k => k.tipo === 'Entrada').reduce((s, k) => s + k.cantidad, 0);
  const totalSalidas  = kardex.filter(k => k.tipo === 'Salida').reduce((s, k) => s + k.cantidad, 0);

  const productosBajoStock = productos.filter(p => p.stock_minimo > 0 && p.cantidad <= p.stock_minimo);

  const kardexFiltrado = kardex.filter(k => {
    if (!k.fecha) return true;
    if (filtroDesde && k.fecha < filtroDesde) return false;
    if (filtroHasta && k.fecha > filtroHasta) return false;
    return true;
  });

  // ✅ Producto seleccionado actualmente en el form — para mostrar su stock de solo lectura
  const productoSeleccionado = productos.find(p => p.id === form.producto);

const handleAdd = async () => {
  if (!form.producto || !form.cantidad || !form.fecha)
    return showAlert('Producto, cantidad y fecha son obligatorios', 'error');
  if (form.cantidad === 0)
    return showAlert('La cantidad no puede ser 0', 'error');

  // ✅ Validación de salida
  if (form.cantidad < 0) {
    const cantidadSalida = Math.abs(form.cantidad);
    if (productoSeleccionado && cantidadSalida > productoSeleccionado.cantidad) {
      return showAlert(
        `Stock insuficiente. Solo hay ${productoSeleccionado.cantidad} unidades disponibles.`,
        'error'
      );
    }
  }

  // ✅ Validación de entrada vs stock máximo
  if (form.cantidad > 0 && productoSeleccionado) {
    const stockResultante = productoSeleccionado.cantidad + form.cantidad;
    if (productoSeleccionado.stock_maximo > 0 && stockResultante > productoSeleccionado.stock_maximo) {
      return showAlert(
        `La entrada superaría el stock máximo (${productoSeleccionado.stock_maximo}). Stock actual: ${productoSeleccionado.cantidad}.`,
        'error'
      );
    }
  }

  const tipoDetectado: 'Entrada' | 'Salida' = form.cantidad > 0 ? 'Entrada' : 'Salida';
  const data = { ...form, tipo: tipoDetectado, cantidad: Math.abs(form.cantidad) };

  setLoading(true);
  try {
    const nuevo = await createKardex(data);
    setKardex(prev => [nuevo, ...prev]);
    setForm({ producto: productos[0]?.id ?? 0, tipo: 'Entrada', cantidad: 0, fecha: '', nota: '' });
    showAlert(`✓ Movimiento registrado (${tipoDetectado})`);
  } catch {
    showAlert('Error al registrar el movimiento', 'error');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-5">
      {/* Alerta de bajo stock */}
      {productosBajoStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700 mb-2">⚠️ Productos con stock bajo:</p>
          {productosBajoStock.map(p => (
            <p key={p.id} className="text-xs text-red-600">
              • {p.nombre} — stock actual: {p.cantidad} (mínimo: {p.stock_minimo})
            </p>
          ))}
        </div>
      )}
      {alert && <Alert msg={alert.msg} type={alert.type} />}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total entradas', val: `+${totalEntradas}`, color: 'text-green-700' },
          { label: 'Total salidas',  val: `-${totalSalidas}`,  color: 'text-red-600'   },
          { label: 'Balance neto',   val: `${totalEntradas - totalSalidas}`, color: 'text-amber-800' },
          { label: 'Movimientos',    val: `${kardex.length}`,  color: 'text-stone-700' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">{label}</div>
            <div className={`font-serif text-2xl font-bold ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Formulario registrar movimiento — limpio, sin campos de stock */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-5">📝 Registrar movimiento</h2>
        <div className="space-y-4">

          <Field label="Producto">
            <select className={inputCls} value={form.producto}
              onChange={e => setForm({ ...form, producto: Number(e.target.value) })}>
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.codigo_barra ? `[${p.codigo_barra}]` : ''}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex flex-wrap gap-4">
            <Field label="Movimiento *">
              <input className={inputCls} type="number"
                value={form.cantidad || ''}
                onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })}
                placeholder="positivo = entrada, negativo = salida" />
            </Field>
            <Field label="Fecha *">
              <input className={inputCls} type="date" value={form.fecha}
                onChange={e => setForm({ ...form, fecha: e.target.value })} />
            </Field>
          </div>

          {form.cantidad !== 0 && (
            <div className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${
              form.cantidad > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {form.cantidad > 0 ? '📥 Se registrará como Entrada' : '📤 Se registrará como Salida'}
            </div>
          )}

          <Field label="Nota u observación">
            <input className={inputCls} value={form.nota}
              onChange={e => setForm({ ...form, nota: e.target.value })}
              placeholder="Ej: venta feria artesanal" />
          </Field>

          {/* ✅ Stock del producto seleccionado — solo lectura, referencia informativa */}
          {productoSeleccionado && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                📊 Stock de "{productoSeleccionado.nombre}"
                <span className="ml-2 font-normal normal-case text-stone-400">(solo lectura — editable desde Productos)</span>
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[100px] bg-white rounded-xl px-4 py-3 border border-stone-100 text-center">
                  <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Stock mínimo</div>
                  <div className="text-lg font-bold text-stone-700">{productoSeleccionado.stock_minimo}</div>
                </div>
                <div className="flex-1 min-w-[100px] bg-white rounded-xl px-4 py-3 border border-stone-100 text-center">
                  <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Stock máximo</div>
                  <div className="text-lg font-bold text-stone-700">{productoSeleccionado.stock_maximo}</div>
                </div>
                <div className="flex-1 min-w-[100px] bg-white rounded-xl px-4 py-3 border border-stone-100 text-center">
                  <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">Stock actual</div>
                  <div className={`text-lg font-bold ${
                    productoSeleccionado.cantidad <= productoSeleccionado.stock_minimo
                      ? 'text-red-600'
                      : 'text-green-700'
                  }`}>{productoSeleccionado.cantidad}</div>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleAdd} disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-700 to-green-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60">
            {loading ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="font-serif text-xl text-amber-800">📊 Historial de movimientos</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Filtrar:</span>
            <div className="flex items-center gap-1">
              <label className="text-xs text-stone-500">Desde</label>
              <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
                className="text-xs border border-amber-200 rounded-lg px-2 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-stone-500">Hasta</label>
              <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
                className="text-xs border border-amber-200 rounded-lg px-2 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
            {(filtroDesde || filtroHasta) && (
              <button onClick={() => { setFiltroDesde(''); setFiltroHasta(''); }}
                className="text-xs px-2 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>

        {(filtroDesde || filtroHasta) && (
          <p className="text-xs text-stone-400 mb-3">
            Mostrando {kardexFiltrado.length} de {kardex.length} movimientos
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
              {/* ✅ Historial limpio: sin columnas Cant. Inicial, Stock Mín., Stock Máx. */}
              <tr>
                {['Producto','Tipo','Movimiento','Fecha','Nota']
                  .map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {kardexFiltrado.map(k => (
                <tr key={k.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                  <td className="px-4 py-3 font-semibold">{k.producto_nombre}</td>
                  <td className="px-4 py-3">
                    <Badge color={k.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {k.tipo === 'Entrada' ? '📥' : '📤'} {k.tipo}
                    </Badge>
                  </td>
                  <td className={`px-4 py-3 font-bold ${k.tipo === 'Entrada' ? 'text-green-700' : 'text-red-600'}`}>
                    {k.tipo === 'Entrada' ? '+' : '-'}{k.cantidad}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{k.fecha || '—'}</td>
                  <td className="px-4 py-3 text-stone-400">{k.nota || '—'}</td>
                </tr>
              ))}
              {kardexFiltrado.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-stone-400">
                    {kardex.length > 0 ? '🔍 Sin movimientos en ese rango de fechas' : 'Sin movimientos'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function PerfilArtesano() {
  const [tab, setTab] = useState<Tab>('catalogo');
  const [productos,  setProductos]  = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [kardex,     setKardex]     = useState<Kardex[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

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
      setError('No se pudo conectar con el servidor. Verifica que Django esté corriendo en localhost:8000');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <div className="min-h-screen bg-amber-50/60 font-sans text-base">
      <Topbar/>
      <Sidebar active={tab} onChange={setTab} />
      <main className="pt-14 pl-40 min-h-screen text-base">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-amber-700 text-sm gap-3">
              <span className="animate-spin text-xl">⏳</span> Cargando datos del servidor...
            </div>
          ) : error ? (
            <Alert msg={error} type="error" />
          ) : (
            <>
              {tab === 'catalogo'   && <ModuloCatalogo   productos={productos} />}
              {tab === 'contable'   && <ModuloContable   productos={productos} />}
              {tab === 'productos'  && <ModuloProductos  productos={productos} setProductos={setProductos} categorias={categorias} setCategorias={setCategorias} />}
              {tab === 'inventario' && <ModuloInventario productos={productos} kardex={kardex} setKardex={setKardex} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}