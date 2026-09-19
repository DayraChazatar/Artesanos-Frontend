import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RequireRoleProps {
  role: 'artisan' | 'customer';
  children: ReactNode;
}

// Evita que alguien entre a una sección que no le corresponde solo escribiendo
// la URL a mano (ej. un cliente abriendo /perfil-artesano).
export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}
