import { useState } from 'react';
import { Notificacion, Tab } from '../types';

interface SidebarNotificacionesProps {
  notificaciones: Notificacion[];
  marcarLeida: (id: number) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  onNavegar: (tab: Tab, productoId?: number) => void;
}

export function SidebarNotificaciones({
  notificaciones, marcarLeida, marcarTodasLeidas, onNavegar,
}: SidebarNotificacionesProps) {
  const [detalle, setDetalle] = useState<Notificacion | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'pedido' | 'stock'>('todas');

  const iconoTipo = (tipo: string) =>
    tipo === 'stock' ? '📦' : tipo === 'pedido' ? '🛍️' : '🔔';

  const handleClick = async (n: Notificacion) => {
    await marcarLeida(n.id);
    setDetalle(n);
  };

  const filtradas = filtro === 'todas'
    ? notificaciones
    : notificaciones.filter(n => n.tipo === filtro);

  return (
    <aside className="fixed top-16 right-0 bottom-0 z-20 w-64 bg-white border-l border-amber-100 flex flex-col shadow-sm">
      <div className="flex items-center justify-between px-5 py-5 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔔</span>
          <span className="font-serif text-base font-bold text-amber-800">Notificaciones</span>
        </div>
        {notificaciones.filter(n => !n.leida).length > 0 && (
          <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {notificaciones.filter(n => !n.leida).length}
          </span>
        )}
      </div>

      {detalle ? (
        <div className="flex-1 overflow-y-auto p-5">
          <button onClick={() => setDetalle(null)}
            className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 mb-4 font-semibold transition">
            ← Volver
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">{iconoTipo(detalle.tipo)}</span>
            <span className="font-semibold text-stone-800 text-sm">{detalle.titulo}</span>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed mb-4">{detalle.detalle}</p>
          <p className="text-xs text-stone-400 mb-5">{detalle.fecha}</p>
          {detalle.ruta && (
            <button
              onClick={() => {
                if (detalle.tipo === 'stock' && detalle.referencia_id) {
                  onNavegar('inventario', detalle.referencia_id);
                } else {
                  onNavegar(detalle.ruta!.replace('/', '') as Tab);
                }
                setDetalle(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              {detalle.tipo === 'pedido' ? '🛍️ Ir a pedidos' : '📦 Ir a inventario'} →
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-3">
          <div className="flex gap-2 px-4 pb-3">
            {(['todas', 'pedido', 'stock'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${filtro === f ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700'}`}>
                {f === 'todas' ? 'Todas' : f === 'pedido' ? 'Pedidos' : 'Inventario'}
              </button>
            ))}
          </div>

          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-10 text-center">
              <span className="text-5xl">🔔</span>
              <p className="text-sm font-semibold text-stone-500">Todo al día por ahora</p>
              <p className="text-xs text-stone-400 leading-relaxed">
                Aquí verás alertas de nuevos pedidos, stock bajo y devoluciones en tiempo real.
              </p>
              <div className="mt-2 flex flex-col gap-2 w-full">
                {['🛍️ Nuevos pedidos de clientes', '📦 Alertas de stock bajo', '↩️ Solicitudes de devolución'].map(item => (
                  <div key={item} className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {filtradas.filter(n => !n.leida).length > 0 && (
                <button onClick={marcarTodasLeidas}
                  className="w-full text-xs text-amber-600 hover:text-amber-800 font-semibold px-5 py-2 text-right transition">
                  Marcar todas como leídas
                </button>
              )}
              {filtradas.map(n => (
                <button key={n.id} onClick={() => handleClick(n)}
                  className={`w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-amber-50 transition border-b border-amber-50 last:border-0 ${!n.leida ? 'bg-amber-50/60' : ''}`}>
                  <span className="text-2xl mt-0.5 leading-none">{iconoTipo(n.tipo)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-sm font-semibold truncate ${!n.leida ? 'text-stone-800' : 'text-stone-400'}`}>
                        {n.titulo}
                      </span>
                      {!n.leida && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{n.detalle}</p>
                    {n.ruta && <span className="text-xs text-amber-500 font-semibold mt-1 inline-block">Toca para ver →</span>}
                    <p className="text-xs text-stone-300 mt-1">{n.fecha}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </aside>
  );
}