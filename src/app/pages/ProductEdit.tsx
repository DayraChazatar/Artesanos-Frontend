import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react';
import { categories } from '../data/products';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

export function ProductEdit() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'artisan') {
      toast.error('Debes ser artesano para editar productos');
      navigate('/login');
      return;
    }

    // Cargar producto
    const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
    const foundProduct = customProducts.find((p: any) => p.id === id);

    if (!foundProduct) {
      toast.error('Producto no encontrado');
      navigate('/catalogo');
      return;
    }

    if (foundProduct.createdBy !== user.id) {
      toast.error('No tienes permiso para editar este producto');
      navigate('/catalogo');
      return;
    }

    setProduct(foundProduct);
    setFormData({
      name: foundProduct.name,
      description: foundProduct.description,
      price: foundProduct.price.toString(),
      category: foundProduct.category,
      stock: foundProduct.stock.toString(),
      image: foundProduct.image,
    });
    setImagePreview(foundProduct.image);
  }, [id, isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData({ ...formData, image: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category) {
      toast.error('Selecciona una categoría');
      return;
    }

    if (!formData.image) {
      toast.error('El producto debe tener una imagen');
      return;
    }

    try {
      const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
      const updatedProducts = customProducts.map((p: any) => {
        if (p.id === id) {
          return {
            ...p,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            stock: parseInt(formData.stock),
            image: formData.image,
          };
        }
        return p;
      });

      localStorage.setItem('customProducts', JSON.stringify(updatedProducts));
      toast.success('Producto actualizado exitosamente');
      navigate('/catalogo');
    } catch (error) {
      toast.error('Error al actualizar el producto');
    }
  };

  const handleDelete = () => {
    try {
      const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
      const updatedProducts = customProducts.filter((p: any) => p.id !== id);
      localStorage.setItem('customProducts', JSON.stringify(updatedProducts));
      toast.success('Producto eliminado exitosamente');
      navigate('/catalogo');
    } catch (error) {
      toast.error('Error al eliminar el producto');
    }
  };

  if (!product || !user) {
    return null;
  }

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/catalogo')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Editar Producto</CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El producto será eliminado permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Imagen */}
              <div className="space-y-2">
                <Label>Imagen del Producto *</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer text-orange-600 hover:text-orange-700"
                    >
                      Haz clic para subir una imagen
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, GIF hasta 10MB
                    </p>
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Jarrón de Cerámica"
                  required
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe tu producto artesanal en detalle..."
                  rows={4}
                  required
                />
              </div>

              {/* Categoría y Precio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== 'Todos').map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio (COP) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="50000"
                    required
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label htmlFor="stock">Cantidad en Stock *</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="10"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Guardar Cambios
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/catalogo')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
