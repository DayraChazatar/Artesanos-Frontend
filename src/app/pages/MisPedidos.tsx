import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import {
  FileText, XCircle, ShoppingBag, ArrowLeft, RotateCcw,
  AlertCircle, Eye, Upload, X, MessageSquare, Search,
  CalendarDays, ChevronLeft, ChevronRight
} from 'lucide-react';
import { generarFacturaPDF } from '../utils/facturas';
import { toast } from 'sonner';

interface ReturnRequest {
  reason: string;
  photos: string[];
  date: string;
  adminResponse?: string;
  adminPhotos?: string[];
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: any[];
  customer: { name: string; email: string; phone?: string };
  returnRequest?: ReturnRequest;
}

const STATUS_STYLES: Record<string, string> = {
  'Pendiente':             'bg-yellow-100 text-yellow-700',
  'En proceso':            'bg-orange-100 text-orange-700',
  'Enviado':               'bg-blue-100 text-blue-700',
  'Entregado':             'bg-green-100 text-green-700',
  'Cancelado':             'bg-red-100 text-red-700',
  'Devolución solicitada': 'bg-purple-100 text-purple-700',
  'Devuelto':              'bg-teal-100 text-teal-700',
  'Rechazado':             'bg-red-200 text-red-800',
};

const STATUS_ICONS: Record<string, string> = {
  'Pendiente':             '🕐',
  'En proceso':            '⚙️',
  'Enviado':               '🚚',
  'Entregado':             '✅',
  'Cancelado':             '❌',
  'Devolución solicitada': '🔄',
  'Devuelto':              '↩️',
  'Rechazado':             '🚫',
};

