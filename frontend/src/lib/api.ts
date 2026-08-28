const getBaseUrl = (): string => {
  // Always use relative /api so requests go through Next.js reverse proxy rewrites
  // This guarantees 100% compatibility across Ngrok, LAN IP (192.168.x.x), Docker, and Localhost
  return "/api";
};

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
    const base = getBaseUrl();
    const url = `${base}${cleanEndpoint.startsWith("/api") ? cleanEndpoint.replace(/^\/api/, "") : cleanEndpoint}`;

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
          throw new Error(text || `HTTP error! status: ${response.status}`);
        }
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  get<T = any>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T = any>(endpoint: string, body?: any, options: RequestInit = {}) {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  put<T = any>(endpoint: string, body?: any, options: RequestInit = {}) {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete<T = any>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  },
};
