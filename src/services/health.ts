/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServiceHealthStatus = 'healthy' | 'degraded' | 'offline';

export interface HealthState {
  status: ServiceHealthStatus;
  latencyMs: number;
  lastChecked: Date | null;
  errorMessage?: string;
}

type HealthListener = (state: HealthState) => void;

class HealthMonitorService {
  private status: ServiceHealthStatus = 'healthy';
  private latencyMs: number = 0;
  private lastChecked: Date | null = null;
  private errorMessage?: string;
  private listeners: Set<HealthListener> = new Set();
  private intervalId: any = null;

  constructor() {
    // Start periodic background check every 30 seconds
    this.startPeriodicCheck(30000);
  }

  public getState(): HealthState {
    return {
      status: this.status,
      latencyMs: this.latencyMs,
      lastChecked: this.lastChecked,
      errorMessage: this.errorMessage,
    };
  }

  public subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    // Emit current state immediately
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public async checkHealth(): Promise<HealthState> {
    const start = performance.now();
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'ping' }),
      });
      const end = performance.now();
      const latency = Math.round(end - start);
      this.latencyMs = latency;
      this.lastChecked = new Date();

      if (res.ok || res.status === 400 || res.status === 401) {
        // 400/401 still means backend & AI service are reachable
        this.status = res.status === 401 ? 'degraded' : 'healthy';
        this.errorMessage = res.status === 401 ? 'API Authentication required' : undefined;
      } else {
        this.status = 'degraded';
        this.errorMessage = `HTTP Error ${res.status}`;
      }
    } catch (err: any) {
      const end = performance.now();
      this.latencyMs = Math.round(end - start);
      this.lastChecked = new Date();
      this.status = 'offline';
      this.errorMessage = err.message || 'Network connection failed';
    }

    this.notify();
    return this.getState();
  }

  public startPeriodicCheck(intervalMs: number) {
    if (this.intervalId) clearInterval(this.intervalId);
    // Check immediately on start
    this.checkHealth();
    this.intervalId = setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const healthService = new HealthMonitorService();
