import { useState, useEffect, useRef } from 'react';
import {
  Producto, Categoria, Kardex,
  createCategoria, updateCategoria,
  updateProducto, reponerStock,
} from '../../../data/artesanoApi';
import { ModalReposicion } from '../components/ModalReposicion';

const ARTESANO_ID = Number(localStorage.getItem('usuario_id') ?? 1);

const inputCls = 'px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';

const Alert = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => {
  const colors = { success: 'bg-green-100 text-green-800 border-green-200', error: 'bg-red-100 text-red-800 border-red-200' };
  return <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}>{msg}</div>;
};

const Badge = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{children}</span>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
    <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">{label}</label>
    {children}
  </div>
);

const BannerCategoria = ({ categoria }: { categoria: Categoria | undefined }) => {
  if (!categoria) return (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 mb-4">
      ⚠️ Aún no tienes una categoría asignada. Contacta al administrador.
    </div>
  );
  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
      <span className="text-xl">🏷️</span>
      <p className="text-sm text-stone-700">
        Tu categoría: <strong className="text-amber-800">{categoria.nombre}</strong>
        <span className="text-stone-400"> — todos tus productos se registran aquí automáticamente</span>
      </p>
    </div>
  );
};

function StockBadge({ p }: { p: Producto }) {
  const reservado = p.cantidad_reservada ?? 0;
  const disponible = p.cantidad - reservado;
  if (disponible <= p.stock_minimo)
    return <Badge color="bg-red-100 text-red-700">⚠️ {disponible} disp.</Badge>;
  if (p.stock_maximo > 0 && disponible >= p.stock_maximo)
    return <Badge color="bg-blue-100 text-blue-700">📦 {disponible} (máx)</Badge>;
  return <Badge color="bg-green-100 text-green-700">{disponible}</Badge>;
}

