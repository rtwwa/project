import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart, isInCart } = useCart();
  const { _id, title, currentPrice, startPrice, images, endTime } = product;
  const imageUrl = images && images.length > 0 ? images[0] : "";
  const timeLeft = new Date(endTime) - new Date();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const handleAddToCart = async (e) => {
    e.preventDefault(); // Предотвращаем всплытие события на Link
    if (!isInCart(_id)) {
      try {
        // From card view, we always use the regular (non-instant buy) price
        await addToCart(product, false);
        toast.success("Товар добавлен в корзину");
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Ошибка при добавлении в корзину"
        );
      }
    } else {
      toast.error("Товар уже в корзине");
    }
  };

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden">
      <div className="aspect-w-3 aspect-h-4 bg-gray-200 group-hover:opacity-75">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-48 object-cover object-center"
        />
        <button
          onClick={handleAddToCart}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 focus:outline-none"
        >
          <svg
            className={`h-6 w-6 ${
              isInCart(_id) ? "text-indigo-600" : "text-gray-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 p-4 space-y-2 flex flex-col">
        <h3 className="text-sm font-medium text-gray-900">
          <Link to={`/product/${_id}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        <div className="flex-1 flex flex-col justify-end">
          <p className="text-sm text-gray-500">Начальная цена: ₽{startPrice}</p>
          <p className="text-base font-medium text-gray-900">
            Текущая ставка: ₽{currentPrice}
          </p>
          <p className="text-sm text-indigo-600">
            {hoursLeft > 0 ? `Осталось: ${hoursLeft} ч.` : "Аукцион завершен"}
          </p>
        </div>
      </div>
    </div>
  );
}
