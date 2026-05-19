import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Pakari Shop" className="h-8 w-8 object-contain" />
              <h3 className="font-semibold text-orange-600">Pakari Shop</h3>
            </div>
            <p className="text-sm text-gray-600">
              Conectando artesanos talentosos con personas que aprecian el trabajo hecho a mano.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalogo" className="text-gray-600 hover:text-orange-600">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/registro" className="text-gray-600 hover:text-orange-600">
                  Registro
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 hover:text-orange-600">
                  Iniciar Sesión
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                info@pakarishop.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +57 300 123 4567
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pasto, Nariño, Colombia
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Síguenos</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-orange-600">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2026 Pakari Shop. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}