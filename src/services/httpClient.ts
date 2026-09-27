/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Centralized HTTP client with AbortController timeout, automatic JSON parsing,
 * and normalized error handling for 4xx/5xx status codes.
 */
export async function httpClient<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 30000, headers = {}, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
      ...rest,
    });

    clearTimeout(timer);

    let data: any = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => '');
    }

    if (!res.ok) {
      const errorMsg = (data && (data.error || data.message)) || `HTTP error! status: ${res.status}`;
      throw new ApiError(errorMsg, res.status, data);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err?.message || 'Network connectivity error', 500, err);
  }
}
