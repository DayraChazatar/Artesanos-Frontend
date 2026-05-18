import { useEffect, useState } from 'react'; // 1. Agregamos hooks de React
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Heart, Truck, Shield, Star, Loader2 } from 'lucide-react'; // Agregamos Loader2 para la carga
import { useAuth } from '../context/AuthContext';

// 2. Definimos la estructura del Producto según tu base de datos/API
interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image: string;
  artisan: string;
}

export function Home() {
  const { isAuthenticated } = useAuth();

  // 3. Declaramos los estados para manejar los productos dinámicos de la API
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 4. Efecto para consultar la API al cargar el componente
  useEffect(() => {
    // URL Corregida funcionando con tu puerto 8000 local
    const API_URL = 'http://localhost:8000/api/productos/';
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Error al conectar con el servidor');
        }
        return res.json();
      })
      .then((data) => {
        console.log("Datos recibidos de la API:", data);
        // Ajustamos para tomar los primeros 3 productos de la base de datos
        if (Array.isArray(data)) {
          setFeaturedProducts(data.slice(0, 3));
        } else if (data && Array.isArray(data.products)) {
          setFeaturedProducts(data.products.slice(0, 3));
        } else if (data && Array.isArray(data.data)) {
          setFeaturedProducts(data.data.slice(0, 3));
        } else {
          console.error("El formato de la API no es un arreglo válido");
          setError('El formato de datos del servidor es incorrecto.');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error capturado en el fetch:', err);
        setError('No se pudieron cargar los productos en este momento.');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative h-[700px] bg-cover"
        style={{
          backgroundImage: `url('/hero.jpg')`,
          backgroundPosition: 'center 30%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/20 to-transparent" />
        <div className="relative container mx-auto px-4 h-full flex items-end justify-start pb-14">
          <div className="max-w-md">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg leading-tight">
              Descubre el Arte Hecho a Mano
            </h1>
            <p className="text-lg mb-6 text-white/90 drop-shadow">
              Productos unicos creados por artesanos talentosos. Cada pieza cuenta una historia.
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
                <div className="relative group inline-block">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-orange-600 cursor-pointer" />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Productos hechos con amor y dedicación
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Hecho con Amor</h3>
                <p className="text-sm text-gray-600">Cada producto es creado con dedicación y pasión</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="relative group inline-block">
                  <Star className="h-12 w-12 mx-auto mb-4 text-orange-600 cursor-pointer" />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Artesanía de la más alta calidad
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Calidad Premium</h3>
                <p className="text-sm text-gray-600">Productos de la más alta calidad artesanal</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="relative group inline-block">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-orange-600 cursor-pointer" />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Entrega confiable a todo el país
                  </span>
                </div>
                <h3 className="font-semibold mb-2">Envío Seguro</h3>
                <p className="text-sm text-gray-600">Entrega confiable a todo el país</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="relative group inline-block">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-orange-600 cursor-pointer" />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Tus datos y pagos siempre protegidos
                  </span>
                </div>
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

          {/* Muestra un spinner mientras carga los datos de la base de datos */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <p className="text-sm">Obteniendo creaciones de nuestros artesanos...</p>
            </div>
          )}

          {/* Muestra un mensaje en caso de error en la API */}
          {error && !loading && (
            <p className="text-center text-red-500 font-medium py-8">{error}</p>
          )}

          {/* Renderizado Condicional Dinámico de las tarjetas */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.length === 0 ? (
                <p className="text-center text-gray-500 col-span-3 py-8">
                  Aún no hay productos disponibles en el catálogo.
                </p>
              ) : (
                featuredProducts.map((product) => {
                  // Mapeamos los campos reales basándonos en la respuesta en español de tu API
                  const id = product.id || (product as any)._id;
                  const name = (product as any).nombre || product.name;
                  const rawPrice = (product as any).precio_pvp || 0;
                  const price = Math.round(Number(rawPrice));
                  const description = `Categoría: ${(product as any).categoria_nombre || "Artesanías"}`;

                  const image = (product as any).imagen || (product as any).foto || (product as any).imagen_url || product.image;
                  const artisan = (product as any).nombre_artesano || (product as any).artesano_nombre || ((product as any).artesano && (product as any).artesano.nombre) || "Lizeth Melo";

                   return (
                    <Link to={`/producto/${id}`} key={id} className="block h-full">
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between border border-gray-100 bg-white">
                        
                        {/* CONTENEDOR EFECTO CINEMÁTICO: Rellena los espacios vacíos estéticamente */}
                        <div className="relative w-full h-64 flex items-center justify-center overflow-hidden bg-gray-900">
                          
                          {/* 1. Imagen de fondo duplicada y difuminada */}
                          <img 
                            src={image || "/placeholder-product.png"} 
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-40 pointer-events-none"
                          />

                          {/* 2. Imagen del producto real flotando nítida encima */}
                          <img
                            src={image || "/placeholder-product.png"}
                            alt={name}
                            className="relative max-h-[90%] max-w-[90%] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-product.png";
                            }}
                          />
                        </div>

                        {/* CONTENIDO TEXTUAL */}
                        <CardContent className="p-5 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-base text-gray-800 line-clamp-1">
                              {name}
                            </h3>
                            <p className="text-xs text-orange-600 font-medium tracking-wide">
                              {description}
                            </p>
                          </div>

                          <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-100">
                            <span className="text-gray-900 font-bold text-lg">
                              {isNaN(Number(price)) ? "$ 0" : `$${Number(price).toLocaleString('es-CO')}`}
                            </span>
                            <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                              Por {artisan}
                            </span>
                          </div>
                        </CardContent>

                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          )}
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
              {/* CORRECCIÓN: "ciudad" corregido aquí */}
              <p className="text-gray-700 mb-6">
                Trabajamos con artesanos de la ciudad de Pasto, ofreciendo productos
                únicos que no encontrarás en ningún otro lugar.
              </p>
              {!isAuthenticated && (
                <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                  <Link to="/registro">Únete a Nuestra Comunidad</Link>
                </Button>
              )}
            </div>
            {/* CONTENEDOR OPTIMIZADO: Ajustamos la altura a h-[350px] para equilibrar el texto */}
            <div className="w-full h-[350px] rounded-xl overflow-hidden shadow-lg">
              <img
                src="/arte.jpg"
                alt="Artesanias"
                /* SOLUCIÓN: Cambiamos object-contain por object-cover y h-full w-full */
                className="w-full h-full object-cover object-center hover:scale-102 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
