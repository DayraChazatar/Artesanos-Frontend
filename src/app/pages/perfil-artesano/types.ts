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
  producto_codigo?: string;
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
  metodo_pago?: 'wompi' | 'transferencia';
  comprobante_url?: string | null;
  pago_directo_banco?: string | null;
  pago_directo_tipo_cuenta?: string | null;
  pago_directo_numero?: string | null;
  pago_directo_titular?: string | null;
}

export type Tab = 'perfil' | 'catalogo' | 'productos' | 'inventario' | 'pedidos' | 'reportes';