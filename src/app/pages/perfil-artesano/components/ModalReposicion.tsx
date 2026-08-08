import { useState } from 'react';
import { Producto } from '../../../data/artesanoApi';

interface ModalReposicionProps {
  producto: Producto;
  onClose: () => void;
  onConfirm: (cantidad: number, nota: string, fecha: string) => Promise<void>;
}

export function ModalReposicion({ producto, onClose, onConfirm }: ModalReposicionProps) {
  const [cantidad, setCantidad] = useState(0);
  const [nota, setNota] = useState('');
  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(hoy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stockNuevo = producto.cantidad + (cantidad > 0 ? cantidad : 0);
  const superaMaximo = producto.stock_maximo > 0 && stockNuevo > producto.stock_maximo;

  const handleConfirm = async () => {
    if (cantidad <= 0) return setError('La cantidad debe ser mayor a 0.');
    if (superaMaximo) return setError(`Superaría el stock máximo (${producto.stock_maximo}).`);
    if (!fecha) return setError('La fecha es obligatoria.');
    if (fecha > hoy) return setError('La fecha no puede ser mayor a la actual.');
    setLoading(true);
    try {
      await onConfirm(cantidad, nota, fecha);
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">Fecha de ingreso *</label>
            <input type="date" value={fecha} max={hoy}
              onChange={e => { setFecha(e.target.value); setError(''); }}
              className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
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