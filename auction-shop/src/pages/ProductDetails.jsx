import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { products, bids, orders } from "../utils/api";
import { toast } from "react-hot-toast";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [product, setProduct] = useState(null);
  const [bidHistory, setBidHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bidAmount, setBidAmount] = useState(0);
  const [bidError, setBidError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productRes, bidsRes] = await Promise.all([
          products.getOne(id),
          bids.getHistory(id),
        ]);
        const productData = productRes.data;
        setProduct(productData);
        setBidHistory(Array.isArray(bidsRes.data) ? bidsRes.data : []);
        if (productData.images && productData.images.length > 0) {
          setSelectedImage(productData.images[0]);
        }
        if (productData.currentPrice) {
          setBidAmount(productData.currentPrice + 500); // Минимальный шаг ставки
        }
      } catch (err) {
        setError("Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError("");

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await bids.create(id, bidAmount);

      // Обновляем данные после успешной ставки
      const [productRes, bidsRes] = await Promise.all([
        products.getOne(id),
        bids.getHistory(id),
      ]);

      const productData = productRes.data;
      setProduct(productData);
      setBidHistory(Array.isArray(bidsRes.data) ? bidsRes.data : []);

      if (productData && typeof productData.currentPrice === "number") {
        setBidAmount(productData.currentPrice + 500);
      }
    } catch (err) {
      setBidError(err.response?.data?.message || "Ошибка при создании ставки");
    }
  };
  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      // Regular cart addition - uses current price
      await addToCart(product, false);
      toast.success("Товар добавлен в корзину");
    } catch (error) {
      toast.error("Ошибка при добавлении в корзину");
    }
  };
  const handleInstantBuy = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      if (!product.instantBuyEnabled) {
        toast.error("Мгновенная покупка недоступна для этого товара");
        return;
      }

      // Instant buy - uses instant buy price
      await addToCart(product, true);
      toast.success("Товар добавлен в корзину");
      navigate("/cart");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Ошибка при мгновенной покупке"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || "Товар не найден"}</p>
      </div>
    );
  }

  const timeLeft = new Date(product.endTime) - new Date();
  const isActive = product.status === "active" && timeLeft > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
        {/* Image gallery */}
        <div className="flex flex-col">
          <div className="w-full aspect-w-1 aspect-h-1">
            {selectedImage && (
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-center object-cover rounded-lg"
              />
            )}
          </div>
          {product.images && product.images.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className="relative rounded-lg overflow-hidden"
                >
                  <img
                    src={image}
                    alt={`View ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <span
                    className={`absolute inset-0 ring-2 ring-offset-2 ${
                      selectedImage === image
                        ? "ring-indigo-500"
                        : "ring-transparent"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {product.title}
          </h1>

          <div className="mt-3">
            <h2 className="sr-only">Информация о товаре</h2>
            <div className="space-y-2">
              {product.instantBuyEnabled && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-3xl font-semibold text-green-800">
                    Купить сейчас за ₽
                    {product.instantBuyPrice?.toLocaleString()}
                  </p>
                </div>
              )}
              <div className="mt-2">
                <p className="text-xl text-gray-900">
                  Текущая ставка: ₽{product.currentPrice?.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Начальная цена: ₽{product.startPrice?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Статус аукциона */}
          <div className="mt-6">
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 w-3 h-3 rounded-full ${
                  isActive ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <p className="ml-2 text-sm text-gray-500">
                {isActive
                  ? `Осталось: ${Math.floor(timeLeft / (1000 * 60 * 60))} ч.`
                  : "Аукцион завершен"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Описание</h3>
            <p className="text-base text-gray-900">{product.description}</p>
          </div>

          {/* Кнопки действий */}
          <div className="mt-6 space-y-4">
            {isActive &&
              user &&
              (!product.seller || user.id !== product.seller._id) && (
                <div className="space-y-4">
                  {product.instantBuyEnabled && (
                    <button
                      onClick={handleInstantBuy}
                      type="button"
                      className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Купить сейчас за ₽
                      {product.instantBuyPrice?.toLocaleString()}
                    </button>
                  )}
                  <form onSubmit={handleBidSubmit} className="space-y-4">
                    {bidError && (
                      <p className="text-sm text-red-600">{bidError}</p>
                    )}
                    <div>
                      <label
                        htmlFor="bid"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Ваша ставка
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₽</span>
                        </div>
                        <input
                          type="number"
                          name="bid"
                          id="bid"
                          min={product.currentPrice + 500}
                          step="100"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-green-500 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Сделать ставку
                    </button>
                  </form>
                </div>
              )}

            {user && !isInCart(product._id) && (
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full bg-white border border-indigo-600 rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Добавить в корзину
              </button>
            )}
            {user && isInCart(product._id) && (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="w-full bg-gray-100 border border-gray-300 rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-gray-600 hover:bg-gray-200"
              >
                В корзине
              </button>
            )}
          </div>

          {/* История ставок */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">
              История ставок
            </h3>
            <div className="mt-4 flow-root">
              <div className="-my-2">
                <div className="py-2 align-middle">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Участник
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ставка
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Время
                          </th>
                        </tr>
                      </thead>{" "}
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bidHistory && bidHistory.length > 0 ? (
                          bidHistory.map((bid, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {bid?.bidder?.name || "Аноним"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {bid?.amount
                                  ? `₽${bid.amount.toLocaleString()}`
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {bid?.timestamp
                                  ? new Date(bid.timestamp).toLocaleString()
                                  : "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="px-6 py-4 text-sm text-gray-500 text-center"
                            >
                              Пока нет ставок
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
