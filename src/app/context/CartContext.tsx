import React, { createContext, useContext, useState, useEffect } from 'react';

const BASE = 'http://localhost:8000/api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  artisan: string;
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
}

interface CheckoutResult {
  ok: boolean;
  pedido?: any;   // PedidoSerializer data
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

      // Éxito → vaciar carrito
      clearCart();
      return { ok: true, pedido: data };
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