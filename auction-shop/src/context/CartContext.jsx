import { createContext, useContext, useEffect, useState } from "react";
import { cart as cartApi } from "../utils/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загрузка корзины при входе пользователя
  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        try {
          const response = await cartApi.getItems();
          setItems(response.data);
        } catch (error) {
          console.error("Ошибка при загрузке корзины:", error);
        }
      }
      setLoading(false);
    };

    fetchCart();
  }, [user]);
  const addToCart = async (product, useInstantBuy = false) => {
    if (!user) {
      throw new Error("Необходимо войти в систему");
    }

    if (useInstantBuy && !product.instantBuyEnabled) {
      throw new Error("Мгновенная покупка недоступна для этого товара");
    }

    try {
      const finalPrice = useInstantBuy
        ? product.instantBuyPrice
        : product.currentPrice;

      if (!finalPrice || finalPrice <= 0) {
        throw new Error("Неверная цена товара");
      }

      const response = await cartApi.addItem(product._id, finalPrice);
      setItems(response.data.items);
    } catch (error) {
      console.error("Ошибка при добавлении в корзину:", error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  };

  const removeFromCart = async (product) => {
    if (!user) {
      return;
    }

    try {
      const response = await cartApi.removeItem(product._id);
      setItems(response.data.items);
    } catch (error) {
      console.error("Ошибка при удалении из корзины:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await cartApi.clear();
      setItems(response.data.items);
    } catch (error) {
      console.error("Ошибка при очистке корзины:", error);
      throw error;
    }
  };

  const isInCart = (productId) => {
    return items.some((item) => item._id === productId);
  };

  if (loading) {
    return null; // или компонент загрузки
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
