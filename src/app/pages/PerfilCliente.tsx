import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  User, Mail, Phone, MapPin, FileText, Palette, Package, Camera,
  Lock, Heart, Star, Bell, ShoppingBag, Eye, EyeOff, Trash2,
  ChevronRight, Package2, TruckIcon, CheckCircle, AlertCircle
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  artisan?: string;
}

interface Review {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
}

interface NotificationSettings {
  pedidoConfirmado: boolean;
  pedidoEnviado: boolean;
  pedidoEntregado: boolean;
  devolucionRespuesta: boolean;
  favoritoDescuento: boolean;
  nuevoProductoArtesano: boolean;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS_CLIENTE = [
  { id: 'perfil',          label: 'Perfil',           icon: User },
  { id: 'contrasena',      label: 'Contraseña',        icon: Lock },
  { id: 'favoritos',       label: 'Mis Favoritos',     icon: Heart },
  { id: 'resenas',         label: 'Mis Reseñas',       icon: Star },
  { id: 'notificaciones',  label: 'Notificaciones',    icon: Bell },
];

// ─── Estrellas ────────────────────────────────────────────────────────────────
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`h-4 w-4 ${s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

// ─── Sección: Cambio de Contraseña ───────────────────────────────────────────
function TabContrasena({ userEmail }: { userEmail: string }) {
  const [form, setForm]       = useState({ actual: '', nueva: '', confirmar: '' });
  const [show, setShow]       = useState({ actual: false, nueva: false, confirmar: false });
  const [loading, setLoading] = useState(false);

  const toggle = (field: keyof typeof show) => setShow(s => ({ ...s, [field]: !s[field] }));

  const handleSubmit = () => {
    const users: any[] = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex((u: any) => u.email === userEmail);
    if (idx === -1) { toast.error('Usuario no encontrado'); return; }

    if (users[idx].password !== form.actual) {
      toast.error('La contraseña actual no es correcta'); return;
    }
    if (form.nueva.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres'); return;
    }
    if (form.nueva !== form.confirmar) {
      toast.error('Las contraseñas no coinciden'); return;
    }

    setLoading(true);
    setTimeout(() => {
      users[idx].password = form.nueva;
      localStorage.setItem('users', JSON.stringify(users));
      setForm({ actual: '', nueva: '', confirmar: '' });
      setLoading(false);
      toast.success('Contraseña actualizada correctamente ✓');
    }, 800);
  };

  const fields = [
    { key: 'actual',    label: 'Contraseña actual',    placeholder: 'Ingresa tu contraseña actual' },
    { key: 'nueva',     label: 'Nueva contraseña',     placeholder: 'Mínimo 6 caracteres' },
    { key: 'confirmar', label: 'Confirmar contraseña', placeholder: 'Repite la nueva contraseña' },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-orange-600" /> Cambiar Contraseña
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 max-w-md">
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-600">
          🔒 Por seguridad, necesitas ingresar tu contraseña actual para poder cambiarla.
        </div>

        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <div className="relative">
              <Input
                type={show[key] ? 'text' : 'password'}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="pr-10"
              />
              <button type="button" onClick={() => toggle(key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}

        {form.nueva && form.confirmar && (
          <div className={`text-xs flex items-center gap-1 ${form.nueva === form.confirmar ? 'text-green-600' : 'text-red-500'}`}>
            {form.nueva === form.confirmar ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white">
          {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Sección: Favoritos ───────────────────────────────────────────────────────
function TabFavoritos({ userEmail }: { userEmail: string }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`favorites_${userEmail}`) || '[]');
    setFavorites(saved);
  }, [userEmail]);

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem(`favorites_${userEmail}`, JSON.stringify(updated));
    toast.success('Eliminado de favoritos');
  };

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Heart className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500 mb-1">No tienes productos favoritos aún</p>
          <p className="text-xs text-gray-400 mb-4">Guarda los productos que más te gusten para encontrarlos fácilmente</p>
          <Link to="/catalogo">
            <Button className="bg-orange-600 hover:bg-orange-700">Explorar Catálogo</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-orange-600" /> Mis Favoritos
          <span className="text-sm font-normal text-gray-400">({favorites.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {favorites.map(product => (
            <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-200 transition group">
              <div className="w-14 h-14 rounded-xl bg-orange-50 flex-shrink-0 overflow-hidden">
                {product.image
                  ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  : <Package2 className="h-6 w-6 m-auto mt-4 text-orange-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                {product.artisan && <p className="text-xs text-gray-400 truncate">{product.artisan}</p>}
                <p className="text-sm font-bold text-orange-600 mt-0.5">${product.price?.toLocaleString('es-CO')}</p>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                <Link to={`/producto/${product.id}`}>
                  <button className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Link>
                <button onClick={() => removeFavorite(product.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sección: Reseñas ─────────────────────────────────────────────────────────
function TabResenas({ userEmail }: { userEmail: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`reviews_${userEmail}`) || '[]');
    setReviews(saved);
  }, [userEmail]);

  const saveReviews = (updated: Review[]) => {
    setReviews(updated);
    localStorage.setItem(`reviews_${userEmail}`, JSON.stringify(updated));
  };

  const startEdit = (review: Review) => {
    setEditing(review.id);
    setEditText(review.comment);
  };

  const saveEdit = (id: string) => {
    const updated = reviews.map(r => r.id === id ? { ...r, comment: editText } : r);
    saveReviews(updated);
    setEditing(null);
    toast.success('Reseña actualizada');
  };

  const deleteReview = (id: string) => {
    saveReviews(reviews.filter(r => r.id !== id));
    toast.success('Reseña eliminada');
  };

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Star className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500 mb-1">No has dejado reseñas aún</p>
          <p className="text-xs text-gray-400 mb-4">Después de recibir un pedido puedes calificar los productos</p>
          <Link to="/mis-pedidos">
            <Button className="bg-orange-600 hover:bg-orange-700">Ver Mis Pedidos</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-orange-600" /> Mis Reseñas
          <span className="text-sm font-normal text-gray-400">({reviews.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map(review => (
          <div key={review.id} className="p-4 rounded-xl border border-gray-100 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{review.productName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={review.rating} />
                  <span className="text-xs text-gray-400">
                    {new Date(review.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(review)}
                  className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition text-xs">
                  Editar
                </button>
                <button onClick={() => deleteReview(review.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {editing === review.id ? (
              <div className="space-y-2">
                <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                  className="text-sm resize-none focus:ring-2 focus:ring-orange-500" />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
                  <Button size="sm" onClick={() => saveEdit(review.id)}
                    className="bg-orange-600 hover:bg-orange-700 text-white">Guardar</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{review.comment}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Sección: Notificaciones ──────────────────────────────────────────────────
function TabNotificaciones({ userEmail }: { userEmail: string }) {
  const defaultSettings: NotificationSettings = {
    pedidoConfirmado:     true,
    pedidoEnviado:        true,
    pedidoEntregado:      true,
    devolucionRespuesta:  true,
    favoritoDescuento:    false,
    nuevoProductoArtesano: false,
  };

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`notif_${userEmail}`) || 'null');
    if (saved) setSettings(saved);
  }, [userEmail]);

  const toggle = (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem(`notif_${userEmail}`, JSON.stringify(updated));
    toast.success(updated[key] ? 'Notificación activada' : 'Notificación desactivada');
  };

  const NOTIF_GROUPS = [
    {
      group: '📦 Mis Pedidos',
      items: [
        { key: 'pedidoConfirmado',    icon: Package,      label: 'Pedido confirmado',         desc: 'Cuando tu pedido sea recibido por el artesano' },
        { key: 'pedidoEnviado',       icon: TruckIcon,    label: 'Pedido en camino',           desc: 'Cuando tu pedido sea despachado' },
        { key: 'pedidoEntregado',     icon: CheckCircle,  label: 'Pedido entregado',           desc: 'Confirmación de entrega exitosa' },
        { key: 'devolucionRespuesta', icon: AlertCircle,  label: 'Respuesta a devolución',     desc: 'Cuando el artesano responda tu solicitud' },
      ],
    },
    {
      group: '❤️ Favoritos y Descubrimiento',
      items: [
        { key: 'favoritoDescuento',       icon: Heart,    label: 'Descuento en favorito',         desc: 'Cuando un producto guardado tenga oferta' },
        { key: 'nuevoProductoArtesano',   icon: Star,     label: 'Nuevo producto del artesano',   desc: 'Cuando un artesano que sigues publique algo nuevo' },
      ],
    },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" /> Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-xs text-orange-700">
          🔔 Controla qué notificaciones quieres recibir sobre tus pedidos y productos favoritos.
        </div>

        {NOTIF_GROUPS.map(({ group, items }) => (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{group}</p>
            <div className="space-y-2">
              {items.map(({ key, icon: Icon, label, desc }) => (
                <div key={key}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-orange-100 transition">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${settings[key] ? 'bg-orange-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-4 w-4 ${settings[key] ? 'text-orange-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <button onClick={() => toggle(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-orange-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function Profile() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('perfil');

  const savedAddress = JSON.parse(localStorage.getItem(`direccion_${user?.email}`) || '{}');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '',
    address: savedAddress.address || '',
    bio: '', specialty: '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
      
      // Guardar en localStorage con la clave del email
      localStorage.setItem(`profileImage_${user?.email}`, base64);
      
      // Actualizar el objeto user en localStorage
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.profileImage = base64;
      localStorage.setItem('user', JSON.stringify(savedUser));
      
      // Actualizar en el contexto
      updateProfile({ profileImage: base64 });
      
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
    } catch {
      toast.error('Error al actualizar el perfil');
    }
  };

  if (!user) return null;

  // Solo clientes ven las tabs extra
  const tabs = user.role === 'customer'
    ? TABS_CLIENTE
    : TABS_CLIENTE.filter(t => t.id === 'perfil' || t.id === 'contrasena');

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Panel izquierdo ── */}
          <div className="space-y-4">
            {/* Avatar */}
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-24 h-24 bg-orange-100 rounded-full overflow-hidden flex items-center justify-center">
                    {previewImage
                      ? <img src={previewImage} alt="Foto de perfil" className="w-full h-full object-cover" />
                      : <User className="h-12 w-12 text-orange-600" />}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-orange-600 hover:bg-orange-700 text-white rounded-full p-1.5 shadow-md transition-colors"
                    title="Cambiar foto">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
                <h3 className="font-bold text-xl mb-1 text-orange-600 tracking-wide">{user.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{user.email}</p>
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                  {user.role === 'artisan' ? 'Artesano' : user.role === 'admin' ? 'Administrador' : user.role === 'customer'? 'Cliente'
: 'Cliente'}                </span>
                <p className="text-xs text-gray-400 mt-3">Haz clic en la cámara para cambiar tu foto</p>
              </CardContent>
            </Card>

            {/* Navegación de tabs */}
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-0.5">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        activeTab === id
                          ? 'bg-orange-600 text-white font-medium shadow-sm'
                          : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                      }`}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Acciones rápidas artesano */}
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

          {/* ── Panel derecho (contenido del tab) ── */}
          <div className="lg:col-span-3">

            {/* Tab: Perfil */}
            {activeTab === 'perfil' && (
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
                      <Input id="email" name="email" type="email" value={formData.email}
                        onChange={handleChange} required disabled className="bg-gray-100 text-gray-500" />
                      <p className="text-xs text-gray-500">El correo electrónico no se puede cambiar</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Teléfono
                      </Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone}
                        onChange={handleChange} placeholder="+57 300 123 4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Dirección
                      </Label>
                      <Input id="address" name="address" value={formData.address}
                        onChange={handleChange} placeholder="Tu dirección" />
                    </div>
                    {user.role === 'artisan' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="specialty" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" /> Especialidad
                          </Label>
                          <Input id="specialty" name="specialty" value={formData.specialty}
                            onChange={handleChange} placeholder="Ej: Cerámica, Tallado, Barniz de Pasto" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Biografía
                          </Label>
                          <Textarea id="bio" name="bio" value={formData.bio}
                            onChange={handleChange} placeholder="Cuéntanos sobre tu trabajo artesanal..." rows={4} />
                        </div>
                      </>
                    )}
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                      Guardar Cambios
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'contrasena'     && <TabContrasena     userEmail={user.email} />}
            {activeTab === 'favoritos'      && <TabFavoritos      userEmail={user.email} />}
            {activeTab === 'resenas'        && <TabResenas        userEmail={user.email} />}
            {activeTab === 'notificaciones' && <TabNotificaciones userEmail={user.email} />}
          </div>
        </div>
      </div>
    </div>
  );
}