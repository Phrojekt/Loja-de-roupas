"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  size: string;
  cartId: string;
}

interface CartContextType {
  cart: Product[];
  addToCart: (product: Omit<Product, 'cartId'>) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, change: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Inicialização do carrinho
  useEffect(() => {
    setIsClient(true);
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (error) {
        console.error("Erro ao carregar o carrinho:", error);
      }
    }
  }, []);

  // Atualização do localStorage
  useEffect(() => {
    if (isClient) {
      if (cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(cart));
      } else {
        localStorage.removeItem("cart");
      }
    }
  }, [cart, isClient]);

  const addToCart = (product: Omit<Product, 'cartId'>) => {
    if (!product.id) {
      console.error("Produto sem ID válido:", product);
      return;
    }

    setCart((prevCart) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const cartId = `${product.id}-${product.size}-${timestamp}-${randomString}`;
      
      const newProduct = {
        ...product,
        cartId,
        quantity: 1
      };

      return [...prevCart, newProduct];
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, change: number) => {
    setCart((prevCart) => 
      prevCart.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    if (isClient) {
      localStorage.removeItem("cart");
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Não renderiza nada até que estejamos no cliente
  if (!isClient) {
    return null;
  }

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        total 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
}
