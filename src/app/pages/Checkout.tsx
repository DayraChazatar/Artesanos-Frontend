import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MapPin, User, CreditCard, FileText, CheckCircle, ShoppingBag, Landmark, Upload, Loader2 } from 'lucide-react';
import { generarReciboPDF } from '../utils/recibos';
import { API_BASE } from '../utils/config';

// Antes estaba escrita a mano aquí — ya existe VITE_WOMPI_PUBLIC_KEY en .env,
// solo faltaba usarla en este archivo.
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY || 'pub_test_6jhHtUtNNHZ6HkikZE9139oIbmtsVXPk';

interface ArtesanoInfo {
  id: number;
  nombre: string;
  tienePagoDirecto: boolean;
}

export function Checkout() {
  const { cart, totalPrice, clearCart, checkout, fijarArtesanoId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const direccionesGuardadas = JSON.parse(
    localStorage.getItem(`addresses_${user?.email}`) || '[]'
  );
  const principal = direccionesGuardadas.find((a: any) => a.isPrimary) || direccionesGuardadas[0] || {};

  const savedAddress = {
    phone: principal.phone || '',
    address: principal.street ? `${principal.street}${principal.neighborhood ? `, ${principal.neighborhood}` : ''}` : '',
    city: principal.city ? `${principal.city}, ${principal.department}` : '',
    postalCode: '',
    notes: principal.reference || '',
  };

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
  const [pedidosCreados, setPedidosCreados] = useState<any[]>([]);
  const [wompiUrls, setWompiUrls] = useState<Record<string, string>>({});
  const [comprobantesSubidos, setComprobantesSubidos] = useState<Record<string, boolean>>({});
  const [subiendoComprobante, setSubiendoComprobante] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  // ── Pago directo por artesano ────────────────────────────────────────────
  const [artesanosInfo, setArtesanosInfo] = useState<Record<number, ArtesanoInfo>>({});
  const [metodosPago, setMetodosPago] = useState<Record<string, 'wompi' | 'transferencia'>>({});

  const totalWithShipping = totalPrice + 10000;

  // El carrito puede tener productos de varios artesanos — cada uno se paga
  // por separado (cada quien recibe su propio dinero, por su propio método).
  const gruposArtesano = useMemo(() => {
    const mapa = new Map<string, { artesanoId: string; nombre: string; items: typeof cart; subtotal: number }>();
    for (const item of cart) {
      const clave = String(item.artesanoId ?? 'sin-artesano');
      if (!mapa.has(clave)) mapa.set(clave, { artesanoId: clave, nombre: item.artisan, items: [], subtotal: 0 });
      const grupo = mapa.get(clave)!;
      grupo.items.push(item);
      grupo.subtotal += item.price * item.quantity;
    }
    return Array.from(mapa.values());
  }, [cart]);

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    fetch(`${API_BASE}/usuarios/artesanos/`, { headers: token ? { Authorization: `Token ${token}` } : {} })
      .then(r => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        const info: Record<number, ArtesanoInfo> = {};
        (Array.isArray(data) ? data : []).forEach(a => {
          info[a.id] = { id: a.id, nombre: a.nombre, tienePagoDirecto: !!a.tiene_pago_directo };
        });
        setArtesanosInfo(info);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const { name, email, phone, address, city, postalCode } = formData;
    setFormValid(!!(name && email && phone && address && city && postalCode));
  }, [formData]);

  // Repara productos que quedaron en el carrito ANTES de que existiera el
  // dato del artesano (localStorage viejo) — sin esto, un mismo artesano
  // podía aparecer partido en dos grupos distintos en "Método de pago".
  useEffect(() => {
    const sinArtesano = cart.filter(item => item.artesanoId == null);
    sinArtesano.forEach(item => {
      fetch(`${API_BASE}/productos/${item.id}/`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data?.artesano) fijarArtesanoId(item.id, data.artesano);
        })
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  if (cart.length === 0 && !orderConfirmed && pedidosCreados.length === 0) {
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

  const elegirMetodo = (artesanoId: string, metodo: 'wompi' | 'transferencia') => {
    setMetodosPago(prev => ({ ...prev, [artesanoId]: metodo }));
  };

  const handleConfirmarPedido = async () => {
    if (!formValid) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    const token = localStorage.getItem('token');

    if (!token) {
      toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente');
      return;
    }

    if (!user?.id) {
      toast.error('Debes iniciar sesión para continuar');
      return;
    }

    setProcesando(true);
    try {
      // ── Crear un pedido por cada artesano del carrito ────────────────────
      const result = await checkout({
        clienteId: Number(user.id),
        direccion: `${formData.address}, ${formData.city} ${formData.postalCode}`,
        telefono: formData.phone,
        metodosPago,
      });

      if (!result.ok || !result.pedidos || result.pedidos.length === 0) {
        toast.error(result.error ?? 'Error al crear el pedido');
        return;
      }

      // ── A cada pedido que se paga con Wompi le pedimos su propia firma ───
      const urls: Record<string, string> = {};
      for (const pedido of result.pedidos) {
        if (pedido.metodo_pago !== 'wompi') continue;
        try {
          const integrityResponse = await fetch(`${API_BASE}/inventario/wompi/integrity/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
            body: JSON.stringify({
              reference: String(pedido.id),
              amount_in_cents: Math.round(Number(pedido.total) * 100),
              currency: 'COP',
            }),
          });
          if (integrityResponse.ok) {
            const { signature, amount_in_cents } = await integrityResponse.json();
            const params = new URLSearchParams({
              'public-key': WOMPI_PUBLIC_KEY,
              'currency': 'COP',
              'amount-in-cents': String(amount_in_cents),
              'reference': String(pedido.id),
              'signature:integrity': signature,
              'redirect-url': `${window.location.origin}/pedido-confirmado`,
              'customer-data:email': formData.email,
              'customer-data:full-name': formData.name,
              'customer-data:phone-number': formData.phone,
            });
            urls[String(pedido.id)] = `https://checkout.wompi.co/p/?${params.toString()}`;
          } else {
            toast.error(`No se pudo preparar el pago con Wompi del pedido ${pedido.codigo}`);
          }
        } catch {
          toast.error(`No se pudo preparar el pago con Wompi del pedido ${pedido.codigo}`);
        }
      }

      setWompiUrls(urls);
      setPedidosCreados(result.pedidos);
      setOrderConfirmed(true);
      clearCart();
    } finally {
      setProcesando(false);
    }
  };

  const handleSubirComprobante = async (pedidoId: number, file: File) => {
    setSubiendoComprobante(String(pedidoId));
    try {
      const token = localStorage.getItem('token') ?? '';
      const formDataArchivo = new FormData();
      formDataArchivo.append('comprobante', file);
      const res = await fetch(`${API_BASE}/inventario/pedido/${pedidoId}/comprobante/`, {
        method: 'POST',
        headers: token ? { Authorization: `Token ${token}` } : {},
        body: formDataArchivo,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? 'No se pudo subir el comprobante');
        return;
      }
      setComprobantesSubidos(prev => ({ ...prev, [String(pedidoId)]: true }));
      toast.success('✓ Comprobante subido — el artesano lo revisará pronto');
    } catch {
      toast.error('Error de conexión al subir el comprobante');
    } finally {
      setSubiendoComprobante(null);
    }
  };

  const handleDescargarRecibo = () => {
    try {
      const reciboOrder = {
        id: pedidosCreados.map(p => p.id).join('-'),
        date: pedidosCreados[0]?.fecha,
        items: pedidosCreados.flatMap(p => p.detalles ?? []).length
          ? pedidosCreados.flatMap((p: any) => p.detalles.map((d: any) => ({
              id: d.producto, name: d.producto_nombre, price: Number(d.precio), quantity: d.cantidad,
            })))
          : [],
        total: pedidosCreados.reduce((sum, p) => sum + Number(p.total), 0),
        customer: { name: formData.name, email: formData.email, phone: formData.phone },
        status: 'Pendiente',
      };
      generarReciboPDF(reciboOrder);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (orderConfirmed && pedidosCreados.length > 0) {
    const totalGeneral = pedidosCreados.reduce((sum, p) => sum + Number(p.total), 0);

    return (
      <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 max-w-2xl">

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {pedidosCreados.length > 1 ? '¡Pedidos creados!' : '¡Pedido creado!'}
            </h1>
            <p className="text-gray-600">
              {pedidosCreados.length > 1
                ? `Se registraron ${pedidosCreados.length} pedidos (uno por cada artesano) por un total de $${totalGeneral.toLocaleString('es-CO')}.`
                : <>Tu pedido <strong>{pedidosCreados[0].codigo}</strong> ha sido registrado exitosamente.</>}
            </p>
          </div>

          {/* Un bloque por cada pedido creado (uno por artesano) */}
          <div className="space-y-4 mb-6">
            {pedidosCreados.map((pedido: any) => (
              <Card key={pedido.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{pedido.codigo} — {pedido.artesano_nombre || 'Artesano'}</span>
                    <span className="text-orange-600">${Number(pedido.total).toLocaleString('es-CO')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pedido.detalles?.map((d: any) => (
                    <div key={d.id} className="flex justify-between text-sm text-gray-600">
                      <span>{d.producto_nombre} x{d.cantidad}</span>
                      <span>${Number(d.subtotal).toLocaleString('es-CO')}</span>
                    </div>
                  ))}

                  {pedido.metodo_pago === 'wompi' ? (
                    <Button
                      onClick={() => { if (wompiUrls[pedido.id]) window.location.href = wompiUrls[pedido.id]; }}
                      disabled={!wompiUrls[pedido.id]}
                      className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl mt-2"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pagar con Wompi
                    </Button>
                  ) : (
                    <div className="mt-2 space-y-3">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                        <p className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <Landmark className="h-4 w-4" /> Transfiere a esta cuenta
                        </p>
                        <div className="space-y-1 text-blue-900">
                          <p><span className="text-blue-600">Banco:</span> {pedido.pago_directo_banco}</p>
                          <p><span className="text-blue-600">Tipo de cuenta:</span> {pedido.pago_directo_tipo_cuenta}</p>
                          <p><span className="text-blue-600">Número:</span> {pedido.pago_directo_numero}</p>
                          <p><span className="text-blue-600">Titular:</span> {pedido.pago_directo_titular}</p>
                          <p className="font-semibold pt-1">Monto exacto: ${Number(pedido.total).toLocaleString('es-CO')}</p>
                        </div>
                      </div>

                      {comprobantesSubidos[String(pedido.id)] || pedido.comprobante_url ? (
                        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" /> Comprobante subido — queda pendiente de que el artesano lo confirme.
                        </p>
                      ) : (
                        <div>
                          <Label htmlFor={`comprobante-${pedido.id}`} className="text-xs text-gray-500 mb-1 block">
                            Sube la foto del comprobante de tu transferencia
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`comprobante-${pedido.id}`}
                              type="file"
                              accept="image/*"
                              disabled={subiendoComprobante === String(pedido.id)}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleSubirComprobante(pedido.id, file);
                              }}
                              className="text-sm"
                            />
                            {subiendoComprobante === String(pedido.id) && <Loader2 className="h-4 w-4 animate-spin text-orange-600" />}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleDescargarRecibo}
              variant="outline"
              className="w-full h-12 border-orange-600 text-orange-600 hover:bg-orange-50 text-base font-semibold rounded-xl"
            >
              <FileText className="mr-2 h-5 w-5" />
              Descargar Recibo
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
                  <CreditCard className="h-5 w-5" /> Método de pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {gruposArtesano.map(grupo => {
                  const info = artesanosInfo[Number(grupo.artesanoId)];
                  const tienePagoDirecto = !!info?.tienePagoDirecto;
                  const metodoActual = metodosPago[grupo.artesanoId] ?? 'wompi';
                  return (
                    <div key={grupo.artesanoId} className="border border-gray-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        Productos de {grupo.nombre} <span className="text-gray-400 font-normal">— ${grupo.subtotal.toLocaleString('es-CO')}</span>
                      </p>
                      <p className="text-xs text-gray-500 mb-3">{grupo.items.length} producto{grupo.items.length !== 1 ? 's' : ''}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button type="button" onClick={() => elegirMetodo(grupo.artesanoId, 'wompi')}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition ${metodoActual === 'wompi' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <CreditCard className="h-5 w-5 text-orange-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Pagar con Wompi</p>
                            <p className="text-xs text-gray-500">Tarjeta, PSE o Nequi</p>
                          </div>
                        </button>

                        <button type="button"
                          onClick={() => tienePagoDirecto && elegirMetodo(grupo.artesanoId, 'transferencia')}
                          disabled={!tienePagoDirecto}
                          title={tienePagoDirecto ? undefined : 'Este artesano todavía no activó el pago directo'}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition ${!tienePagoDirecto ? 'border-gray-100 opacity-50 cursor-not-allowed' : metodoActual === 'transferencia' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <Landmark className="h-5 w-5 text-orange-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Transferencia directa</p>
                            <p className="text-xs text-gray-500">{tienePagoDirecto ? 'Sin comisión, confirmación manual' : 'No disponible'}</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                  onClick={handleConfirmarPedido}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={!formValid || procesando}
                >
                  {procesando ? 'Procesando...' : 'Confirmar pedido'}
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
