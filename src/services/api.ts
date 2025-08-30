import axios from "axios";
import {
  Town,
  UC,
  SurveillanceFilters,
  SurveillanceResponse,
} from "@/types/surveillance";

const API_BASE_URL = "/api/indoor-surveillance";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(
      "API Request:",
      config.method?.toUpperCase(),
      config.url,
      config.params
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      params: error.config?.params,
    });
    return Promise.reject(error);
  }
);

export const surveillanceApi = {
  // Get all towns
  getTowns: async (): Promise<Town[]> => {
    try {
      const response = await api.get("?endpoint=towns");
      return response.data;
    } catch (error: unknown) {
      const err = error as Error & {
        response?: { status?: number; data?: unknown };
      };
      console.error("Error fetching towns:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      // Return empty array if API fails
      return [];
    }
  },

  // Get UCs for a specific town
  getUCs: async (townId: number | string): Promise<UC[]> => {
    try {
      const response = await api.get(`?endpoint=ucs&town_id=${townId}`);
      return response.data;
    } catch (error: unknown) {
      const err = error as Error & {
        response?: { status?: number; data?: unknown };
      };
      console.error("Error fetching UCs:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      // Return empty array if API fails
      return [];
    }
  },

  // Get surveillance data with filters
  getSurveillanceData: async (
    filters: SurveillanceFilters
  ): Promise<SurveillanceResponse> => {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        endpoint: "surveillance-data",
        date: filters.date,
      });

      if (filters.townCode) {
        params.append("town_code", filters.townCode.toString());
      }

      if (filters.ucCode) {
        params.append("uc_code", filters.ucCode.toString());
      }

      console.log("Sending request with params:", params.toString());

      const response = await api.get<SurveillanceResponse>(`?${params.toString()}`);
      console.log("API Response:", response.data);

      // Return the full response
      return response.data;
    } catch (error: unknown) {
      const err = error as Error & {
        response?: { status?: number; data?: unknown };
        config?: { params?: unknown };
      };
      console.error("Error fetching surveillance data:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        params: err.config?.params,
      });

      // Return empty response instead of throwing to prevent app crash
      if (err.response?.status === 422 || err.response?.status === 400) {
        console.warn("API returned error - returning empty response");
        return {
          combined_data: [],
          container_data: [],
          users: [],
          total_records: 0,
        };
      }

      throw error;
    }
  },
};

export default api;
