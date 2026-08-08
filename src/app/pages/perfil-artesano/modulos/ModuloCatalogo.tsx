import { useState } from 'react';
import { Producto } from '../../../data/artesanoApi';

const Badge = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{children}</span>
);

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

interface ModuloCatalogoProps {
  productos: Producto[];
  imagenes: Record<number, string>;
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
}

export function ModuloCatalogo({ productos, imagenes, setProductos }: ModuloCatalogoProps) {
  const [modalImg, setModalImg] = useState<{ nombre: string; src: string } | null>(null);

  const toggleVisible = async (id: number) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    const nuevoVisible = !(producto.visible ?? true);
    const res = await fetch(`http://localhost:8000/api/productos/${id}/visibilidad/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: nuevoVisible }),
    });
    if (!res.ok) { alert(`No se pudo cambiar la visibilidad. Código: ${res.status}`); return; }
    const actualizado = await res.json();
    setProductos(prev => prev.map(p => p.id === id ? { ...p, visible: actualizado.visible } : p));
  };

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
                {['Código', 'Lote', 'Producto', 'Categoría', 'Precio neto', 'Precio Final', 'IVA', 'Desc.', 'Stock', 'Imagen', 'Visible'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map(p => {
                const esVisible = p.visible ?? true;
                return (
                  <tr key={p.id} className={`border-t border-amber-50 transition ${esVisible ? 'hover:bg-amber-50/50' : 'opacity-40 bg-stone-50'}`}>
                    <td className="px-3 py-3 font-mono text-sm">{p.codigo_barra || '—'}</td>
                    <td className="px-3 py-3 text-sm">{p.lote || '—'}</td>
                    <td className="px-3 py-3 font-semibold">{p.nombre}</td>
                    <td className="px-3 py-3"><Badge color="bg-amber-100 text-amber-800">{p.categoria_nombre ?? '—'}</Badge></td>
                    <td className="px-3 py-3">${Number(p.precio_neto).toLocaleString()}</td>
                    <td className="px-3 py-3">
                      {p.precio_final
                        ? <span className="font-semibold text-green-700">${Number(p.precio_final).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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