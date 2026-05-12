import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, Edit } from 'lucide-react';
import { products, categories } from '../data/products';
import { useAuth } from '../context/AuthContext';

export function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Combinar productos predefinidos con productos personalizados
  const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
  const allProducts = [...products, ...customProducts];

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.artisan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isArtisan = user?.role === 'artisan';
  const canEditProduct = (product: any) => {
    return isArtisan && product.createdBy === user?.id;
  };

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl mb-4">Catálogo de Productos</h1>
            <p className="text-gray-600">
              Explora nuestra colección de productos artesanales únicos
            </p>
          </div>
        </div>
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar productos, artesanos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : ''
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative group">
                <Link to={`/producto/${product.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-semibold text-lg">
                          ${product.price.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Por {product.artisan}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Stock: {product.stock} unidades
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                {canEditProduct(product) && (
                  <Link to={`/producto/editar/${product.id}`}>
                    <Button
                      size="sm"
                      className="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}