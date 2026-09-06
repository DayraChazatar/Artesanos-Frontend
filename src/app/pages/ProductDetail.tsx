import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
<<<<<<< HEAD
import {
  ShoppingCart,
  ArrowLeft,
  MessageCircle,
  Heart,
  Star,
} from 'lucide-react';
import { products } from '../data/products';
=======
import { ShoppingCart, ArrowLeft, MessageCircle, Heart, Star } from 'lucide-react';
>>>>>>> 90c5e345e7b0759aaab08d58c8fbcd9a36a253f1
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { API_BASE } from '../utils/config';

const BASE = API_BASE;

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// ESTRELLAS VISUALES
// ─────────────────────────────────────────────────────────────────────────────

=======
/** Extrae un mensaje de error legible de una respuesta de error de DRF, sin importar la forma exacta que tenga. */
function extraerError(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data.error === 'string') return data.error;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0];
  const primerCampo = Object.values(data).find((v) => Array.isArray(v) && v.length > 0) as string[] | undefined;
  return primerCampo?.[0] ?? fallback;
}

// ── Estrellas visuales ────────────────────────────────────────────────────────
>>>>>>> 90c5e345e7b0759aaab08d58c8fbcd9a36a253f1
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= value
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTRELLAS INTERACTIVAS
// ─────────────────────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 ${
              s <= (hovered || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 fill-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN RESEÑAS
// ─────────────────────────────────────────────────────────────────────────────

function ProductReviews({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
=======
// ── Sección Reseñas ───────────────────────────────────────────────────────────
function ProductReviews({ productId }: { productId: string; productName: string }) {
>>>>>>> 90c5e345e7b0759aaab08d58c8fbcd9a36a253f1
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allReviews, setAllReviews] = useState<any[]>([]);

<<<<<<< HEAD
  const allUsers: any[] = JSON.parse(
    localStorage.getItem('users') || '[]'
  );

  const allReviews = allUsers.flatMap((u: any) => {
    const userReviews: any[] = JSON.parse(
      localStorage.getItem(`reviews_${u.email}`) || '[]'
    );

    return userReviews
      .filter((r: any) => r.productId === productId)
      .map((r: any) => ({
        ...r,
        userName: u.name,
      }));
  });

  const userAlreadyReviewed = user
    ? (() => {
        const userReviews: any[] = JSON.parse(
          localStorage.getItem(`reviews_${user.email}`) || '[]'
        );

        return userReviews.some(
          (r: any) => r.productId === productId
        );
      })()
    : false;

  const avgRating =
    allReviews.length > 0
      ? allReviews.reduce(
          (sum, r) => sum + r.rating,
          0
        ) / allReviews.length
      : 0;

  const handleSubmit = () => {
    if (!user) {
      toast.error(
        'Inicia sesión para dejar una reseña'
      );
      return;
    }

    if (rating === 0) {
      toast.error(
        'Selecciona una calificación'
      );
      return;
    }

    if (comment.trim().length < 5) {
      toast.error(
        'Escribe un comentario más detallado'
      );
      return;
    }

    setSubmitting(true);

    const saved: any[] = JSON.parse(
      localStorage.getItem(
        `reviews_${user.email}`
      ) || '[]'
    );

    const newReview = {
      id: Date.now().toString(),
      productId,
      productName,
      rating,
      comment: comment.trim(),
      date: new Date().toISOString(),
    };

    localStorage.setItem(
      `reviews_${user.email}`,
      JSON.stringify([
        ...saved,
        newReview,
      ])
    );

    setRating(0);
    setComment('');
    setSubmitting(false);
    setRefresh((r) => r + 1);

    toast.success('¡Reseña publicada!');
=======
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/resenas/?producto=${productId}`);
      const data = await res.json();
      setAllReviews(Array.isArray(data) ? data : []);
    } catch {
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const userAlreadyReviewed = user
    ? allReviews.some(r => String(r.cliente) === String(user.id))
    : false;

  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.calificacion, 0) / allReviews.length
    : 0;

  const handleSubmit = async () => {
    if (!user) { toast.error('Inicia sesión para dejar una reseña'); return; }
    if (rating === 0) { toast.error('Selecciona una calificación'); return; }
    if (comment.trim().length < 5) { toast.error('Escribe un comentario más detallado'); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${BASE}/resenas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
        body: JSON.stringify({ producto: Number(productId), calificacion: rating, comentario: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(extraerError(data, 'No se pudo publicar la reseña')); return; }
      setRating(0);
      setComment('');
      toast.success('¡Reseña publicada!');
      await fetchReviews();
    } catch {
      toast.error('Error de conexión con el servidor');
    } finally {
      setSubmitting(false);
    }
>>>>>>> 90c5e345e7b0759aaab08d58c8fbcd9a36a253f1
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl">
          Reseñas del Producto
        </h2>

        {allReviews.length > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
            <StarRating
              value={Math.round(avgRating)}
            />

            <span className="text-sm font-semibold text-orange-700">
              {avgRating.toFixed(1)} (
              {allReviews.length}{' '}
              {allReviews.length === 1
                ? 'reseña'
                : 'reseñas'}
              )
            </span>
          </div>
        )}
      </div>

      {/* Formulario nueva reseña */}
      {user?.role === 'customer' &&
        !userAlreadyReviewed && (
          <Card className="mb-6 border-orange-100">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-800 mb-4">
                Escribe tu reseña
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm text-gray-600">
                    Calificación
                  </Label>

                  <StarPicker
                    value={rating}
                    onChange={setRating}
                  />
                </div>

                <div>
                  <Label className="mb-2 block text-sm text-gray-600">
                    Comentario
                  </Label>

                  <Textarea
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value)
                    }
                    placeholder="¿Qué te pareció el producto? Comparte tu experiencia..."
                    rows={3}
                    className="resize-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    rating === 0
                  }
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {submitting
                    ? 'Publicando...'
                    : 'Publicar Reseña'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {user?.role === 'customer' &&
        userAlreadyReviewed && (
          <div className="mb-6 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700">
            ✓ Ya dejaste tu reseña para este producto.
          </div>
        )}

      {!user && (
        <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700">
          <Link
            to="/login"
            className="font-semibold underline"
          >
            Inicia sesión
          </Link>{' '}
          para dejar una reseña.
        </div>
      )}

      {/* Lista de reseñas */}
      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : allReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-10 w-10 mx-auto mb-3 text-gray-200" />

            <p className="text-sm text-gray-500">
              Este producto aún no tiene reseñas.
            </p>

            <p className="text-xs text-gray-400 mt-1">
              ¡Sé el primero en calificarlo!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allReviews.map((review: any) => (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
<<<<<<< HEAD
                    <p className="text-sm font-semibold text-gray-800">
                      {review.userName}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <StarRating
                        value={review.rating}
                      />

                      <span className="text-xs text-gray-400">
                        {new Date(
                          review.date
                        ).toLocaleDateString(
                          'es-CO',
                          {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          }
                        )}
=======
                    <p className="text-sm font-semibold text-gray-800">{review.cliente_nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={review.calificacion} />
                      <span className="text-xs text-gray-400">
                        {new Date(review.creado_en).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
>>>>>>> 90c5e345e7b0759aaab08d58c8fbcd9a36a253f1
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-2">
                  {review.comentario}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] =
    useState<any>(null);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
  // ─────────────────────────────────────────────────────────────────────────
  // ESTADOS DE FAVORITOS
  // ─────────────────────────────────────────────────────────────────────────

=======
>>>>>>> 90c5e345e7b0759aaab08d58c8fbcd9a36a253f1
  const [isFav, setIsFav] = useState(false);
  const [favoriteLoading, setFavoriteLoading] =
    useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // CARGAR PRODUCTO DESDE EL BACKEND
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchProducto = async () => {
      try {
<<<<<<< HEAD
        const res = await fetch(
          `${API_BASE}/productos/${id}/`
        );

        if (!res.ok) {
          throw new Error(
            'No encontrado'
          );
        }

        const data = await res.json();

        setProduct(data);
      } catch (error) {
        console.error(
          'Error cargando producto:',
          error
        );

=======
       const res = await fetch(`${API_BASE}/productos/${id}/`);
        if (!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        setProduct(data);
      } catch {
>>>>>>> 90c5e345e7b0759aaab08d58c8fbcd9a36a253f1
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [id]);

<<<<<<< HEAD
  // ─────────────────────────────────────────────────────────────────────────
  // VERIFICAR SI EL PRODUCTO ESTÁ EN FAVORITOS
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const verificarFavorito = async () => {
      if (!user || !product?.id) {
        setIsFav(false);
        return;
      }

      const token =
        localStorage.getItem('token');

      if (!token) {
        setIsFav(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/inventario/favoritos/`,
          {
            method: 'GET',
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type':
                'application/json',
            },
          }
        );

        if (!res.ok) {
          setIsFav(false);
          return;
        }

        const favoritos =
          await res.json();

        const existe =
          favoritos.some(
            (favorito: any) =>
              String(
                favorito.producto
              ) ===
              String(product.id)
          );

        setIsFav(existe);
      } catch (error) {
        console.error(
          'Error verificando favorito:',
          error
        );

        setIsFav(false);
      }
    };

    verificarFavorito();
  }, [user, product]);

  // ─────────────────────────────────────────────────────────────────────────
  // AGREGAR / QUITAR FAVORITO
  // ─────────────────────────────────────────────────────────────────────────

  const toggleFavorite = async () => {
    if (!user) {
      toast.error(
        'Inicia sesión para guardar favoritos'
      );
      return;
    }

    if (!product?.id) {
      toast.error(
        'No se pudo identificar el producto'
      );
      return;
    }

    const token =
      localStorage.getItem('token');

    if (!token) {
      toast.error(
        'Tu sesión ha expirado. Inicia sesión nuevamente'
      );
      return;
    }

    setFavoriteLoading(true);

    try {
      // ───────────────────────────────────────
      // QUITAR DE FAVORITOS
      // ───────────────────────────────────────

      if (isFav) {
        const res = await fetch(
          `${API_BASE}/inventario/favoritos/quitar/${product.id}/`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type':
                'application/json',
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            'No se pudo eliminar el favorito'
          );
        }

        setIsFav(false);

        toast.success(
          'Eliminado de favoritos'
        );

        return;
      }

      // ───────────────────────────────────────
      // AGREGAR A FAVORITOS
      // ───────────────────────────────────────

      const res = await fetch(
        `${API_BASE}/inventario/favoritos/agregar/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            producto_id: product.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            'No se pudo guardar el favorito'
        );
      }

      setIsFav(true);

      toast.success(
        'Guardado en favoritos'
      );
    } catch (error: any) {
      console.error(
        'Error con favoritos:',
        error
      );

      toast.error(
        error.message ||
          'Ocurrió un error con favoritos'
      );
    } finally {
      setFavoriteLoading(false);
=======
  // ── Verificar si ya está en favoritos (backend real) ────────────────────
  useEffect(() => {
    const verificarFavorito = async () => {
      if (!user?.id || !product?.id) { setIsFav(false); return; }
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await fetch(`${API_BASE}/favoritos/`, {
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        setIsFav(Array.isArray(data) && data.some((f: any) => String(f.producto) === String(product.id)));
      } catch { /* no crítico */ }
    };
    verificarFavorito();
  }, [user?.id, product?.id]);

  const toggleFavorite = async () => {
    if (!user) { toast.error('Inicia sesión para guardar favoritos'); return; }
    const token = localStorage.getItem('token') ?? '';
    try {
      if (isFav) {
        await fetch(`${API_BASE}/favoritos/producto/${product.id}/`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        setIsFav(false);
        toast.success('Eliminado de favoritos');
      } else {
        const res = await fetch(`${API_BASE}/favoritos/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
          body: JSON.stringify({ producto: product.id }),
        });
        if (!res.ok) { toast.error('No se pudo guardar en favoritos'); return; }
        setIsFav(true);
        toast.success('Guardado en favoritos ❤️');
      }
    } catch {
      toast.error('Error de conexión con el servidor');
>>>>>>> 90c5e345e7b0759aaab08d58c8fbcd9a36a253f1
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CARGANDO
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-amber-700">
        <span className="animate-spin text-3xl inline-block">
          ⏳
        </span>

        <p className="mt-4 text-sm">
          Cargando producto...
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRODUCTO NO ENCONTRADO
  // ─────────────────────────────────────────────────────────────────────────

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl mb-4">
          Producto no encontrado
        </h2>

        <Button asChild>
          <Link to="/catalogo">
            Volver al catálogo
          </Link>
        </Button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAPEAR CAMPOS DEL BACKEND
  // ─────────────────────────────────────────────────────────────────────────

  const precio = Number(
    product.precio_final ??
      product.precio_neto ??
      0
  );

  const descuento = product.descuento
    ? product.valor_descuento
    : 0;

  const precioFinal = descuento
    ? Math.round(
        precio *
          (1 - descuento / 100)
      )
    : null;

  const stock = Math.max(
    0,
    product.cantidad_disponible ??
      product.cantidad ??
      0
  );

  // ─────────────────────────────────────────────────────────────────────────
  // AGREGAR AL CARRITO
  // ─────────────────────────────────────────────────────────────────────────

  const handleAddToCart = () => {
    if (quantity > stock) {
      toast.error(
        'No hay suficiente stock disponible'
      );
      return;
    }

    addToCart(
      {
        id: String(product.id),
        name: product.nombre,
        description:
          product.categoria_nombre ?? '',
        price:
          precioFinal ?? precio,
        image:
          product.imagen_url ?? '',
        category:
          product.categoria_nombre ?? '',
        artisan:
          product.artesano_nombre ?? '',
        stock: stock,
      },
      quantity
    );

    toast.success(
      `${product.nombre} agregado al carrito`
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // COMPRAR AHORA
  // ─────────────────────────────────────────────────────────────────────────

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/carrito');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CONTACTAR ARTESANO
  // ─────────────────────────────────────────────────────────────────────────

  const handleContactArtisan = async () => {
    if (!product.artesano_telefono) {
      toast.error(
        'Este artesano no tiene un número de contacto registrado'
      );
      return;
    }

    // Registrar contacto para métricas
    try {
      await fetch(
        `${BASE}/contactos/registrar/`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            artesano_id:
              product.artesano,
            cliente_id:
              user?.id ?? null,
            producto_id:
              product.id,
          }),
        }
      );
    } catch (error) {
      console.error(
        'Error registrando contacto:',
        error
      );
    }

    const telefono =
      product.artesano_telefono.replace(
        /\D/g,
        ''
      );

    const message =
      encodeURIComponent(
        `Hola, estoy interesado en el producto: ${product.nombre}`
      );

    window.open(
      `https://wa.me/57${telefono}?text=${message}`,
      '_blank'
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">

        {/* Volver */}
        <Button
          variant="ghost"
          className="mb-6"
          asChild
        >
          <Link to="/catalogo">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ─────────────────────────────────────
              IMAGEN DEL PRODUCTO
          ───────────────────────────────────── */}

          <div className="relative">
            <img
              src={
                product.imagen_url ||
                'https://via.placeholder.com/600x400'
              }
              alt={product.nombre}
              className="w-full rounded-lg shadow-lg object-contain bg-white max-h-[500px]"
            />

            {/* Descuento */}
            {descuento > 0 && (
              <span className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-700 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                🏷️ -{descuento}% descuento
              </span>
            )}

            {/* ────────────────────────────────
                BOTÓN FAVORITOS
            ──────────────────────────────── */}

            {user?.role === 'customer' && (
              <button
                onClick={
                  toggleFavorite
                }
                disabled={
                  favoriteLoading
                }
                className={`
                  absolute bottom-4 right-4
                  flex items-center gap-2
                  px-4 py-2
                  rounded-full
                  shadow-lg
                  font-medium
                  text-sm
                  transition-all duration-200

                  ${
                    isFav
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white text-gray-500 hover:text-red-500 border border-gray-200'
                  }

                  ${
                    favoriteLoading
                      ? 'opacity-60 cursor-not-allowed'
                      : ''
                  }
                `}
              >
                <Heart
                  className={`
                    h-4 w-4
                    ${
                      isFav
                        ? 'fill-white'
                        : ''
                    }
                  `}
                />

                {favoriteLoading
                  ? 'Guardando...'
                  : isFav
                    ? 'Guardado en favoritos'
                    : 'Guardar en favoritos'}
              </button>
            )}
          </div>

          {/* ─────────────────────────────────────
              INFORMACIÓN DEL PRODUCTO
          ───────────────────────────────────── */}

          <div>

            {/* Categoría */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded">
                {product.categoria_nombre ??
                  '—'}
              </span>

              {descuento > 0 && (
                <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded font-medium">
                  ¡En oferta!
                </span>
              )}
            </div>

            {/* Nombre */}
            <h1 className="text-3xl md:text-4xl mb-4">
              {product.nombre}
            </h1>

            {/* ─────────────────────────────
                CARD PRECIO / COMPRA
            ───────────────────────────── */}

            <Card className="mb-6">
              <CardContent className="p-4">

                <div className="flex justify-between items-center mb-4">

                  {/* Precio */}
                  <div className="flex flex-col">

                    {precioFinal ? (
                      <>
                        <span className="text-gray-400 line-through text-lg font-medium">
                          $
                          {precio.toLocaleString(
                            'es-CO'
                          )}
                        </span>

                        <span className="text-3xl text-red-600 font-bold">
                          $
                          {precioFinal.toLocaleString(
                            'es-CO'
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl text-orange-600 font-semibold">
                        $
                        {precio.toLocaleString(
                          'es-CO'
                        )}
                      </span>
                    )}

                  </div>

                  {/* Stock */}
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      stock === 0
                        ? 'bg-red-100 text-red-700'
                        : stock <= 5
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {stock === 0
                      ? 'Agotado'
                      : `${stock} disponibles`}
                  </span>
                </div>

                <div className="space-y-4">

                  {/* Cantidad */}
                  <div>
                    <Label htmlFor="quantity">
                      Cantidad
                    </Label>

                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={stock}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(
                            1,
                            parseInt(
                              e.target.value
                            ) || 1
                          )
                        )
                      }
                      className="w-24"
                    />
                  </div>

                  {/* Botones compra */}
                  <div className="flex gap-3">

                    {user?.role ===
                    'artisan' ? (
                      <div className="flex-1 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm text-center">
                        Los artesanos pueden
                        explorar productos,
                        pero no realizar
                        compras.
                      </div>
                    ) : (
                      <Button
                        onClick={
                          handleAddToCart
                        }
                        disabled={
                          stock === 0
                        }
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Agregar al Carrito
                      </Button>
                    )}

                    {user?.role !==
                      'artisan' && (
                      <Button
                        onClick={
                          handleBuyNow
                        }
                        disabled={
                          stock === 0
                        }
                        variant="outline"
                        className="flex-1"
                      >
                        Comprar Ahora
                      </Button>
                    )}

                  </div>

                  {/* Contactar artesano */}
                  {user?.role !==
                    'artisan' && (
                    <Button
                      onClick={
                        handleContactArtisan
                      }
                      variant="outline"
                      className="w-full"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contactar al Artesano
                    </Button>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* ─────────────────────────────
                INFORMACIÓN ARTESANO
            ───────────────────────────── */}

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">
                  Artesano
                </h3>

                <p className="text-gray-600">
                  {product.artesano_nombre ??
                    '—'}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Cada producto es hecho a mano
                  con dedicación y técnicas
                  tradicionales.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* ─────────────────────────────────────
            RESEÑAS
        ───────────────────────────────────── */}

        <ProductReviews
          productId={String(
            product.id
          )}
          productName={
            product.nombre
          }
        />

      </div>
    </div>
  );
}