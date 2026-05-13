// src/app/data/artesanoApi.ts
// Centraliza todas las llamadas a la API Django

const BASE = 'http://localhost:8000/api';

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface Categoria {
  id?: number;
  nombre: string;
  descripcion: string;
  artesano: number;
}
type ColorProducto = {
  hex: string;
  nombre: string;
}

export interface Producto {
  id?: number;
  codigo_barra?: string;
  lote?: string;
  nombre: string;
  categoria: number | null;
  categoria_nombre?: string;
  precio_neto: number;
  precio_pvp?: number;
  iva: number;
  descuento: boolean;
  valor_descuento?: number;
  cantidad: number;
  stock_minimo: number;
  stock_maximo: number;
  artesano: number;
  precio_con_iva?: number;
  precio_final?: number;
  estado_stock?: 'bajo' | 'normal' | 'maximo';
  colores?: ColorProducto[];        // ← agregado
  maneja_tallas?: boolean;   // ← agregado
  tallas?: string[];
}

export interface Kardex {
  id?: number;
  producto: number;
  producto_nombre?: string;
  tipo: 'Entrada' | 'Salida';
  cantidad: number;
  fecha: string;
  nota: string;
  cantidad_inicial?: number;  // ← agregar
  stock_minimo?: number;       // ← agregar
  stock_maximo?: number;
}

// ── Helper ───────────────────────────────────────────────────────────────────
// ── Helper ───────────────────────────────────────────────────────────────────
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => res.statusText);
    console.error('API error:', detail);
    throw new Error(JSON.stringify(detail));
  }
  return res.json();
}
export async function updateProducto(id: number, data: Omit<Producto, 'id'>): Promise<Producto> {
  const res = await fetch(`${BASE}/productos/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}
export async function updateCategoria(id: number, data: Omit<Categoria, 'id'>): Promise<Categoria> {
  const res = await fetch(`${BASE}/categorias/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

// ── Categorías ────────────────────────────────────────────────────────────────
export const getCategorias = (artesanoId: number) =>
  request<Categoria[]>(`${BASE}/categorias/?artesano=${artesanoId}`);

export const createCategoria = (data: Categoria) =>
  request<Categoria>(`${BASE}/categorias/`, { method: 'POST', body: JSON.stringify(data) });

export const deleteCategoria = (id: number) =>
  fetch(`${BASE}/categorias/${id}/`, { method: 'DELETE' });

// ── Productos ─────────────────────────────────────────────────────────────────
export const getProductos = (artesanoId: number) =>
  request<Producto[]>(`${BASE}/productos/?artesano=${artesanoId}`);

export const createProducto = (data: Producto) =>
  request<Producto>(`${BASE}/productos/`, { method: 'POST', body: JSON.stringify(data) });

export const deleteProducto = (id: number) =>
  fetch(`${BASE}/productos/${id}/`, { method: 'DELETE' });

// ── Kardex ────────────────────────────────────────────────────────────────────
export const getKardex = () =>
  request<Kardex[]>(`${BASE}/kardex/`);

export const createKardex = (data: Kardex) =>
  request<Kardex>(`${BASE}/kardex/`, { method: 'POST', body: JSON.stringify(data) });