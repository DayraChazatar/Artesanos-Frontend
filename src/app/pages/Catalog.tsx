import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Edit, X, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function Catalog() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showOffers, setShowOffers] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const { user } = useAuth();
  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/catalogo/');
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error(
        'Error obteniendo productos:',
        error
      );

    }
  };
  const allProducts = productos;
  const categories = [
    ...new Set(
      allProducts.map((p: any) => p.categoria_nombre)
    )
  ];

  const prices = allProducts.map(p => p.price);
  const rawMaxPrice = prices.length > 0 ? Math.max(...prices) : 1000000;
  const minProductPrice = 0;
  const maxProductPrice = Math.ceil(rawMaxPrice / 50000) * 50000;
  const [priceRange, setPriceRange] = useState<[number, number]>([minProductPrice, maxProductPrice]);

  // ── Favoritos ──────────────────────────────────────────────────────────────
  const favKey = `favorites_${user?.email}`;
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (!user?.email) return [];
    const saved: any[] = JSON.parse(localStorage.getItem(favKey) || '[]');
    return saved.map((f: any) => f.id);
  });

  const toggleFavorite = (e: React.MouseEvent, product: any) => {
    e.preventDefault(); // evita navegar al producto
    if (!user) { toast.error('Inicia sesión para guardar favoritos'); return; }

    const saved: any[] = JSON.parse(localStorage.getItem(favKey) || '[]');
    const isFav = favorites.includes(product.id);

    if (isFav) {
      const updated = saved.filter((f: any) => f.id !== product.id);
      localStorage.setItem(favKey, JSON.stringify(updated));
      setFavorites(prev => prev.filter(id => id !== product.id));
      toast.success('Eliminado de favoritos');
    } else {
      const newFav = {
        id: product.id,
        name: product.nombre,
        price: product.discount
          ? Math.round(product.precio_final * (1 - product.discount / 100))
          : product.precio_final,
        image: product.image,
        artisan: product.artisan,
      };
      localStorage.setItem(favKey, JSON.stringify([...saved, newFav]));
      setFavorites(prev => [...prev, product.id]);
      toast.success('Guardado en favoritos ❤️');
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const filteredProducts = allProducts
    .filter(product => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.categoria_nombre);
      const matchesSearch = product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.artesano_nombre ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPrice = product.precio_final >= priceRange[0] && product.precio_final <= priceRange[1];
      const matchesOffers = !showOffers || product.discount;
      return matchesCategory && matchesSearch && matchesPrice && matchesOffers;
    })
    .sort((a, b) => {
      const finalPriceA = a.precio_final ?? 0;
      const finalPriceB = b.precio_final ?? 0;

      if (sortBy === 'price-desc') return finalPriceB - finalPriceA;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const isArtisan = user?.role === 'artisan';
  const isCustomer = user?.role === 'customer';
  const canEditProduct = (product: any) => isArtisan && product.createdBy === user?.id;

  const getStockLabel = (stock: number) => {
    if (stock === 0) return { label: 'Agotado', color: 'bg-red-100 text-red-700' };
    if (stock <= 3) return { label: `¡Solo ${stock}!`, color: 'bg-red-100 text-red-700' };
    if (stock <= 10) return { label: 'Poco stock', color: 'bg-yellow-100 text-yellow-700' };
    return null;
  };

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Catálogo de Productos</h1>
          <p className="text-gray-600 text-lg">Explora nuestra colección de productos artesanales únicos</p>
        </div>

        <div className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar productos, artesanos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl border-gray-200 shadow-sm"
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white shadow-sm">
            <option value="default">Ordenar por</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>

        <div className="flex gap-8">

          {/* ── Sidebar filtros ── */}
          <div className="w-72 flex-shrink-0 space-y-6">

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-5">Categorías</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer text-[15px] font-medium text-gray-700 hover:text-orange-600 transition-colors">
                  <input type="checkbox"
                    checked={selectedCategories.length === categories.length}
                    onChange={() => setSelectedCategories(
                      selectedCategories.length === categories.length ? [] : categories
                    )}
                    className="w-4 h-4 accent-orange-600" />
                  Todas
                </label>
                {categories.map(category => (
                  <label key={category}
                    className="flex items-center gap-3 cursor-pointer text-[15px] font-medium text-gray-700 hover:text-orange-600 transition-colors">
                    <input type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => setSelectedCategories(
                        selectedCategories.includes(category)
                          ? selectedCategories.filter(c => c !== category)
                          : [...selectedCategories, category]
                      )}
                      className="w-4 h-4 accent-orange-600" />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-5">Rango de Precio</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${priceRange[0].toLocaleString('es-CO')}</span>
                  <span>${priceRange[1].toLocaleString('es-CO')}</span>
                </div>
                <input type="range" min={minProductPrice} max={maxProductPrice} step="10000"
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Math.round(Math.max(0, parseInt(e.target.value) || 0))])}
                  className="w-full accent-orange-600" />
                <div className="flex gap-2">
                  <Input type="number" step={10000} placeholder="Mín" value={priceRange[0]}
                    onChange={e => setPriceRange([Math.round(Math.max(0, parseInt(e.target.value) || 0)), priceRange[1]])}
                    className="rounded-xl" />
                  <Input type="number" step={10000} placeholder="Máx" value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Math.round(parseInt(e.target.value) || maxProductPrice)])}
                    className="rounded-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Descuentos</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Encuentra productos con promociones y precios especiales.
              </p>
              <button onClick={() => setShowOffers(!showOffers)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-2 ${showOffers ? 'bg-orange-100 text-orange-700 font-semibold' : 'hover:bg-gray-100 text-gray-600'
                  }`}>
                🔥 Ver productos con descuento
              </button>
            </div>

            <Button variant="outline" className="w-full h-12 rounded-xl text-gray-700 border-gray-200"
              onClick={() => {
                setSelectedCategories([]);
                setPriceRange([minProductPrice, maxProductPrice]);
                setShowOffers(false);
                setSearchQuery('');
                setSortBy('default');
              }}>
              <X className="h-4 w-4 mr-2" /> Limpiar filtros
            </Button>

          </div>

          {/* ── Grid productos ── */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-6">{filteredProducts.length} productos encontrados</p>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredProducts.map(product => {
                  const stockLabel = getStockLabel(product.cantidad_disponible);
                  const discountedPrice = product.discount
                    ? Math.round(product.precio_final * (1 - product.discount / 100))
                    : null;
                  const isFav = favorites.includes(product.id);

                  return (
                    <div key={product.id} className="relative group">
                      <Link to={`/producto/${product.id}`}>
                        <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 rounded-3xl bg-white">

                          <div className="relative overflow-hidden">
                            {/* Imagen — reemplaza el img hardcodeado */}
                            <img
                              src={product.imagen_url || 'https://via.placeholder.com/400x300'}
                              alt={product.nombre}
                              className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Badge oferta / stock */}
                            {product.discount ? (
                              <span className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm bg-orange-100 text-orange-700">
                                ¡En oferta!
                              </span>
                            ) : stockLabel && (
                              <span className={`absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm ${stockLabel.color}`}>
                                {stockLabel.label}
                              </span>
                            )}

                            {/* Badge % descuento */}
                            {product.discount && (
                              <span className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-700 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                -{product.discount}%
                              </span>
                            )}

                            {/* ── Botón favorito (solo clientes) ── */}
                            {isCustomer && (
                              <button
                                onClick={e => toggleFavorite(e, product)}
                                className={`absolute bottom-3 right-3 p-2 rounded-full shadow-md transition-all duration-200
                                  ${isFav
                                    ? 'bg-red-500 text-white scale-110'
                                    : 'bg-white/90 text-gray-400 hover:text-red-500 hover:scale-110 opacity-0 group-hover:opacity-100'
                                  }`}
                                title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                              >
                                <Heart className={`h-4 w-4 ${isFav ? 'fill-white' : ''}`} />
                              </button>
                            )}
                          </div>

                          <CardContent className="p-5">
                            <div className="mb-3">
                              <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                                {product.categoria_nombre}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{product.nombre}</h3>
                            <p className="text-sm text-gray-600 mb-5 line-clamp-2 leading-relaxed">{product.description}</p>
                            <div className="flex justify-between items-end">
                              <div className="flex flex-col">
                                {discountedPrice ? (
                                  <>
                                    <span className="text-gray-400 line-through text-lg font-medium">
                                      ${Number(product.precio_final).toLocaleString('es-CO')}
                                    </span>
                                    <span className="text-red-600 font-black text-3xl leading-none">
                                      ${discountedPrice.toLocaleString('es-CO')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-orange-600 font-black text-3xl leading-none">
                                    ${Number(product.precio_final).toLocaleString('es-CO')}
                                  </span>
                                )}
                              </div>
                              {product.cantidad_disponible === 0 && (
                                <span className="text-xs text-red-600 font-semibold bg-red-100 px-3 py-1 rounded-full">
                                  Agotado
                                </span>
                              )}
                            </div>
                            {/* Artesano — usar artesano_nombre del backend */}
                              <p className="text-sm text-gray-500 mt-4">Por {product.artesano_nombre}</p>
                          </CardContent>
                        </Card>
                      </Link>

                      {/* Botón editar artesano */}
                      {canEditProduct(product) && (
                        <Link to={`/producto/editar/${product.id}`}>
                          <Button size="sm"
                            className="absolute top-3 right-3 bg-white hover:bg-gray-100 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg rounded-full">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}