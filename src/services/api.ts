import axios from "axios";
import {
  Town,
  UC,
  SurveillanceFilters,
  SurveillanceResponse,
} from "@/types/surveillance";
import {
  EmployeePerformanceFilters,
  EmployeeSearchResponse,
  EmployeePerformanceResponse,
  EmployeeActivitiesResponse,
} from "@/types/employee-performance";

const API_BASE_URL = "/api/indoor-surveillance";
const OUTDOOR_API_BASE_URL = "/api/outdoor-surveillance";
const EMPLOYEE_PERFORMANCE_API_BASE_URL = "/api/employee-performance";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const outdoorApi = axios.create({
  baseURL: OUTDOOR_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const employeePerformanceApi = axios.create({
  baseURL: EMPLOYEE_PERFORMANCE_API_BASE_URL,
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

// Add request interceptor for outdoor API debugging
outdoorApi.interceptors.request.use(
  (config) => {
    console.log(
      "Outdoor API Request:",
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

// Add response interceptor for outdoor API error handling
outdoorApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Outdoor API Error Details:", {
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

// Add request interceptor for employee performance API debugging
employeePerformanceApi.interceptors.request.use(
  (config) => {
    console.log(
      "Employee Performance API Request:",
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

// Add response interceptor for employee performance API error handling
employeePerformanceApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Employee Performance API Error Details:", {
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

export const outdoorSurveillanceApi = {
  // Get all towns
  getTowns: async (): Promise<Town[]> => {
    try {
      const response = await outdoorApi.get("?endpoint=towns");
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
      const response = await outdoorApi.get(`?endpoint=ucs&town_id=${townId}`);
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

  // Get outdoor surveillance data with filters
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

      console.log("Sending outdoor request with params:", params.toString());

      const response = await outdoorApi.get<SurveillanceResponse>(`?${params.toString()}`);
      console.log("Outdoor API Response:", response.data);

      // Return the full response
      return response.data;
    } catch (error: unknown) {
      const err = error as Error & {
        response?: { status?: number; data?: unknown };
        config?: { params?: unknown };
      };
      console.error("Error fetching outdoor surveillance data:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        params: err.config?.params,
      });

      // Return empty response instead of throwing to prevent app crash
      if (err.response?.status === 422 || err.response?.status === 400) {
        console.warn("Outdoor API returned error - returning empty response");
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

export const employeePerformanceApiService = {
  // Search employees
  searchEmployees: async (searchTerm: string): Promise<EmployeeSearchResponse> => {
    try {
      const params = new URLSearchParams({
        endpoint: "search-employees",
        search: searchTerm,
      });

      const response = await employeePerformanceApi.get<EmployeeSearchResponse>(
        `?${params.toString()}`
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error & {
        response?: { status?: number; data?: unknown };
      };
      console.error("Error searching employees:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      // Return empty response if API fails
      return {
        employees: [],
        total_count: 0,
      };
    }
  },

  // Get employee performance data
  getEmployeePerformance: async (
    filters: EmployeePerformanceFilters
  ): Promise<EmployeePerformanceResponse> => {
    try {
      const params = new URLSearchParams({
        endpoint: "employee-performance",
        employeeId: filters.employeeId.toString(),
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });

      const response = await employeePerformanceApi.get<EmployeePerformanceResponse>(
        `?${params.toString()}`
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error & {
        response?: { status?: number; data?: unknown };
      };
      console.error("Error fetching employee performance:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw error;
    }
  },

  // Get employee activities with pagination
  getEmployeeActivities: async (
    filters: EmployeePerformanceFilters,
    page: number = 1,
    limit: number = 30
  ): Promise<EmployeeActivitiesResponse> => {
    try {
      const params = new URLSearchParams({
        endpoint: "employee-activities",
        employeeId: filters.employeeId.toString(),
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        page: page.toString(),
        limit: limit.toString(),
      });

      // Include username if available for better matching
      if (filters.username) {
        params.append("username", filters.username);
      }

      const response = await employeePerformanceApi.get<EmployeeActivitiesResponse>(
        `?${params.toString()}`
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as Error & {
        response?: { status?: number; data?: unknown };
      };
      console.error("Error fetching employee activities:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        filters,
        page,
        limit,
      });
      
      // Provide more detailed error information
      if (err.response?.status === 400) {
        const errorData = err.response.data as { error?: string };
        throw new Error(`Bad Request: ${errorData?.error || 'Invalid request parameters'}`);
      }
      
      throw error;
    }
  },
};

export default api;
