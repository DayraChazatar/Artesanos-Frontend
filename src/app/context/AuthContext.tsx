import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const BASE = 'http://localhost:8000/api';

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
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  loginWithGoogle: (googleUser: User) => void;
  register: (name: string, email: string, password: string, role: 'customer' | 'artisan') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapDjangoUser(data: any, email?: string): User {
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  return {
    id:           String(data.id),
    name:         data.nombre,
    email:        email || data.correo || savedUser.email || '',
    role:         data.tipo === 'artesano' ? 'artisan' : 'customer',
    phone:        data.telefono ?? '',
    address:      '',
    bio:          data.biografia ?? '',
    specialty:    data.especialidad ?? '',
    profileImage: savedUser.profileImage || '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error('Error recuperando sesión:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const res = await fetch(`${BASE}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, password }),
    });

    if (!res.ok) throw new Error('Error de conexión con el servidor');

    const data = await res.json();
    if (!data.success) throw new Error(data.mensaje || 'Credenciales incorrectas');

    const savedPhoto =
      localStorage.getItem(`profileImage_${email}`) ||
      localStorage.getItem('profileImage_undefined') ||
      '';

    const loggedUser: User = {
      ...mapDjangoUser(data, email), // ← email pasado explícitamente
      profileImage: savedPhoto,
      email, // ← garantiza que siempre esté
    };

    setUser(loggedUser);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    localStorage.setItem('usuario_id', String(data.id));
    localStorage.setItem('usuario_nombre', data.nombre);
    if (data.token) localStorage.setItem('token', data.token);

    return { user: loggedUser, token: data.token };
  };

  const loginWithGoogle = (googleUser: User) => {
    setUser(googleUser);
    localStorage.setItem('user', JSON.stringify(googleUser));
    localStorage.setItem('usuario_id', googleUser.id);
    localStorage.setItem('usuario_nombre', googleUser.name);
  };

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
        nombre:       name,
        correo:       email,
        password,
        tipo:         role === 'artisan' ? 'artesano' : 'cliente',
        telefono:     '',
        especialidad: '',
        biografia:    '',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err?.correo) throw new Error('El correo ya está registrado');
      throw new Error('Error al crear la cuenta');
    }

    const data = await res.json();
    const newUser: User = { ...mapDjangoUser(data, email), email };

    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('usuario_id', String(data.id));
    localStorage.setItem('usuario_nombre', data.nombre);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_nombre');
    localStorage.removeItem('token');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    await fetch(`${BASE}/usuarios/${user.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre:       data.name      ?? user.name,
        telefono:     data.phone     ?? user.phone,
        biografia:    data.bio       ?? user.bio,
        especialidad: data.specialty ?? user.specialty,
      }),
    });
  };

  const resetPassword = async (email: string) => {
    const res  = await fetch(`${BASE}/usuarios/?correo=${email}`);
    const data = await res.json();
    if (!data || data.length === 0) throw new Error('No se encontró una cuenta con ese correo');
    console.log('Enlace de recuperación enviado a:', email);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{
      user, loading, login, loginWithGoogle,
      register, logout, isAuthenticated: !!user,
      updateProfile, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}