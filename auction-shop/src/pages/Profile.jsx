import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bids, products, auth } from "../utils/api";

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeBids, setActiveBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const [activeBidsResponse, wonAuctionsResponse, myProductsResponse] =
          await Promise.all([
            bids.getActive(),
            bids.getWon(),
            products.getMy(),
          ]);

        setActiveBids(activeBidsResponse.data);
        setWonAuctions(wonAuctionsResponse.data);
        setMyProducts(myProductsResponse.data);
      } catch (err) {
        setError("Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateSuccess("");

    // Проверка нового пароля
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setUpdateError("Пароли не совпадают");
        return;
      }
      if (formData.newPassword.length < 6) {
        setUpdateError("Пароль должен быть не менее 6 символов");
        return;
      }
    }

    try {
      const response = await auth.updateProfile({
        name: formData.name,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setUser(response.data.user);
      setUpdateSuccess("Профиль успешно обновлен");
      setEditMode(false);

      // Очищаем поля пароля
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setUpdateError(
        err.response?.data?.message || "Ошибка при обновлении профиля"
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Профиль пользователя
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Добро пожаловать, {user.name}!
            </p>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {editMode ? "Отменить" : "Редактировать профиль"}
          </button>
        </div>
      </div>

      {editMode ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Редактирование профиля
            </h2>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {updateError && (
              <div className="mb-4 text-sm text-red-600">{updateError}</div>
            )}
            {updateSuccess && (
              <div className="mb-4 text-sm text-green-600">{updateSuccess}</div>
            )}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Имя
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Текущий пароль
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Новый пароль (не обязательно)
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Подтверждение нового пароля
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Активные ставки */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Активные ставки
            </h2>
          </div>
          <div className="border-t border-gray-200">
            {activeBids.length === 0 ? (
              <p className="p-4 text-gray-500">У вас нет активных ставок</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {activeBids.map((product) => (
                  <li key={product._id} className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-16 w-16 object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {product.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Текущая ставка: ₽{product.currentPrice}
                        </p>
                        <p className="mt-1 text-sm text-indigo-600">
                          {new Date(product.endTime) > new Date()
                            ? `Завершится: ${new Date(
                                product.endTime
                              ).toLocaleDateString()}`
                            : "Аукцион завершен"}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Подробнее
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Выигранные аукционы */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Выигранные аукционы
            </h2>
          </div>
          <div className="border-t border-gray-200">
            {wonAuctions.length === 0 ? (
              <p className="p-4 text-gray-500">
                У вас нет выигранных аукционов
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {wonAuctions.map((product) => (
                  <li key={product._id} className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-16 w-16 object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {product.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Финальная цена: ₽{product.currentPrice}
                        </p>
                        <p className="mt-1 text-sm text-green-600">
                          Выигран:{" "}
                          {new Date(product.endTime).toLocaleDateString()}
                        </p>
                      </div>
                      {product.status === "ended" && (
                        <button
                          onClick={() =>
                            navigate(`/checkout?productId=${product._id}`)
                          }
                          className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                        >
                          Оформить заказ
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Мои лоты */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Мои лоты</h2>
          </div>
          <div className="border-t border-gray-200">
            {myProducts.length === 0 ? (
              <p className="p-4 text-gray-500">У вас нет выставленных лотов</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {myProducts.map((product) => (
                  <li key={product._id} className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-16 w-16 object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {product.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Текущая цена: ₽{product.currentPrice}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Количество ставок: {product.bids?.length || 0}
                        </p>
                        <p className="mt-1 text-sm text-indigo-600">
                          {new Date(product.endTime) > new Date()
                            ? `Завершится: ${new Date(
                                product.endTime
                              ).toLocaleDateString()}`
                            : "Аукцион завершен"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
