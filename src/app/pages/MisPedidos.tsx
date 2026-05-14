import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { FileText, XCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { generarFacturaPDF } from '../utils/facturas';
import { toast } from 'sonner';

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: any[];
  customer: { name: string; email: string; phone?: string };
}

const STATUS_STYLES: Record<string, string> = {
  'Pendiente':  'bg-yellow-100 text-yellow-700',
  'En proceso': 'bg-orange-100 text-orange-700',
  'Enviado':    'bg-blue-100 text-blue-700',
  'Entregado':  'bg-green-100 text-green-700',
  'Cancelado':  'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<string, string> = {
  'Pendiente':  '🕐',
  'En proceso': '⚙️',
  'Enviado':    '🚚',
  'Entregado':  '✅',
  'Cancelado':  '❌',
};

export function MisPedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState('Todos');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(saved.slice().reverse());
  }, []);

  const handleCancelOrder = (orderId: string) => {
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status: 'Cancelado' } : o
    );
    setOrders(updated);
    localStorage.setItem('orders', JSON.stringify(updated));
    toast.success('Pedido cancelado');
  };

  const handleFactura = (order: Order) => {
    try {
      generarFacturaPDF(order);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredOrders = filterStatus === 'Todos'
    ? orders
    : orders.filter(o => (o.status || 'Pendiente') === filterStatus);

  const statuses = ['Todos', 'Pendiente', 'En proceso', 'Enviado', 'Entregado', 'Cancelado'];

  const statusCount = (s: string) =>
    s === 'Todos' ? orders.length : orders.filter(o => (o.status || 'Pendiente') === s).length;

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-6xl">

        <div className="mb-4">
          <Link to="/perfil">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver al perfil
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Mis Pedidos</h1>
          <p className="text-gray-500">Revisa el estado y detalle de tus compras</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-14 w-14 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg mb-4">No tienes pedidos aún</p>
            <Link to="/catalogo">
              <Button className="bg-orange-600 hover:bg-orange-700">Explorar Catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-6">

            {/* ESTADOS IZQUIERDA */}
            <div className="w-44 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</p>
                </div>
                <div className="p-2 space-y-1">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between gap-2 ${
                        filterStatus === s
                          ? 'bg-orange-600 text-white font-semibold'
                          : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      <span className="truncate">{s}</span>
                      <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold flex-shrink-0 ${
                        filterStatus === s
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {statusCount(s)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TABLA DERECHA */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No hay pedidos con este estado</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[order.status] || STATUS_STYLES['Pendiente']}`}>
                            {STATUS_ICONS[order.status] || '🕐'} {order.status || 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          #{order.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(order.date).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-[200px]">
                          <div className="truncate">
                            {order.items?.map((item: any) => item.name).join(', ')}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {order.items?.length} {order.items?.length === 1 ? 'producto' : 'productos'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-orange-600">
                          ${order.total.toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleFactura(order)}
                              disabled={order.status?.toLowerCase() === 'cancelado'}
                              title="Descargar Factura"
                              className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            {order.status !== 'Cancelado' && order.status !== 'Entregado' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                title="Cancelar Pedido"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
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
        )}
      </div>
    </div>
  );
}