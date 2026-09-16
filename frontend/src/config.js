const envUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const config = {
  API_URL: envUrl || (import.meta.env.DEV ? "http://localhost:8000" : ""),
};

export const getAuthHeaders = (extra = {}) => {
  const token = localStorage.getItem("braino_auth_token");
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default config;
