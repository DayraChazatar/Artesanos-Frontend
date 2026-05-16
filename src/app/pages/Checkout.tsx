import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MapPin, User, CreditCard, FileText, CheckCircle, ShoppingBag } from 'lucide-react';
import { generarFacturaPDF } from '../utils/facturas';

const WOMPI_PUBLIC_KEY = 'pub_test_6jhHtUtNNHZ6HkikZE9139oIbmtsVXPk';

export function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

const savedAddress = JSON.parse(
  localStorage.getItem(`direccion_${user?.email}`) || '{}'
);

const [formData, setFormData] = useState({
  name: user?.name || '',
  email: user?.email || '',
  phone: savedAddress.phone || '',
  address: savedAddress.address || '',
  city: savedAddress.city || '',
  postalCode: savedAddress.postalCode || '',
  notes: savedAddress.notes || '',
});

  const [formValid, setFormValid] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [wompiUrl, setWompiUrl] = useState('');

  const totalWithShipping = totalPrice + 10000;

  useEffect(() => {
    const { name, email, phone, address, city, postalCode } = formData;
    setFormValid(!!(name && email && phone && address && city && postalCode));
  }, [formData]);

  if (cart.length === 0 && !orderConfirmed) {
    navigate('/catalogo');
    return null;
  }

const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const updatedData = {
    ...formData,
    [e.target.name]: e.target.value,
  };

  setFormData(updatedData);

  // Guardar automáticamente dirección
  localStorage.setItem(
    `direccion_${user?.email}`,
    JSON.stringify({
      phone: updatedData.phone,
      address: updatedData.address,
      city: updatedData.city,
      postalCode: updatedData.postalCode,
      notes: updatedData.notes,
    })
  );
};

  const handleWompiPayment = () => {
    if (!formValid) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cart,
      total: totalWithShipping,
      customer: { name: formData.name, email: formData.email, phone: formData.phone },
      status: 'Pendiente',
    };
    localStorage.setItem('orders', JSON.stringify([...orders, newOrder]));
    clearCart();

    const params = new URLSearchParams({
      'public-key': WOMPI_PUBLIC_KEY,
      'currency': 'COP',
      'amount-in-cents': String(totalWithShipping * 100),
      'reference': newOrder.id,
      'redirect-url': 'http://localhost:5173/',
      'customer-data:email': formData.email,
      'customer-data:full-name': formData.name,
      'customer-data:phone-number': formData.phone,
    });

    setCurrentOrder(newOrder);
    setWompiUrl(`https://checkout.wompi.co/p/?${params.toString()}`);
    setOrderConfirmed(true);
  };

  const handleDescargarFactura = () => {
    try {
      generarFacturaPDF(currentOrder);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (orderConfirmed && currentOrder) {
    return (
      <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 max-w-2xl">

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Creado!</h1>
            <p className="text-gray-600">Tu pedido <strong>#{currentOrder.id.slice(-6).toUpperCase()}</strong> ha sido registrado exitosamente.</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentOrder.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                </div>
              ))}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${(currentOrder.total - 10000).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Envío</span>
                  <span>$10.000</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-orange-600">${currentOrder.total.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handleDescargarFactura}
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white text-base font-semibold rounded-xl"
            >
              <FileText className="mr-2 h-5 w-5" />
              Descargar Factura
            </Button>

            <Button
              onClick={() => window.location.href = wompiUrl}
              variant="outline"
              className="w-full h-12 border-orange-600 text-orange-600 hover:bg-orange-50 text-base font-semibold rounded-xl"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Continuar al Pago con Wompi
            </Button>

            <Button
              onClick={() => navigate('/catalogo')}
              variant="ghost"
              className="w-full h-12 text-gray-500 rounded-xl"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Seguir Comprando
            </Button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="+57 300 123 4567" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Dirección de Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código Postal *</Label>
                    <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas de Entrega (Opcional)</Label>
                  <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Apartamento, piso, instrucciones especiales..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Métodos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Al hacer clic en "Pagar con Wompi" podrás elegir entre:</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { name: 'Tarjeta', icon: '💳' },
                    { name: 'PSE', icon: '🏦' },
                    { name: 'Efectivo', icon: '💵' },
                  ].map((method) => (
                    <div key={method.name} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg bg-white">
                      <span className="text-2xl mb-1">{method.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{method.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} x {item.quantity}</span>
                      <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${totalPrice.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span>$10.000</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-orange-600">${totalWithShipping.toLocaleString('es-CO')}</span>
                  </div>
                </div>
                <Button
                  onClick={handleWompiPayment}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={!formValid}
                >
                  Pagar con Wompi
                </Button>
                {!formValid && (
                  <p className="text-xs text-gray-500 text-center">Completa todos los campos para continuar</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}