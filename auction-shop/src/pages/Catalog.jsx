import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu } from "@headlessui/react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { products } from "../utils/api";
import ProductCard from "../components/ProductCard";

const categories = [
  "Все",
  "Женская одежда",
  "Мужская одежда",
  "Женская обувь",
  "Мужская обувь",
  "Спортивная одежда",
  "Аксессуары",
  "Детская одежда",
  "Детская обувь",
];

const sortOptions = [
  { label: "По времени завершения", value: "endTime" },
  { label: "Цена: по возрастанию", value: "priceAsc" },
  { label: "Цена: по убыванию", value: "priceDesc" },
  { label: "Сначала новые", value: "newest" },
];

const statusOptions = [
  { label: "Все", value: "" },
  { label: "Активные", value: "active" },
  { label: "Завершенные", value: "ended" },
  { label: "Проданные", value: "sold" },
];

export default function Catalog() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productList, setProductList] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Фильтры
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState("endTime");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const menuButtonRef = useRef();

  useEffect(() => {
    fetchProducts();
  }, [
    selectedCategory,
    selectedStatus,
    selectedSort,
    priceRange,
    searchQuery,
    currentPage,
  ]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        sort: selectedSort,
        limit: 12,
      };

      if (selectedCategory !== "Все") {
        params.category = selectedCategory;
      }

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      if (priceRange.min) {
        params.minPrice = priceRange.min;
      }

      if (priceRange.max) {
        params.maxPrice = priceRange.max;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await products.getAll(params);
      setProductList(response.data.products);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (err) {
      setError("Ошибка при загрузке товаров");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const clearFilters = () => {
    setSelectedCategory("Все");
    setSelectedStatus("");
    setSelectedSort("endTime");
    setPriceRange({ min: "", max: "" });
    setSearchQuery("");
    setCurrentPage(1);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Каталог товаров
        </h1>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Поиск */}
          <form onSubmit={handleSearch} className="flex-1 sm:flex-none">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по товарам..."
                className="w-full sm:w-64 pl-3 pr-10 py-2 border border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </form>
          {user && (
            <Link
              to="/new-product"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Создать лот
            </Link>
          )}{" "}
          <Menu as="div" className="relative dropdown-content">
            <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Фильтры
            </Menu.Button>
            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none modal-content">
              <div className="py-1">
                {/* Категории */}
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">Категория</p>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Статус */}
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">Статус</p>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Сортировка */}
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    Сортировка
                  </p>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Цена */}
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">Цена</p>
                  <div className="mt-2 flex space-x-2">
                    <input
                      type="number"
                      placeholder="От"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          min: e.target.value,
                        }))
                      }
                    />
                    <input
                      type="number"
                      placeholder="До"
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          max: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Кнопка сброса */}
                <div className="px-4 py-2">
                  <button
                    onClick={clearFilters}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>
      {/* Список товаров */}
      {productList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Товары не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {productList.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}{" "}
      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Назад
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === i + 1
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Вперед
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
