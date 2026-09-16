import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../utils/config';
const BASE = API_BASE;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  artisan: string;
  /** id numérico del artesano dueño — necesario para dividir el carrito en
   * un pedido por artesano y para saber quién ofrece pago directo. */
  artesanoId?: number;
  stock: number;
  discount?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface CheckoutOptions {
  clienteId: number;
  direccion?: string;
  telefono?: string;
  /** id de artesano (como texto) → 'wompi' | 'transferencia'. Si un
   * artesano del carrito no aparece aquí, se le cobra por Wompi. */
  metodosPago?: Record<string, 'wompi' | 'transferencia'>;
}

interface CheckoutResult {
  ok: boolean;
  /** Uno o más pedidos — el carrito se divide en un pedido por artesano. */
  pedidos?: any[];   // PedidoSerializer data, uno por artesano
  error?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  /** Crea el pedido en el backend y vacía el carrito si tiene éxito */
  checkout: (options: CheckoutOptions) => Promise<CheckoutResult>;
  /** Completa el artesanoId de un producto que quedó guardado en el carrito
   * antes de que este dato existiera (carritos viejos en localStorage). */
  fijarArtesanoId: (productId: string, artesanoId: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const fijarArtesanoId = (productId: string, artesanoId: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId && item.artesanoId == null
          ? { ...item, artesanoId }
          : item
      )
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  /**
   * Envía el carrito al backend para crear el pedido.
   * Si la creación es exitosa, vacía el carrito local.
   */
  const checkout = async (options: CheckoutOptions): Promise<CheckoutResult> => {
    if (cart.length === 0) {
      return { ok: false, error: 'El carrito está vacío' };
    }

    const body = {
      cliente_id: options.clienteId,
      direccion:  options.direccion ?? '',
      telefono:   options.telefono  ?? '',
      items: cart.map((item) => ({
        producto_id: Number(item.id),
        cantidad:    item.quantity,
        precio:      item.price,
      })),
      metodos_pago: options.metodosPago ?? {},
    };

    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`${BASE}/inventario/pedidos/crear/`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        return { ok: false, error: data.error ?? 'Error al crear el pedido' };
      }
      // El backend siempre devuelve una lista (un pedido por artesano).
      return { ok: true, pedidos: Array.isArray(data) ? data : [data] };
    } catch (e) {
      return { ok: false, error: 'Error de conexión con el servidor' };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        checkout,
        fijarArtesanoId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}