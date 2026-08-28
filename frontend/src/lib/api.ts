const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const api = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("bps_auth_token");
  },

  setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("bps_auth_token", token);
    }
  },

  removeToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("bps_auth_token");
    }
  },

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Default to JSON if body is not FormData
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        if (!response.ok) {
          throw new Error(`Server Error (${response.status}): ${text || response.statusText}`);
        }
        data = { success: true, message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || `Request gagal dengan status ${response.status}`);
      }

      return data as ApiResponse<T>;
    } catch (err: any) {
      throw new Error(err.message || "Gagal terhubung ke server backend");
    }
  },

  get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  },

  post<T = any>(endpoint: string, body?: any) {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  put<T = any>(endpoint: string, body?: any) {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  },
};