function generarCodigo(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROD-${timestamp}${random}`;
}

function generarLote(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4);
  return `${anio}${mes}-${timestamp}`;
}

const formatMiles = (valor: number | string): string => {
  if (valor === undefined || valor === null || valor === '') return '';
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (!num || isNaN(num) || num === 0) return '';
  return Math.round(num).toLocaleString('es-CO');
};

const parseMiles = (valor: string): number => {
  const limpio = valor.replace(/\D/g, '');
  return limpio ? Number(limpio) : 0;
};

const COLOR_MAP: Record<string, string> = {
  'rojo': '#ff0000', 'verde': '#00ff00', 'azul': '#0000ff',
  'amarillo': '#ffff00', 'naranja': '#ffa500', 'morado': '#800080',
  'rosado': '#ffc0cb', 'café': '#a52a2a', 'gris': '#808080',
  'negro': '#000000', 'blanco': '#ffffff', 'dorado': '#c8a96e',
};
const HEX_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_MAP).map(([nombre, hex]) => [hex, nombre])
);

interface ModuloProductosProps {
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  categorias: Categoria[];
  setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
  imagenes: Record<number, string>;
  setImagenes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onIrAInventario: (productoId: number) => void;
}

export function ModuloProductos({
  productos, setProductos, categorias, setCategorias,
  imagenes, setImagenes, onIrAInventario,
}: ModuloProductosProps) {
  const [tabLocal, setTabLocal] = useState<'producto' | 'lista'>('producto');
  const [busqueda, setBusqueda] = useState('');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
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
    artesano: ARTESANO_ID, colores: [], maneja_tallas: false, tallas: [], precio_pvp: 0,
  });

  useEffect(() => {
    setProd(prev => ({
      ...prev,
      codigo_barra: prev.codigo_barra || generarCodigo(),
      lote: prev.lote || generarLote(),
    }));
  }, []);

  const [cat, setCat] = useState({ nombre: '', descripcion: '' });

  const handleAddProducto = async () => {
    if (!prod.nombre || !prod.precio_neto) return showAlert('Nombre y precio son obligatorios', 'error');
    if (!editandoId && (!prod.cantidad || prod.cantidad <= 0)) return showAlert('La cantidad inicial es obligatoria y debe ser mayor a 0', 'error');
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
        formData.append('codigo_barra', prod.codigo_barra || '');
        formData.append('lote', prod.lote || '');
        formData.append('nombre', prod.nombre);
        formData.append('precio_neto', String(prod.precio_neto));
        formData.append('precio_pvp', String((prod as any).precio_pvp || ''));
        formData.append('iva', String(prod.iva));
        formData.append('cantidad', String(prod.cantidad));
        formData.append('stock_minimo', String(prod.stock_minimo));
        formData.append('stock_maximo', String(prod.stock_maximo));
        formData.append('artesano', String(prod.artesano));
        formData.append('descuento', String(prod.descuento));
        formData.append('valor_descuento', String(prod.valor_descuento));
        const categoriaId = categorias[0]?.id;
        if (categoriaId) formData.append('categoria', String(categoriaId));
        if (imagenFile) formData.append('imagen', imagenFile);

        const response = await fetch('http://127.0.0.1:8000/api/productos/', { method: 'POST', body: formData });
        if (!response.ok) { const error = await response.json(); throw new Error(JSON.stringify(error)); }
        const nuevo = await response.json();
        setProductos(prev => [...prev, nuevo]);
        if (nuevo.id && nuevo.imagen_url) setImagenes(prev => ({ ...prev, [nuevo.id]: nuevo.imagen_url }));
        setImagenFile(null);
        setArchivos([]);
        setProd({ codigo_barra: generarCodigo(), lote: generarLote(), nombre: '', categoria: categorias[0]?.id ?? null, precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0, cantidad: 0, stock_minimo: 0, stock_maximo: 0, artesano: ARTESANO_ID, colores: [], maneja_tallas: false, tallas: [] });
        showAlert('✓ Producto creado correctamente');
      }
    } catch (err: any) {
      showAlert(`Error: ${err?.message ?? 'Error desconocido'}`, 'error');
    } finally { setLoading(false); }
  };

  const handleEditProducto = (id: number) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    setEditandoId(id);
    setProd({
      codigo_barra: producto.codigo_barra, lote: producto.lote,
      nombre: producto.nombre, categoria: producto.categoria,
      precio_neto: producto.precio_neto, iva: producto.iva,
      precio_pvp: (producto as any).precio_pvp ?? 0,
      descuento: producto.descuento, valor_descuento: producto.valor_descuento,
      cantidad: producto.cantidad, stock_minimo: producto.stock_minimo,
      stock_maximo: producto.stock_maximo, artesano: ARTESANO_ID,
      colores: producto.colores ?? [], maneja_tallas: producto.maneja_tallas ?? false,
      tallas: producto.tallas ?? [],
    });
    setTabLocal('producto');
  };

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
    } catch { showAlert('Error al guardar la categoría', 'error'); }
    finally { setLoading(false); }
  };

  const tabCls = (t: string) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition ${tabLocal === t ? 'bg-amber-700 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`;

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigo_barra ?? '').toLowerCase().includes(busqueda.toLowerCase())
  );
  return (
    <div className="space-y-5">
      {modalStockProd && (
        <ModalReposicion producto={modalStockProd} onClose={() => setModalStockProd(null)}
          onConfirm={async (cantidad, nota) => {
            const movimiento = await reponerStock({ producto: modalStockProd.id!, cantidad, nota });
            setProductos(prev => prev.map(p => p.id === modalStockProd.id ? { ...p, cantidad: movimiento.stock_resultante ?? p.cantidad } : p));
          }} />
      )}

      {alert && <Alert msg={alert.msg} type={alert.type} />}

      <div className="flex gap-3 flex-wrap">
        <button className={tabCls('producto')} onClick={() => setTabLocal('producto')}>➕ Nuevo Producto</button>
        <button className={tabCls('lista')} onClick={() => setTabLocal('lista')}>📋 Ver todo</button>
      </div>

      {tabLocal === 'producto' && (
        <div className="space-y-5">
          <BannerCategoria categoria={categorias[0]} />
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-4">📂 Seleccionar Imagen</h2>
            <div onClick={() => document.getElementById('input-imagen')?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-xl p-8 cursor-pointer hover:bg-amber-50 transition text-stone-500">
              <span className="text-4xl mb-2">🖼️</span>
              <p className="text-sm">{archivos.length > 0 ? archivos[0] : 'Arrastra imágenes o haz clic para seleccionar'}</p>
              <span className="text-xs opacity-60 mt-1">JPG, PNG — máx. 10 MB</span>
              {imagenFile && <img src={URL.createObjectURL(imagenFile)} className="mt-3 h-24 w-24 object-cover rounded-xl border border-amber-200" />}
            </div>
            <input id="input-imagen" type="file" accept="image/*" className="hidden"
              onChange={e => { const file = e.target.files?.[0]; if (file) { setImagenFile(file); setArchivos([file.name]); } }} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-5">{editandoId ? '✏️ Editar Producto' : '➕ Crear Producto'}</h2>
            <p className="text-xs text-stone-400 mb-5">Los campos marcados con <span className="text-red-500 font-semibold">*</span> son obligatorios</p>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">🔖 Identificación</p>
                <div className="flex flex-wrap gap-4">
                  <Field label="Código de barra / QR 🔒">
                    <input className={`${inputCls} bg-amber-100 cursor-not-allowed`} value={prod.codigo_barra || ''} readOnly />
                    <span className="text-xs text-stone-400">Generado automáticamente</span>
                  </Field>
                  <Field label="Lote 🔒">
                    <input className={`${inputCls} bg-amber-100 cursor-not-allowed`} value={prod.lote || ''} readOnly />
                    <span className="text-xs text-stone-400">Generado automáticamente</span>
                  </Field>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Field label="Nombre *">
                  <input className={inputCls} value={prod.nombre} onChange={e => setProd({ ...prod, nombre: e.target.value })} placeholder="Ej: Mochila wayuu" />
                </Field>
                <Field label="Categoría">
                  <div className={`${inputCls} bg-amber-100 cursor-not-allowed text-stone-600`}>{categorias[0]?.nombre ?? '—'}</div>
                  <span className="text-xs text-stone-400">Asignada automáticamente a tu perfil</span>
                </Field>
              </div>

              <div className="flex flex-wrap gap-4">
                <Field label="Precio neto *">
                  <input
                    className={inputCls}
                    type="text"
                    inputMode="numeric"
                    value={formatMiles(prod.precio_neto)}
                    onChange={e => setProd({ ...prod, precio_neto: parseMiles(e.target.value) })}
                    placeholder="0"
                  />
                </Field>
                <Field label="Precio venta al público (PVP)">
                  <input
                    className={inputCls}
                    type="text"
                    inputMode="numeric"
                    value={formatMiles((prod as any).precio_pvp)}
                    onChange={e => setProd({ ...prod, precio_pvp: parseMiles(e.target.value) } as any)}
                    placeholder="Ej: 25.000"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={prod.descuento} onChange={e => setProd({ ...prod, descuento: e.target.checked, valor_descuento: 0 })} className="w-4 h-4 accent-orange-600" />
                <span>¿Obtiene descuento?</span>
              </label>
              {prod.descuento && (
                <Field label="Porcentaje de descuento (%) *">
                  <input className={inputCls} type="number" min="1" max="99" value={prod.valor_descuento || ''} onChange={e => setProd({ ...prod, valor_descuento: Number(e.target.value) })} placeholder="Ej: 10" />
                </Field>
              )}

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">📦 Control de stock</p>
                <div className="flex flex-wrap gap-4">
                  {editandoId ? (
                    <>
                      <div className="flex-1 min-w-[120px] bg-amber-100 rounded-xl px-4 py-3 border border-amber-200">
                        <div className="text-xs uppercase tracking-wider text-amber-700/60 font-semibold mb-1">Stock actual (solo lectura)</div>
                        <div className="text-lg font-bold text-stone-600">{prod.cantidad} uds.</div>
                      </div>
                      <Field label="Stock mínimo">
                        <input className={inputCls} type="number" min="0" value={prod.stock_minimo || ''} onChange={e => setProd({ ...prod, stock_minimo: Number(e.target.value) })} />
                      </Field>
                      <Field label="Stock máximo">
                        <input className={inputCls} type="number" min="0" value={prod.stock_maximo || ''} onChange={e => setProd({ ...prod, stock_maximo: Number(e.target.value) })} />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Cantidad inicial *">
                        <input className={inputCls} type="number" min="0" value={prod.cantidad || ''} onChange={e => setProd({ ...prod, cantidad: Number(e.target.value) })} placeholder="0" />
                      </Field>
                      <Field label="Stock mínimo">
                        <input className={inputCls} type="number" min="0" value={prod.stock_minimo || ''} onChange={e => setProd({ ...prod, stock_minimo: Number(e.target.value) })} placeholder="0" />
                      </Field>
                      <Field label="Stock máximo">
                        <input className={inputCls} type="number" min="0" value={prod.stock_maximo || ''} onChange={e => setProd({ ...prod, stock_maximo: Number(e.target.value) })} placeholder="0" />
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
                <button onClick={() => { setEditandoId(null); setProd({ codigo_barra: generarCodigo(), lote: generarLote(), nombre: '', categoria: null, precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0, cantidad: 0, stock_minimo: 0, stock_maximo: 0, artesano: ARTESANO_ID, colores: [], maneja_tallas: false, tallas: [] }); }}
                  className="px-5 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition">
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {tabLocal === 'lista' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <BannerCategoria categoria={categorias[0]} />
          <h2 className="font-serif text-xl text-amber-800 mb-4">📦 Productos registrados</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              className={`${inputCls} flex-1 min-w-[200px]`}
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-amber-100">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                <tr>{['Código', 'Lote', 'Nombre', 'Precio', 'IVA', 'Desc.', 'Stock', 'Mín.', 'Máx.', 'Acciones'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {productosFiltrados.map(p => (
                  <tr key={p.id} className={`border-t border-amber-50 transition ${(p.cantidad - (p.cantidad_reservada ?? 0)) <= p.stock_minimo ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-amber-50/50'}`}>
                    <td className="px-3 py-3 font-mono text-xs">{p.codigo_barra || '—'}</td>
                    <td className="px-3 py-3 text-xs">{p.lote || '—'}</td>
                    <td className="px-3 py-3 font-semibold">{p.nombre}</td>
                    <td className="px-3 py-3">${Number(p.precio_neto).toLocaleString('es-CO')}</td>
                    <td className="px-3 py-3">{p.iva}%</td>
                    <td className="px-3 py-3">{p.descuento ? <Badge color="bg-green-100 text-green-700">Sí</Badge> : '—'}</td>
                    <td className="px-3 py-3"><StockBadge p={p} /></td>
                    <td className="px-3 py-3 text-xs text-stone-400">{p.stock_minimo}</td>
                    <td className="px-3 py-3 text-xs text-stone-400">{p.stock_maximo}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditProducto(p.id!)} className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition">Editar</button>
                        <button onClick={() => onIrAInventario(p.id!)} className="px-3 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold hover:bg-stone-200 transition">Inventario →</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}