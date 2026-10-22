import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === "development"
      ? "https://gupshup-inrb.onrender.com/api"
      : "https://gupshup-inrb.onrender.com/api"),
  withCredentials: true,
});

