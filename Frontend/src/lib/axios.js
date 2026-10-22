import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development"
      ? "https://gupshup-inrb.onrender.com/api"
      : "https://gupshup-inrb.onrender.com/api"),
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