const MOTIVOS = [
  'Producto defectuoso o dañado',
  'Producto incorrecto (color, talla u otro)',
  'El producto no corresponde a la descripción',
  'Llegó incompleto',
  'Otro motivo',
];

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// ─── Mini Calendario ──────────────────────────────────────────────────────────
function CalendarPicker({
  selectedDate, onSelect, onClear, orderDates,
}: {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onClear: () => void;
  orderDates: Set<string>;
}) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const selectedLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="relative" ref={ref}>
      {/* Botón trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-all ${
          selectedDate
            ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium'
            : 'border-gray-200 text-gray-600 hover:border-orange-300 bg-white'
        }`}
      >
        <CalendarDays className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline">{selectedLabel ?? 'Filtrar por fecha'}</span>
        <span className="sm:hidden">{selectedDate ? selectedLabel : 'Fecha'}</span>
        {selectedDate && (
          <span
            onClick={e => { e.stopPropagation(); onClear(); }}
            className="ml-1 text-orange-400 hover:text-orange-600 transition"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {/* Dropdown calendario */}
      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-72 left-0">
          {/* Cabecera mes/año */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 transition">
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 transition">
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Celdas del mes */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day  = i + 1;
              const key  = toKey(viewYear, viewMonth, day);
              const hasOrders = orderDates.has(key);
              const isSelected = selectedDate === key;
              const isToday = key === toKey(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <button
                  key={key}
                  onClick={() => { onSelect(key); setOpen(false); }}
                  className={`relative h-8 w-8 mx-auto rounded-full text-xs font-medium transition-all flex items-center justify-center
                    ${isSelected
                      ? 'bg-orange-600 text-white shadow'
                      : isToday
                        ? 'border border-orange-400 text-orange-600 hover:bg-orange-50'
                        : hasOrders
                          ? 'text-gray-800 hover:bg-orange-50'
                          : 'text-gray-400 hover:bg-gray-100'
                    }`}
                >
                  {day}
                  {/* Punto indicador de pedidos */}
                  {hasOrders && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" /> Tiene pedidos
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border border-orange-400 inline-block" /> Hoy
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal: Solicitar Devolución ──────────────────────────────────────────────
function ReturnModal({ order, onClose, onSubmit }: {
  order: Order;
  onClose: () => void;
  onSubmit: (reason: string, photos: string[]) => void;
}) {
  const [motivo,  setMotivo]  = useState('');
  const [detalle, setDetalle] = useState('');
  const [photos,  setPhotos]  = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPhotos(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    if (!motivo)        { toast.error('Selecciona el motivo de la devolución'); return; }
    if (!detalle.trim()) { toast.error('Describe el problema con más detalle'); return; }
    onSubmit(`${motivo}: ${detalle}`, photos);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Solicitar devolución</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pedido #{order.id.slice(-6).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm">
            <p className="font-medium text-gray-800 mb-1">{order.items?.map((i: any) => i.name).join(', ')}</p>
            <p className="text-xs text-gray-400">{order.items?.length} {order.items?.length === 1 ? 'producto' : 'productos'} · ${order.total.toLocaleString('es-CO')}</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 font-medium mb-1">📋 Ten en cuenta</p>
            <p className="text-xs text-blue-600">Las devoluciones aplican únicamente por defectos de fabricación, producto incorrecto o daño en el envío. El artesano responderá en 2 a 5 días hábiles.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Cuál es el motivo? <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              {MOTIVOS.map(m => (
                <button key={m} onClick={() => setMotivo(m)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition ${motivo === m ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe el problema <span className="text-red-500">*</span></label>
            <textarea value={detalle} onChange={e => setDetalle(e.target.value)} rows={3}
              placeholder="Ej: El jarrón llegó con una grieta en la base..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fotos del problema <span className="text-gray-400 font-normal">(muy recomendado)</span>
            </label>
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-2 text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors">
              <Upload className="h-6 w-6" />
              <span className="text-sm font-medium">Subir fotos del producto</span>
              <span className="text-xs">JPG, PNG — máx. 5 fotos</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            {photos.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {photos.map((p, i) => (
                  <div key={i} className="relative group">
                    <img src={p} alt={`foto-${i + 1}`} className="h-20 w-20 object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <RotateCcw className="h-4 w-4" /> Enviar solicitud
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Ver detalle devolución ────────────────────────────────────────────
function DetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const rr = order.returnRequest;
  const isRejected = order.status === 'Rechazado';
  const isApproved = order.status === 'Devuelto';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isRejected ? '🚫 Devolución rechazada' : isApproved ? '✅ Devolución aprobada' : '🔄 Solicitud en revisión'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">Respuesta del artesano</span>
              </div>
              <p className="text-sm text-red-700">{rr?.adminResponse || 'El artesano rechazó la solicitud sin dejar un mensaje.'}</p>
              {rr?.adminPhotos && rr.adminPhotos.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-red-500 mb-2 font-medium">Evidencia del artesano:</p>
                  <div className="flex gap-2 flex-wrap">
                    {rr.adminPhotos.map((p, i) => (
                      <img key={i} src={p} className="h-20 w-20 object-cover rounded-xl border border-red-200 cursor-pointer hover:opacity-80 transition" onClick={() => window.open(p, '_blank')} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isApproved && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4">
              <p className="text-sm font-semibold text-green-700 mb-1">✅ Devolución aprobada</p>
              <p className="text-sm text-green-600">{rr?.adminResponse || 'El artesano aprobó tu solicitud. Pronto recibirás instrucciones para el reembolso o reenvío.'}</p>
            </div>
          )}

          {!isRejected && !isApproved && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
              <p className="text-sm text-purple-700 font-medium">🔄 Tu solicitud está siendo revisada</p>
              <p className="text-xs text-purple-500 mt-1">El artesano responderá en 2 a 5 días hábiles.</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Tu descripción del problema</p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">{rr?.reason || '—'}</p>
          </div>

          {rr?.photos && rr.photos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Fotos que enviaste</p>
              <div className="flex gap-2 flex-wrap">
                {rr.photos.map((p, i) => (
                  <img key={i} src={p} className="h-20 w-20 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition" onClick={() => window.open(p, '_blank')} />
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Solicitud enviada el {rr?.date ? new Date(rr.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta móvil ────────────────────────────────────────────────────────────
function OrderCard({ order, onReturn, onDetail, onCancel, onFactura }: {
  order: Order;
  onReturn: () => void;
  onDetail: () => void;
  onCancel: () => void;
  onFactura: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[order.status] || STATUS_STYLES['Pendiente']}`}>
          {STATUS_ICONS[order.status] || '🕐'} {order.status || 'Pendiente'}
        </span>
        <span className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString('es-CO')}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-sm">#{order.id.slice(-6).toUpperCase()}</span>
        <span className="font-bold text-orange-600">${order.total.toLocaleString('es-CO')}</span>
      </div>

      <div>
        <p className="text-sm text-gray-600 truncate">{order.items?.map((i: any) => i.name).join(', ')}</p>
        <p className="text-xs text-gray-400 mt-0.5">{order.items?.length} {order.items?.length === 1 ? 'producto' : 'productos'}</p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50">
        <button onClick={onFactura}
          disabled={order.status?.toLowerCase() === 'cancelado'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          <FileText className="h-3.5 w-3.5" /> Factura
        </button>

        {order.status !== 'Cancelado' && order.status !== 'Entregado' &&
          order.status !== 'Devolución solicitada' && order.status !== 'Devuelto' && order.status !== 'Rechazado' && (
          <button onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition text-xs font-medium">
            <XCircle className="h-3.5 w-3.5" /> Cancelar
          </button>
        )}

        {order.status === 'Entregado' && (
          <button onClick={onReturn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" /> Solicitar devolución
          </button>
        )}

        {(order.status === 'Devolución solicitada' || order.status === 'Devuelto' || order.status === 'Rechazado') && (
          <button onClick={onDetail}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition text-xs font-medium ${
              order.status === 'Rechazado' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              : order.status === 'Devuelto' ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
              : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
            }`}>
            {order.status === 'Rechazado' ? <><AlertCircle className="h-3.5 w-3.5" /> Ver rechazo</>
              : order.status === 'Devuelto' ? <><Eye className="h-3.5 w-3.5" /> Ver aprobación</>
              : <><Eye className="h-3.5 w-3.5" /> Ver solicitud</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function MisPedidos() {
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('reciente');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [returnOrder,  setReturnOrder]  = useState<Order | null>(null);
  const [detailOrder,  setDetailOrder]  = useState<Order | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(saved.slice().reverse());
  }, []);

  const saveOrders = (updated: Order[]) => {
    setOrders(updated);
    localStorage.setItem('orders', JSON.stringify(updated));
  };

  const handleCancelOrder = (orderId: string) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: 'Cancelado' } : o);
    saveOrders(updated);
    toast.success('Pedido cancelado');
  };

  const handleFactura = (order: Order) => {
    try { generarFacturaPDF(order); } catch (error: any) { toast.error(error.message); }
  };

  const handleReturnSubmit = (reason: string, photos: string[]) => {
    if (!returnOrder) return;
    const updated = orders.map(o =>
      o.id === returnOrder.id
        ? { ...o, status: 'Devolución solicitada', returnRequest: { reason, photos, date: new Date().toISOString() } }
        : o
    );
    saveOrders(updated);
    setReturnOrder(null);
    toast.success('Solicitud enviada. El artesano la revisará pronto.');
  };

  // Set de fechas que tienen pedidos (formato YYYY-MM-DD)
  const orderDates = new Set(
    orders.map(o => o.date?.slice(0, 10)).filter(Boolean)
  );

  const statuses = ['Todos','Pendiente','En proceso','Enviado','Entregado','Cancelado','Devolución solicitada','Devuelto','Rechazado'];

  const statusCount = (s: string) =>
    s === 'Todos' ? orders.length : orders.filter(o => (o.status || 'Pendiente') === s).length;

  const filteredOrders = orders
    .filter(o => filterStatus === 'Todos' || (o.status || 'Pendiente') === filterStatus)
    .filter(o => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.items?.some((i: any) => i.name?.toLowerCase().includes(q));
    })
    // ── Filtro por fecha ──
    .filter(o => {
      if (!selectedDate) return true;
      return o.date?.slice(0, 10) === selectedDate;
    })
    .sort((a, b) => {
      if (sortBy === 'reciente') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'antiguo')  return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'mayor')    return b.total - a.total;
      if (sortBy === 'menor')    return a.total - b.total;
      return 0;
    });

  const hasActiveFilters = search || filterStatus !== 'Todos' || selectedDate;

  // Mensaje vacío según contexto
  const emptyMessage = selectedDate
    ? `No tienes pedidos el ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`
    : search
      ? `No hay pedidos con "${search}"`
      : orders.length === 0
        ? 'No tienes pedidos aún'
        : `No hay pedidos con estado "${filterStatus}"`;

  const emptySubtext = selectedDate
    ? 'Selecciona otra fecha o limpia el filtro para ver todos tus pedidos.'
    : orders.length > 0
      ? 'Intenta con otro filtro o búsqueda'
      : 'Explora el catálogo y haz tu primer pedido';

  return (
    <div className="py-6 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="mb-4">
          <Link to="/perfil">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver al perfil
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Mis Pedidos</h1>
            <p className="text-gray-500 text-sm">Revisa el estado y detalle de tus compras</p>
          </div>
          <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-1 shadow-sm">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>

        {/* Filtros de estado */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filterStatus === s ? 'bg-orange-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
              }`}>
              {s}
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                filterStatus === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {statusCount(s)}
              </span>
            </button>
          ))}
        </div>

        {/* Buscador, calendario y ordenar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex gap-2">
            {/* Buscador */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por # pedido o nombre del producto..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Calendario */}
            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onClear={() => setSelectedDate(null)}
              orderDates={orderDates}
            />

            {/* Ordenar */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-600">
              <option value="reciente">Más reciente</option>
              <option value="antiguo">Más antiguo</option>
              <option value="mayor">Mayor valor</option>
              <option value="menor">Menor valor</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Mostrando <span className="font-semibold text-orange-600">{filteredOrders.length}</span> de <span className="font-semibold">{orders.length}</span> pedidos
                {selectedDate && (
                  <span className="ml-1 text-gray-400">
                    · {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </p>
              <button
                onClick={() => { setSearch(''); setFilterStatus('Todos'); setSelectedDate(null); }}
                className="text-xs text-red-500 hover:text-red-600 font-medium transition">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Vista móvil — tarjetas */}
        <div className="block lg:hidden space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center px-4">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-500 mb-1">{emptyMessage}</p>
              <p className="text-xs text-gray-400 mb-4">{emptySubtext}</p>
              {orders.length === 0 ? (
                <Link to="/catalogo"><Button className="bg-orange-600 hover:bg-orange-700">Explorar Catálogo</Button></Link>
              ) : (
                <button
                  onClick={() => { setSearch(''); setFilterStatus('Todos'); setSelectedDate(null); }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                  Ver todos los pedidos
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard key={order.id} order={order}
                onReturn={() => setReturnOrder(order)}
                onDetail={() => setDetailOrder(order)}
                onCancel={() => handleCancelOrder(order.id)}
                onFactura={() => handleFactura(order)} />
            ))
          )}
        </div>

        {/* Vista PC — tabla */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Productos</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium mb-1">{emptyMessage}</p>
                    <p className="text-xs text-gray-400 mb-4">{emptySubtext}</p>
                    {orders.length === 0 ? (
                      <Link to="/catalogo"><Button className="bg-orange-600 hover:bg-orange-700">Explorar Catálogo</Button></Link>
                    ) : (
                      <button
                        onClick={() => { setSearch(''); setFilterStatus('Todos'); setSelectedDate(null); }}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                        Ver todos los pedidos
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[order.status] || STATUS_STYLES['Pendiente']}`}>
                        {STATUS_ICONS[order.status] || '🕐'} {order.status || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(order.date).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-[200px]">
                      <div className="truncate">{order.items?.map((item: any) => item.name).join(', ')}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{order.items?.length} {order.items?.length === 1 ? 'producto' : 'productos'}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-orange-600">${order.total.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={() => handleFactura(order)}
                          disabled={order.status?.toLowerCase() === 'cancelado'}
                          title="Descargar Factura"
                          className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          <FileText className="h-4 w-4" />
                        </button>

                        {order.status !== 'Cancelado' && order.status !== 'Entregado' &&
                          order.status !== 'Devolución solicitada' && order.status !== 'Devuelto' && order.status !== 'Rechazado' && (
                          <button onClick={() => handleCancelOrder(order.id)} title="Cancelar Pedido"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        {order.status === 'Entregado' && (
                          <button onClick={() => setReturnOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition text-xs font-medium">
                            <RotateCcw className="h-3.5 w-3.5" /> Solicitar devolución
                          </button>
                        )}

                        {(order.status === 'Devolución solicitada' || order.status === 'Devuelto' || order.status === 'Rechazado') && (
                          <button onClick={() => setDetailOrder(order)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition text-xs font-medium ${
                              order.status === 'Rechazado' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                              : order.status === 'Devuelto' ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                              : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                            }`}>
                            {order.status === 'Rechazado' ? <><AlertCircle className="h-3.5 w-3.5" /> Ver rechazo</>
                              : order.status === 'Devuelto' ? <><Eye className="h-3.5 w-3.5" /> Ver aprobación</>
                              : <><Eye className="h-3.5 w-3.5" /> Ver solicitud</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {returnOrder && <ReturnModal order={returnOrder} onClose={() => setReturnOrder(null)} onSubmit={handleReturnSubmit} />}
      {detailOrder && <DetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}
    </div>
  );
}