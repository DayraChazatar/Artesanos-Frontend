import { Link, useRouteError } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Home, RefreshCw } from 'lucide-react';

export function ErrorPage() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error('Error en la página:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4 max-w-md">
        <h1 className="text-6xl mb-4" aria-hidden="true">😕</h1>
        <h2 className="text-2xl font-bold mb-3">Algo salió mal</h2>
        <p className="text-gray-600 mb-8">
          Encontramos un error inesperado. Intenta recargar la página o vuelve al inicio.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recargar
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
