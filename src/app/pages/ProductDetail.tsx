import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ShoppingCart, ArrowLeft, MessageCircle, Heart, Star } from 'lucide-react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// ── Estrellas visuales ────────────────────────────────────────────────────────
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`h-4 w-4 ${s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );
}

// ── Estrellas interactivas ────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`h-7 w-7 ${s <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

// ── Sección Reseñas ───────────────────────────────────────────────────────────
function ProductReviews({ productId, productName }: { productId: string; productName: string }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const allUsers: any[] = JSON.parse(localStorage.getItem('users') || '[]');

  const allReviews = allUsers.flatMap((u: any) => {
    const userReviews: any[] = JSON.parse(localStorage.getItem(`reviews_${u.email}`) || '[]');
    return userReviews
      .filter((r: any) => r.productId === productId)
      .map((r: any) => ({ ...r, userName: u.name }));
  });

  const userAlreadyReviewed = user
    ? (() => {
        const userReviews: any[] = JSON.parse(localStorage.getItem(`reviews_${user.email}`) || '[]');
        return userReviews.some((r: any) => r.productId === productId);
      })()
    : false;

  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;

  const handleSubmit = () => {
    if (!user) { toast.error('Inicia sesión para dejar una reseña'); return; }
    if (rating === 0) { toast.error('Selecciona una calificación'); return; }
    if (comment.trim().length < 5) { toast.error('Escribe un comentario más detallado'); return; }

    setSubmitting(true);
    const saved: any[] = JSON.parse(localStorage.getItem(`reviews_${user.email}`) || '[]');
    const newReview = {
      id: Date.now().toString(),
      productId,
      productName,
      rating,
      comment: comment.trim(),
      date: new Date().toISOString(),
    };
    localStorage.setItem(`reviews_${user.email}`, JSON.stringify([...saved, newReview]));
    setRating(0);
    setComment('');
    setSubmitting(false);
    setRefresh(r => r + 1);
    toast.success('¡Reseña publicada!');
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl">Reseñas del Producto</h2>
        {allReviews.length > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
            <StarRating value={Math.round(avgRating)} />
            <span className="text-sm font-semibold text-orange-700">
              {avgRating.toFixed(1)} ({allReviews.length} {allReviews.length === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>
        )}
      </div>

      {/* Formulario nueva reseña */}
      {user?.role === 'customer' && !userAlreadyReviewed && (
        <Card className="mb-6 border-orange-100">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Escribe tu reseña</h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm text-gray-600">Calificación</Label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <Label className="mb-2 block text-sm text-gray-600">Comentario</Label>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="¿Qué te pareció el producto? Comparte tu experiencia..."
                  rows={3}
                  className="resize-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {submitting ? 'Publicando...' : 'Publicar Reseña'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'customer' && userAlreadyReviewed && (
        <div className="mb-6 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ Ya dejaste tu reseña para este producto.
        </div>
      )}

      {!user && (
        <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700">
          <Link to="/login" className="font-semibold underline">Inicia sesión</Link> para dejar una reseña.
        </div>
      )}

      {/* Lista de reseñas */}
      {allReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-10 w-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-500">Este producto aún no tiene reseñas.</p>
            <p className="text-xs text-gray-400 mt-1">¡Sé el primero en calificarlo!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allReviews.map((review: any) => (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{review.userName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={review.rating} />
                      <span className="text-xs text-gray-400">
                        {new Date(review.date).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-2">
                  {review.comment}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const favKey = `favorites_${user?.email}`;
  const [isFav, setIsFav] = useState(false);

  // ── Cargar producto desde el backend ──────────────────────────────────
  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/productos/${id}/`);
        if (!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        setProduct(data);
        // Verificar si está en favoritos
        if (user?.email) {
          const saved: any[] = JSON.parse(localStorage.getItem(favKey) || '[]');
          setIsFav(saved.some((f: any) => String(f.id) === String(data.id)));
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProducto();
  }, [id]);

  const toggleFavorite = () => {
    if (!user) { toast.error('Inicia sesión para guardar favoritos'); return; }
    const saved: any[] = JSON.parse(localStorage.getItem(favKey) || '[]');
    if (isFav) {
      localStorage.setItem(favKey, JSON.stringify(saved.filter((f: any) => String(f.id) !== String(product.id))));
      setIsFav(false);
      toast.success('Eliminado de favoritos');
    } else {
      localStorage.setItem(favKey, JSON.stringify([...saved, {
        id:      product.id,
        name:    product.nombre,
        price:   product.precio_final,
        image:   product.imagen_url ?? '',
        artisan: product.artesano_nombre ?? '',
      }]));
      setIsFav(true);
      toast.success('Guardado en favoritos ❤️');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-amber-700">
        <span className="animate-spin text-3xl inline-block">⏳</span>
        <p className="mt-4 text-sm">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl mb-4">Producto no encontrado</h2>
        <Button asChild>
          <Link to="/catalogo">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  // Mapear campos del backend al formato que usa el resto del componente
  const precio     = Number(product.precio_final ?? product.precio_neto ?? 0);
  const descuento  = product.descuento ? product.valor_descuento : 0;
  const precioFinal = descuento
    ? Math.round(precio * (1 - descuento / 100))
    : null;
  const stock = product.cantidad_disponible ?? product.cantidad ?? 0;

  const handleAddToCart = () => {
    if (quantity > stock) {
      toast.error('No hay suficiente stock disponible');
      return;
    }
    addToCart({
      id:          String(product.id),
      name:        product.nombre,
      description: product.categoria_nombre ?? '',
      price:       precioFinal ?? precio,
      image:       product.imagen_url ?? '',
      category:    product.categoria_nombre ?? '',
      artisan:     product.artesano_nombre ?? '',
      stock:       stock,
    }, quantity);
    toast.success(`${product.nombre} agregado al carrito`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/carrito');
  };

  const handleContactArtisan = () => {
    const message = encodeURIComponent(`Hola, estoy interesado en el producto: ${product.nombre}`);
    window.open(`https://wa.me/573001234567?text=${message}`, '_blank');
  };

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/catalogo">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Imagen */}
          <div className="relative">
            <img
              src={product.imagen_url || 'https://via.placeholder.com/600x400'}
              alt={product.nombre}
              className="w-full rounded-lg shadow-lg object-cover max-h-[500px]"
            />
            {descuento > 0 && (
              <span className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-700 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                🏷️ -{descuento}% descuento
              </span>
            )}
            {user?.role === 'customer' && (
              <button onClick={toggleFavorite}
                className={`absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg font-medium text-sm transition-all duration-200
                  ${isFav ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-500 hover:text-red-500 border border-gray-200'}`}>
                <Heart className={`h-4 w-4 ${isFav ? 'fill-white' : ''}`} />
                {isFav ? 'Guardado en favoritos' : 'Guardar en favoritos'}
              </button>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded">
                {product.categoria_nombre ?? '—'}
              </span>
              {descuento > 0 && (
                <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded font-medium">¡En oferta!</span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl mb-4">{product.nombre}</h1>

            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    {precioFinal ? (
                      <>
                        <span className="text-gray-400 line-through text-lg font-medium">
                          ${precio.toLocaleString('es-CO')}
                        </span>
                        <span className="text-3xl text-red-600 font-bold">
                          ${precioFinal.toLocaleString('es-CO')}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl text-orange-600 font-semibold">
                        ${precio.toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    stock === 0 ? 'bg-red-100 text-red-700'
                    : stock <= 5 ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                  }`}>
                    {stock === 0 ? 'Agotado' : `${stock} disponibles`}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input id="quantity" type="number" min="1" max={stock}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24" />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleAddToCart} disabled={stock === 0}
                      className="flex-1 bg-orange-600 hover:bg-orange-700">
                      <ShoppingCart className="mr-2 h-4 w-4" /> Agregar al Carrito
                    </Button>
                    <Button onClick={handleBuyNow} disabled={stock === 0}
                      variant="outline" className="flex-1">
                      Comprar Ahora
                    </Button>
                  </div>
                  <Button onClick={handleContactArtisan} variant="outline" className="w-full">
                    <MessageCircle className="mr-2 h-4 w-4" /> Contactar al Artesano
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Artesano</h3>
                <p className="text-gray-600">{product.artesano_nombre ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Cada producto es hecho a mano con dedicación y técnicas tradicionales.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reseñas */}
        <ProductReviews productId={String(product.id)} productName={product.nombre} />

      </div>
    </div>
  );
}