import React, { createContext, useContext, useState, useEffect } from 'react';
 
const BASE = 'http://localhost:8000/api';
 
// ── Tipos ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'artisan' | 'admin';
  phone?: string;
  address?: string;
  bio?: string;
  specialty?: string;
  profileImage?: string;
}
 
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'artisan'
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
 
const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
// ── Mapea la respuesta de Django al tipo User del frontend ───────────────────
function mapDjangoUser(data: any): User {
  return {
    id:           String(data.id),
    name:         data.nombre,
    email:        data.correo,
    role:         data.tipo === 'artesano' ? 'artisan' : 'customer',
    phone:        data.telefono   ?? '',
    address:      '',
    bio:          data.biografia  ?? '',
    specialty:    data.especialidad ?? '',
    profileImage: '',
  };
}
 
// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
 
  // Restaurar sesión al recargar
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);
 
  // ── LOGIN — llama a Django ──────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, password }),
    });
 
    if (!res.ok) throw new Error('Error de conexión con el servidor');
 
    const data = await res.json();
 
    if (!data.success) {
      throw new Error(data.mensaje || 'Credenciales incorrectas');
    }
 
    const loggedUser = mapDjangoUser(data);
    setUser(loggedUser);
    localStorage.setItem('user',         JSON.stringify(loggedUser));
    localStorage.setItem('usuario_id',   String(data.id));
    localStorage.setItem('usuario_nombre', data.nombre);
  };
 
  // ── REGISTRO — crea usuario en Django ──────────────────────────────────
  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'artisan'
  ) => {
    const res = await fetch(`${BASE}/usuarios/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre:      name,
        correo:      email,
        password:    password,
        tipo:        role === 'artisan' ? 'artesano' : 'cliente',
        telefono:    '',
        especialidad: '',
        biografia:   '',
      }),
    });
 
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err?.correo) throw new Error('El correo ya está registrado');
      throw new Error('Error al crear la cuenta');
    }
 
    const data = await res.json();
 
    // Login automático tras registro
    const newUser = mapDjangoUser(data);
    setUser(newUser);
    localStorage.setItem('user',           JSON.stringify(newUser));
    localStorage.setItem('usuario_id',     String(data.id));
    localStorage.setItem('usuario_nombre', data.nombre);
  };
 
  // ── LOGOUT ──────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_nombre');
  };
 
  // ── UPDATE PROFILE ──────────────────────────────────────────────────────
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
 
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
 
    // Sincroniza con Django
    await fetch(`${BASE}/usuarios/${user.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre:      data.name       ?? user.name,
        telefono:    data.phone      ?? user.phone,
        biografia:   data.bio        ?? user.bio,
        especialidad: data.specialty ?? user.specialty,
      }),
    });
  };
 
  // ── RESET PASSWORD (simulado) ────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    // En producción conectar con endpoint real de Django
    const res = await fetch(`${BASE}/usuarios/?correo=${email}`);
    const data = await res.json();
    if (!data || data.length === 0) {
      throw new Error('No se encontró una cuenta con ese correo');
    }
    console.log('Enlace de recuperación enviado a:', email);
  };
 
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}