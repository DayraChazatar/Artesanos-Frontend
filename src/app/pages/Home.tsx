import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Heart, Truck, Shield, Star } from 'lucide-react';
import { products } from '../data/products';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { isAuthenticated } = useAuth();
  const featuredProducts = products.slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative h-[600px] bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1761124739063-8a1464438cdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMGFydGlzYW4lMjBjcmFmdHMlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NzEyMDMwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl md:text-6xl mb-6">
              Descubre el Arte Hecho a Mano
            </h1>
            <p className="text-xl mb-8">
              Productos únicos creados por artesanos talentosos. Cada pieza cuenta una historia.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700" asChild>
                <Link to="/catalogo">Ver Catálogo</Link>
              </Button>
              {!isAuthenticated && (
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700" asChild>
                  <Link to="/registro">Registrarse</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Hecho con Amor</h3>
                <p className="text-sm text-gray-600">Cada producto es creado con dedicación y pasión</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Calidad Premium</h3>
                <p className="text-sm text-gray-600">Productos de la más alta calidad artesanal</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Truck className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Envío Seguro</h3>
                <p className="text-sm text-gray-600">Entrega confiable a todo el país</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <h3 className="font-semibold mb-2">Compra Segura</h3>
                <p className="text-sm text-gray-600">Protegemos tus datos y tu inversión</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-8 text-center">Productos Destacados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Link to={`/producto/${product.id}`} key={product.id}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-semibold">${product.price.toLocaleString('es-CO')}</span>
                      <span className="text-xs text-gray-500">Por {product.artisan}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700" asChild>
              <Link to="/catalogo">Ver Todos los Productos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold mb-6">Apoyando a Artesanos Locales</h2>
              <p className="text-gray-700 mb-4">
                Nuestra plataforma conecta directamente a artesanos talentosos con clientes
                que valoran el trabajo hecho a mano. Cada compra apoya a familias y preserva
                tradiciones ancestrales.
              </p>
              <p className="text-gray-700 mb-6">
                Trabajamos con más de 50 artesanos en todo el país, ofreciendo productos
                únicos que no encontrarás en ningún otro lugar.
              </p>
              {!isAuthenticated && (
                <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                  <Link to="/registro">Únete a Nuestra Comunidad</Link>
                </Button>
              )}
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1707064892275-a3088e8240be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwd29ya3Nob3AlMjB0b29sc3xlbnwxfHx8fDE3NzExMjMxNjF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Artesano trabajando"
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}