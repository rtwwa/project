import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleRemoveItem = async (item) => {
    try {
      await removeFromCart(item);
      toast.success("Товар удален из корзины");
    } catch (error) {
      toast.error("Ошибка при удалении товара");
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success("Корзина очищена");
    } catch (error) {
      toast.error("Ошибка при очистке корзины");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Корзина ({items.length})
        </h1>
        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-sm text-red-600 hover:text-red-500"
          >
            Очистить корзину
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Ваша корзина пуста</p>
          <Link
            to="/catalog"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <ul className="divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item._id} className="py-6">
                <div className="flex items-center">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <div className="ml-6 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          <Link
                            to={`/product/${item._id}`}
                            className="hover:text-indigo-600"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.finalPrice ? (
                            <>
                              Цена мгновенной покупки: ₽
                              {item.finalPrice?.toLocaleString()}
                            </>
                          ) : (
                            <>
                              Текущая цена: ₽
                              {item.currentPrice?.toLocaleString()}
                            </>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="ml-4 p-2 text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
              <p>Итого</p>
              <p>
                ₽
                {items
                  .reduce(
                    (sum, item) => sum + (item.finalPrice || item.currentPrice),
                    0
                  )
                  .toLocaleString()}
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/checkout"
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Оформить заказ
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
