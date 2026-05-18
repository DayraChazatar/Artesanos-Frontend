
// src/app/data/artesanoApi.ts
const BASE = 'http://localhost:8000/api';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface Categoria {
  id?: number;
  nombre: string;
  descripcion: string;
  artesano: number;
}

type ColorProducto = {
  hex: string;
  nombre: string;
};

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
  colores?: ColorProducto[];
  maneja_tallas?: boolean;
  tallas?: string[];
  cantidad_reservada?: number
  cantidad_disponible?: number
}

export interface Kardex {
  id?: number;
  producto: number;
  producto_nombre?: string;
  pedido_ref?: string | null;
  tipo?: 'Entrada' | 'Salida' | 'Ajuste' | 'Devolucion';
  tipo_display?: string;
  subtipo?: string;
  subtipo_display?: string;
  origen?: 'automatico' | 'manual';
  origen_display?: string;
  cantidad: number;
  stock_resultante?: number;
  precio_unitario?: number | null;
  fecha: string;
  nota: string;
  creado_por?: string;
  creado_en?: string;
}

export interface ResumenInventario {
  total_entradas: number;
  total_salidas: number;
  balance_neto: number;
  total_movimientos: number;
  valor_movido: number;
}

export interface FiltrosKardex {
  desde?: string;
  hasta?: string;
  producto?: number;
  tipo?: string;
  origen?: string;
}

// ── Helper base ───────────────────────────────────────────────────────────────
// ✅ REEMPLAZAR request completo
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = options?.method ?? 'GET';
    xhr.open(method, url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Token ${token}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let detail;
        try { detail = JSON.parse(xhr.responseText); } catch { detail = xhr.statusText; }
        console.error('API error:', detail);
        reject(new Error(JSON.stringify(detail)));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(options?.body as string ?? null);
  });
}
// ── Categorías ────────────────────────────────────────────────────────────────
export const getCategorias = (artesanoId: number) =>
  request<Categoria[]>(`${BASE}/categorias/?artesano=${artesanoId}`);

export const createCategoria = (data: Categoria) =>
  request<Categoria>(`${BASE}/categorias/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteCategoria = (id: number) =>
  fetch(`${BASE}/categorias/${id}/`, { method: 'DELETE' });

export const updateCategoria = (id: number, data: Omit<Categoria, 'id'>) =>
  request<Categoria>(`${BASE}/categorias/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// ── Productos ─────────────────────────────────────────────────────────────────
export const getProductos = (artesanoId: number) =>
  request<Producto[]>(`${BASE}/productos/?artesano=${artesanoId}`);

export const createProducto = (data: Producto) =>
  request<Producto>(`${BASE}/productos/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteProducto = (id: number) =>
  fetch(`${BASE}/productos/${id}/`, { method: 'DELETE' });

export const updateProducto = (id: number, data: Omit<Producto, 'id'>) =>
  request<Producto>(`${BASE}/productos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// ── Kardex — historial de movimientos ────────────────────────────────────────
export const getKardex = (filtros?: FiltrosKardex) => {
  const params = new URLSearchParams();
  if (filtros?.desde)    params.append('desde',    filtros.desde);
  if (filtros?.hasta)    params.append('hasta',    filtros.hasta);
  if (filtros?.producto) params.append('producto', String(filtros.producto));
  if (filtros?.tipo)     params.append('tipo',     filtros.tipo);
  if (filtros?.origen)   params.append('origen',   filtros.origen);
  const query = params.toString();
  return request<Kardex[]>(
    `${BASE}/kardex/${query ? '?' + query : ''}`
  );
};

// ── Kardex — movimiento manual desde formulario inventario ───────────────────
export const createKardex = (data: {
  producto: number;
  cantidad: number;
  fecha: string;
  nota?: string;
  precio_pvp?: number;   // ← único campo nuevo
}) =>
  request<Kardex>(`${BASE}/inventario/kardex/nuevo/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
// ── Reposición — botón +Stock desde tabla de Productos ───────────────────────
export const reponerStock = async (data: {
  producto: number;
  cantidad: number;
  nota?: string;
}): Promise<Kardex> => {
  const res = await request<{ movimiento: Kardex; stock_actual: number }>(
    `${BASE}/inventario/reposicion/`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  return {
    ...res.movimiento,
    stock_resultante: res.stock_actual,
  };
};

// ── Resumen inventario — datos para tarjetas superiores ──────────────────────
export const getResumenInventario = () =>
  request<ResumenInventario>(`${BASE}/inventario/resumen/`);

// ── Reportes ──────────────────────────────────────────────────────────────────
const REPORTES_BASE = 'http://localhost:8000/api/reportes';

export const descargarReporte = (
  tipo: string,
  formato: 'excel' | 'pdf',
  artesanoId: number
) => {
  const url = `${REPORTES_BASE}/${tipo}/${formato}/?artesano=${artesanoId}`;
  window.open(url, '_blank');
};