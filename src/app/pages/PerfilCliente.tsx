import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, FileText, Palette, Package, Camera, ShoppingBag, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { generarFacturaPDF } from '../utils/facturas';

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: any[];
  customer: { name: string; email: string; phone?: string };
}

export function Profile() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', bio: '', specialty: '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'perfil' | 'pedidos'>('perfil');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) {
      setFormData({
        name: user.name || '', email: user.email || '',
        phone: user.phone || '', address: user.address || '',
        bio: user.bio || '', specialty: user.specialty || '',
      });
      if (user.profileImage) setPreviewImage(user.profileImage);
    }
    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(savedOrders);
  }, [user, isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewImage(base64);
        updateProfile({ profileImage: base64 });
        localStorage.setItem(`profileImage_${user?.email}`, base64);
        toast.success('Foto de perfil actualizada');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status: 'Cancelado' } : o
    );
    setOrders(updated);
    localStorage.setItem('orders', JSON.stringify(updated));
    toast.success('Pedido cancelado');
  };

  const handleReturnOrder = (orderId: string) => {
    const updated = orders.map(o =>
      o.id === orderId ? { ...o, status: 'Devolución solicitada' } : o
    );
    setOrders(updated);
    localStorage.setItem('orders', JSON.stringify(updated));
    toast.success('Devolución solicitada correctamente');
  };

  // ✅ Función que maneja la generación de factura con validación
  // Usa toast en vez de alert para que sea consistente con tu UI
  const handleGenerarFactura = (order: Order) => {
    try {
      generarFacturaPDF(order);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregado': return 'bg-green-100 text-green-700';
      case 'Cancelado': return 'bg-red-100 text-red-700';
      case 'Devolución solicitada': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Entregado': return <CheckCircle className="h-4 w-4" />;
      case 'Cancelado': return <XCircle className="h-4 w-4" />;
      case 'Devolución solicitada': return <RotateCcw className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!user) return null;

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal y pedidos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-24 h-24 bg-orange-100 rounded-full overflow-hidden flex items-center justify-center">
                    {previewImage ? (
                      <img src={previewImage} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-orange-600" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-orange-600 hover:bg-orange-700 text-white rounded-full p-1.5 shadow-md transition-colors"
                    title="Cambiar foto"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
                <h3 className="font-bold text-2xl mb-1 text-orange-600 tracking-wide">{user.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                  {user.role === 'artisan' ? 'Artesano' : user.role === 'admin' ? 'Administrador' : 'Cliente'}
                </span>
                <p className="text-xs text-gray-400 mt-3">Haz clic en la cámara para cambiar tu foto</p>
              </CardContent>
            </Card>

            {/* Navegación */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <button
                  onClick={() => setActiveTab('perfil')}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'perfil' ? 'bg-orange-100 text-orange-700 font-medium' : 'hover:bg-gray-100'}`}
                >
                  <User className="h-4 w-4" /> Información Personal
                </button>
                <button
                  onClick={() => setActiveTab('pedidos')}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'pedidos' ? 'bg-orange-100 text-orange-700 font-medium' : 'hover:bg-gray-100'}`}
                >
                  <ShoppingBag className="h-4 w-4" /> Mis Pedidos
                  {orders.length > 0 && (
                    <span className="ml-auto bg-orange-600 text-white text-xs rounded-full px-2 py-0.5">{orders.length}</span>
                  )}
                </button>
              </CardContent>
            </Card>

            {user.role === 'artisan' && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Acciones Rápidas</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/producto/crear">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      <Package className="mr-2 h-4 w-4" /> Crear Producto
                    </Button>
                  </Link>
                  <Link to="/catalogo">
                    <Button variant="outline" className="w-full">Ver Mis Productos</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {activeTab === 'perfil' ? (
              <Card>
                <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Nombre Completo
                      </Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Correo Electrónico
                      </Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled className="bg-gray-100" />
                      <p className="text-xs text-gray-500">El correo electrónico no se puede cambiar</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Teléfono
                      </Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+57 300 123 4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Dirección
                      </Label>
                      <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Calle 123 #45-67" />
                    </div>
                    {user.role === 'artisan' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="specialty" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" /> Especialidad
                          </Label>
                          <Input id="specialty" name="specialty" value={formData.specialty} onChange={handleChange} placeholder="Ej: Cerámica, Tallado, Barniz de Pasto" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Biografía
                          </Label>
                          <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Cuéntanos sobre tu trabajo artesanal..." rows={4} />
                        </div>
                      </>
                    )}
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Guardar Cambios</Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Mis Pedidos</CardTitle></CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">No tienes pedidos aún</p>
                        <Link to="/catalogo">
                          <Button className="mt-4 bg-orange-600 hover:bg-orange-700">Explorar Catálogo</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <Card key={order.id} className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-semibold">Pedido #{order.id.slice(-6)}</p>
                                  <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString('es-CO')}</p>
                                </div>
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)} {order.status || 'Pendiente'}
                                </span>
                              </div>
                              <div className="border-t pt-3 mb-3">
                                {order.items?.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between text-sm py-1">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="font-semibold text-orange-600">Total: ${order.total.toLocaleString('es-CO')}</p>
                                <div className="flex gap-2">
                                  {order.status !== 'Cancelado' && order.status !== 'Entregado' && order.status !== 'Devolución solicitada' && (
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleCancelOrder(order.id)}>
                                      <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                                    </Button>
                                  )}
                                  {order.status === 'Entregado' && (
                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => handleReturnOrder(order.id)}>
                                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Devolver
                                    </Button>
                                  )}
                                  {/* ✅ Botón deshabilitado si el pedido está cancelado */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-300 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={order.status?.toLowerCase().trim() === 'cancelado'}
                                    onClick={() => handleGenerarFactura(order)}
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-1" /> Factura
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}