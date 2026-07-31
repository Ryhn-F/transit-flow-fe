import axios from "axios";
import { env } from "@/lib/env";

export const httpClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ?? "Unexpected network error";
    return Promise.reject(new Error(message));
  },
);
