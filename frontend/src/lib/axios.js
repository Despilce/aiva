import axios from "axios";
import toast from "react-hot-toast";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : "/api",
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log("Making request:", {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response received:", {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    console.error("Response error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      toast.error("Session expired. Please log in again.");
      // You might want to redirect to login or refresh the token here
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to access this resource.");
    }

    return Promise.reject(error);
  }
);
