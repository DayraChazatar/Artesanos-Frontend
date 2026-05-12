import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingCart, ArrowLeft, MessageCircle } from 'lucide-react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Combinar productos predefinidos con productos personalizados
  const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
  const allProducts = [...products, ...customProducts];
  const product = allProducts.find((p) => p.id === id);

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

  const handleAddToCart = () => {
    if (quantity > product.stock) {
      toast.error('No hay suficiente stock disponible');
      return;
    }
    addToCart(product, quantity);
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/carrito');
  };

  const handleContactArtisan = () => {
    const message = encodeURIComponent(
      `Hola, estoy interesado en el producto: ${product.name}`
    );
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
          {/* Product Image */}
          <div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded">
                {product.category}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl mb-4">{product.name}</h1>
            <p className="text-gray-600 mb-6">{product.description}</p>

            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-3xl text-orange-600 font-semibold">
                    ${product.price.toLocaleString('es-CO')}
                  </span>
                  <span className="text-sm text-gray-500">
                    Stock: {product.stock} unidades
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-24"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddToCart}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Agregar al Carrito
                    </Button>
                    <Button onClick={handleBuyNow} variant="outline" className="flex-1">
                      Comprar Ahora
                    </Button>
                  </div>

                  <Button
                    onClick={handleContactArtisan}
                    variant="outline"
                    className="w-full"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar al Artesano
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Artesano</h3>
                <p className="text-gray-600">{product.artisan}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Cada producto es hecho a mano con dedicación y técnicas tradicionales.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl mb-6">Productos Relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter(
                (p) => p.category === product.category && p.id !== product.id
              )
              .slice(0, 4)
              .map((relatedProduct) => (
                <Link to={`/producto/${relatedProduct.id}`} key={relatedProduct.id}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover"
                    />
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      <span className="text-orange-600 font-semibold">
                        ${relatedProduct.price.toLocaleString('es-CO')}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
