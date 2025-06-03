/**
 * HTTP Client
 * Low-level HTTP client for making API requests with proper error handling
 */

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: string
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

export class HttpClient {
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: 30000,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      ...config
    };
  }

  async request<T = any>(endpoint: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    
    // Set up timeout
    const timeout = options.timeout || this.config.timeout;
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          ...this.config.defaultHeaders,
          ...options.headers
        },
        body: options.body,
        signal: options.signal || controller.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new HttpError(response.status, response.statusText, errorBody);
      }

      const data = await response.json();
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      
      if (error instanceof HttpError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Failed to connect to ${url}. Please check if the service is running.`);
      }
      
      throw error;
    }
  }

  async get<T = any>(endpoint: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options?: Omit<HttpRequestOptions, 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  }

  async put<T = any>(endpoint: string, body?: any, options?: Omit<HttpRequestOptions, 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  }

  async delete<T = any>(endpoint: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  updateConfig(newConfig: Partial<HttpClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): HttpClientConfig {
    return { ...this.config };
  }
} 