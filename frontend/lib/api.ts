import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_LARAVEL_API_BASE_URL ||
    "https://tayibat-production.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const authToken = localStorage.getItem("authToken");

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

export default api;
