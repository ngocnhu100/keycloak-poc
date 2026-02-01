import axios from "axios";
import keycloak from "../auth/keycloak";

/**
 * Axios instance configured for the backend API
 * Automatically attaches JWT token to requests
 */
const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor: Attach JWT token to every request
 */
api.interceptors.request.use(
  (config) => {
    if (keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor: Handle token expiry and refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token (30 seconds minimum validity)
        const refreshed = await keycloak.updateToken(30);

        if (refreshed) {
          console.log("Token refreshed successfully");
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.error("Token refresh failed:", refreshError);
        keycloak.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
