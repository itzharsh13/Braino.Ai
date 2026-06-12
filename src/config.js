// Empty VITE_API_URL in production = same-origin /api (nginx proxy in Docker)
const envUrl = import.meta.env.VITE_API_URL;
const devFallback = "http://localhost:8000";

const config = {
 API_URL:
  envUrl !== undefined && envUrl !== ""
    ? envUrl
    : import.meta.env.DEV
      ? "http://localhost:8000"
      : "/api",
};

export default config;
