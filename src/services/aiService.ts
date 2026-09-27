/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AIAPIError extends Error {
  status?: number;
  isAuthError?: boolean;
}

export interface ProxySettings {
  proxyEndpoint: string;
  timeoutMs: number;
  maxRetries: number;
  baseDelayMs: number;
  enableModelFallback: boolean;
}

export const DEFAULT_PROXY_SETTINGS: ProxySettings = {
  proxyEndpoint: '/api/proxy/gemini',
  timeoutMs: 45000,
  maxRetries: 3,
  baseDelayMs: 2000,
  enableModelFallback: true,
};

export function getProxySettings(): ProxySettings {
  if (typeof window === 'undefined') return DEFAULT_PROXY_SETTINGS;
  try {
    const stored = localStorage.getItem('codepilot_proxy_settings');
    if (!stored) return DEFAULT_PROXY_SETTINGS;
    const parsed = JSON.parse(stored);
    return {
      proxyEndpoint: parsed.proxyEndpoint || DEFAULT_PROXY_SETTINGS.proxyEndpoint,
      timeoutMs: Number(parsed.timeoutMs) || DEFAULT_PROXY_SETTINGS.timeoutMs,
      maxRetries: Number(parsed.maxRetries) ?? DEFAULT_PROXY_SETTINGS.maxRetries,
      baseDelayMs: Number(parsed.baseDelayMs) || DEFAULT_PROXY_SETTINGS.baseDelayMs,
      enableModelFallback: parsed.enableModelFallback ?? DEFAULT_PROXY_SETTINGS.enableModelFallback,
    };
  } catch {
    return DEFAULT_PROXY_SETTINGS;
  }
}

export function saveProxySettings(settings: Partial<ProxySettings>): ProxySettings {
  const current = getProxySettings();
  const updated = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    localStorage.setItem('codepilot_proxy_settings', JSON.stringify(updated));
  }
  return updated;
}

/**
 * Parses 'Retry-After' header values (seconds or HTTP Date) and error message retry delays.
 */
export function parseRetryAfter(err: any): number | null {
  // 1. Direct retryAfter field attached from response headers
  const headerVal = err?.retryAfter || err?.headers?.get?.('retry-after');
  if (headerVal) {
    const parsedSec = parseFloat(headerVal);
    if (!isNaN(parsedSec)) {
      return Math.ceil(parsedSec * 1000);
    }
    const dateMs = Date.parse(headerVal);
    if (!isNaN(dateMs)) {
      const diffMs = dateMs - Date.now();
      if (diffMs > 0) return diffMs;
    }
  }

  // 2. Check message string for patterns like "Please retry in 13.77s" or "retryDelay": "13s"
  const message = err?.message || String(err);
  const secondsMatch = message.match(/retry in\s+([0-9.]+)s/i) || message.match(/retryDelay["']?\s*:\s*["']?([0-9.]+)s/i);
  if (secondsMatch && secondsMatch[1]) {
    const sec = parseFloat(secondsMatch[1]);
    if (!isNaN(sec)) {
      return Math.ceil(sec * 1000);
    }
  }

  return null;
}

/**
 * Executes a request with automatic retry and exponential backoff mechanism,
 * specifically detecting 429 Too Many Requests status codes and parsing the 'Retry-After'
 * header (or retry delay payload) to wait the precise required duration before retrying.
 */
export async function withExponentialBackoff<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  maxRetries?: number,
  baseDelayMs?: number,
  timeoutMs?: number
): Promise<T> {
  const settings = getProxySettings();
  const retries = maxRetries ?? settings.maxRetries;
  const backoffDelay = baseDelayMs ?? settings.baseDelayMs;
  const timeout = timeoutMs ?? settings.timeoutMs;

  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      attempt++;

      const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
      const message = isTimeout ? `AI request timed out after ${Math.round(timeout / 1000)}s.` : (err?.message || String(err));
      
      const status = isTimeout ? 408 : (err?.status || err?.statusCode || 
        (message.includes('401') || message.includes('Unauthorized') ? 401 :
         message.includes('403') || message.includes('Forbidden') ? 403 :
         message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED') ? 429 : 500));

      // If status is 429 Too Many Requests and we still have retries left
      if (status === 429 && attempt <= retries) {
        let delay = backoffDelay * Math.pow(2, attempt - 1);
        const parsedRetryMs = parseRetryAfter(err);

        if (parsedRetryMs !== null && parsedRetryMs > 0) {
          // Wait required duration plus a 500ms safety buffer
          delay = Math.max(delay, parsedRetryMs + 500);
        }

        console.warn(`[AI Service] 429 Too Many Requests encountered. Waiting required duration of ${delay}ms before retry attempt ${attempt}/${retries}...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      const finalError: AIAPIError = new Error(message);
      finalError.status = status;
      throw finalError;
    }
  }
}

/**
 * Wraps Gemini API requests with robust error handling, AbortController timeout, and exponential backoff.
 */
export async function handleAIAPIRequest<T>(requestFn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  try {
    return await withExponentialBackoff(requestFn);
  } catch (err: any) {
    console.error('[Gemini AI Service Error]', err);

    const message = err?.message || String(err);
    const status = err?.status || err?.statusCode || 500;

    const apiError: AIAPIError = new Error(message);
    apiError.status = status;

    if (status === 401 || status === 403 || status === 429 || message.includes('API_KEY') || message.includes('Unauthorized') || message.includes('Forbidden') || message.includes('quota')) {
      apiError.isAuthError = true;
      apiError.message = `Gemini API Error (${status}): ${message}`;
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('api-key-error', {
            detail: { status, message },
          })
        );
      }
    } else {
      apiError.isAuthError = false;
      if (typeof window !== 'undefined') {
        console.warn(`[AI Service Warning] Request failed with status ${status}: ${message}`);
      }
    }

    throw apiError;
  }
}

/**
 * Helper to call Gemini AI backend proxy endpoints with standard error wrapping, timeout, and backoff.
 */
export async function callGeminiEndpoint(url: string, payload: any): Promise<any> {
  return handleAIAPIRequest(async (signal) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || res.statusText || 'Unknown server error';
      const error: any = new Error(errorMessage);
      error.status = res.status;
      const retryAfter = res.headers.get('retry-after');
      if (retryAfter) {
        error.retryAfter = retryAfter;
      }
      throw error;
    }

    return await res.json();
  });
}

/**
 * Helper to call the backend Gemini proxy endpoint using configured proxy URL.
 */
export async function proxyGeminiRequest(contents: any, model = 'gemini-3.8-flash', config?: any): Promise<any> {
  const settings = getProxySettings();
  return callGeminiEndpoint(settings.proxyEndpoint, {
    model,
    contents,
    config,
  });
}

/**
 * Sends a chat message with streaming response support using ReadableStream, timeout, and backoff wrapping.
 */
export async function streamAIChatMessage(
  message: string,
  contextCode?: string,
  language?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  return handleAIAPIRequest(async (signal) => {
    const res = await fetch('/api/ai/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, contextCode, language }),
      signal,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error: any = new Error(errorData.error || res.statusText || 'AI Chat stream failed');
      error.status = res.status;
      const retryAfter = res.headers.get('retry-after');
      if (retryAfter) {
        error.retryAfter = retryAfter;
      }
      throw error;
    }

    if (!res.body) {
      const data = await res.json();
      const reply = data.reply || '';
      if (onChunk) onChunk(reply);
      return reply;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      if (onChunk) {
        onChunk(chunk);
      }
    }

    return fullText;
  });
}
