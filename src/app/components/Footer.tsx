import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function perfilRoute(role?: string) {
  if (role === 'artisan') return '/perfil-artesano';
  if (role === 'admin') return '/admin';
  return '/perfil';
}

export function Footer() {
  const { user, isAuthenticated } = useAuth();

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
              {isAuthenticated ? (
                <li>
                  <Link to={perfilRoute(user?.role)} className="text-gray-600 hover:text-orange-600">
                    Mi cuenta
                  </Link>
                </li>
              ) : (
                <>
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
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                pakarishop.soporte@gmail.com
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
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/politica-datos" className="text-gray-600 hover:text-orange-600">
                  Política de datos
                </Link>
              </li>
              <li>
                <Link to="/terminos-condiciones" className="text-gray-600 hover:text-orange-600">
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2026 Pakari Shop. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}