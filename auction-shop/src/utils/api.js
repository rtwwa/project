import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getCurrentUser: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
};

export const products = {
  getAll: (params) => api.get("/products", { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  getMy: () => api.get("/products/my"),
  placeBid: (id, amount) => api.post(`/products/${id}/bid`, { amount }),
};

export const orders = {
  create: (data) => api.post("/orders", data),
  getUserOrders: () => api.get("/orders/me"),
  getOne: (id) => api.get(`/orders/${id}`),
  confirmPayment: (id) => api.post(`/orders/${id}/pay`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

export const bids = {
  create: (productId, amount) => api.post(`/bids/${productId}`, { amount }),
  getActive: () => api.get("/bids/active"),
  getWon: () => api.get("/bids/won"),
  getHistory: (productId) => api.get(`/bids/history/${productId}`),
};

export const cart = {
  getItems: () => api.get("/cart"),
  addItem: (productId, finalPrice) =>
    api.post(`/cart/add/${productId}`, { finalPrice }),
  removeItem: (productId) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete("/cart/clear"),
};

export default api;
