import { useState } from 'react';
import { Producto } from '../../../data/artesanoApi';

const inputCls = 'px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-base text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
    <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">{label}</label>
    {children}
  </div>
);

interface ModuloContableProps {
  productos: Producto[];
}

export function ModuloContable({ productos }: ModuloContableProps) {
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