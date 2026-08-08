export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  detalle: string;
  leida: boolean;
  fecha: string;
  referencia_id?: number;
  ruta?: string;
}

export interface DetallePedido {
  id: number;
  producto: number;
  producto_nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  codigo: string;
  cliente: number;
  cliente_nombre: string;
  artesano: number;
  artesano_nombre: string;
  estado: string;
  total: number;
  direccion: string;
  telefono: string;
  fecha: string;
  updated: string;
  detalles: DetallePedido[];
  numero_guia?: string;
  transportadora?: string;
  fecha_envio?: string;
  fecha_entrega?: string;
}

export type Tab = 'perfil' | 'catalogo' | 'contable' | 'productos' | 'inventario' | 'pedidos' | 'reportes';