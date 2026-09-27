/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  Shield, 
  CheckCircle, 
  Server, 
  Key, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  Sliders, 
  Zap,
  Activity,
  Save
} from 'lucide-react';
import { getProxySettings, saveProxySettings, ProxySettings } from '../services/aiService';

export const SettingsView: React.FC = () => {
  const [proxySettings, setProxySettings] = useState<ProxySettings>(getProxySettings());
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ testing: boolean; success?: boolean; latencyMs?: number; message?: string } | null>(null);

  useEffect(() => {
    setProxySettings(getProxySettings());
  }, []);

  const handleSaveProxySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Save local proxy settings
      saveProxySettings(proxySettings);

      // 2. If an API Key was provided, push to server config endpoint
      if (apiKey.trim()) {
        const res = await fetch('/api/config/key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: apiKey.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update server API key');
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error saving proxy settings: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestProxyConnection = async () => {
    setPingStatus({ testing: true });
    const startTime = performance.now();

    try {
      const res = await fetch('/api/health');
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      if (res.ok) {
        setPingStatus({
          testing: false,
          success: true,
          latencyMs,
          message: 'Backend AI Proxy is active and responding smoothly.',
        });
      } else {
        setPingStatus({
          testing: false,
          success: false,
          latencyMs,
          message: `Proxy returned status code ${res.status}.`,
        });
      }
    } catch (err: any) {
      setPingStatus({
        testing: false,
        success: false,
        message: err?.message || 'Failed to connect to AI Proxy gateway.',
      });
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-950 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          Platform & Proxy Settings
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Configure server-side proxy routes, rate-limit backoff rules, API key authentication, and static security analysis parameters.
        </p>
      </div>

      <form onSubmit={handleSaveProxySettings} className="space-y-8">
        {/* Backend Proxy Settings Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Proxy Gateway Configuration</h3>
                <p className="text-slate-400 text-[11px]">Manage backend proxy routes, rate limits, and request timeouts</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestProxyConnection}
              disabled={pingStatus?.testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            >
              <Activity className={`w-3.5 h-3.5 text-indigo-400 ${pingStatus?.testing ? 'animate-spin' : ''}`} />
              <span>{pingStatus?.testing ? 'Testing Proxy...' : 'Ping Proxy Health'}</span>
            </button>
          </div>

          {pingStatus && !pingStatus.testing && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
                pingStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {pingStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span>{pingStatus.message}</span>
              </div>
              {pingStatus.latencyMs !== undefined && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/30 border border-white/10">
                  {pingStatus.latencyMs}ms
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proxy Service Endpoint
              </label>
              <input
                type="text"
                value={proxySettings.proxyEndpoint}
                onChange={(e) => setProxySettings({ ...proxySettings, proxyEndpoint: e.target.value })}
                placeholder="/api/proxy/gemini"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 transition-all"
              />
              <p className="text-[10px] text-slate-500 mt-1">Internal server proxy route that secures API keys from client exposure.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Request Timeout (Seconds)</span>
                <span className="font-mono text-indigo-400">{Math.round(proxySettings.timeoutMs / 1000)}s</span>
              </label>
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={Math.round(proxySettings.timeoutMs / 1000)}
                onChange={(e) => setProxySettings({ ...proxySettings, timeoutMs: Number(e.target.value) * 1000 })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1">AbortController timeout ceiling to avoid hung streaming HTTP requests.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Max 429 Rate Limit Retries
              </label>
              <select
                value={proxySettings.maxRetries}
                onChange={(e) => setProxySettings({ ...proxySettings, maxRetries: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value={0}>0 (No Retries)</option>
                <option value={1}>1 Retry</option>
                <option value={2}>2 Retries</option>
                <option value={3}>3 Retries (Recommended)</option>
                <option value={5}>5 Retries</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Automatic retry attempts for 429 Too Many Requests status codes.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Base Backoff Delay
              </label>
              <select
                value={proxySettings.baseDelayMs}
                onChange={(e) => setProxySettings({ ...proxySettings, baseDelayMs: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value={1000}>1000 ms (1s)</option>
                <option value={2000}>2000 ms (2s - Default)</option>
                <option value={3000}>3000 ms (3s)</option>
                <option value={5000}>5000 ms (5s)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Initial exponential delay before retrying quota-limited requests.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="modelFallbackToggle"
                checked={proxySettings.enableModelFallback}
                onChange={(e) => setProxySettings({ ...proxySettings, enableModelFallback: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="modelFallbackToggle" className="text-xs text-slate-200 cursor-pointer select-none">
                <span className="font-semibold block">Automatic Model Tier Fallback</span>
                <span className="text-slate-400 text-[11px] block">
                  Automatically try alternative model tiers (gemini-3.8-flash → gemini-3.5-flash → gemini-2.5-flash) if quota limits are exceeded.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Server API Key Management Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Server Proxy API Key Authorization</h3>
              <p className="text-slate-400 text-[11px]">Update the Gemini API Key passed through the proxy service</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Update Server API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter new Gemini API key (e.g. AIzaSy...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Key is saved directly in environment state on the backend server.
            </p>
          </div>
        </div>

        {/* Save Button & Feedback */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium animate-fadeIn">
              <CheckCircle className="w-4 h-4" />
              <span>Proxy settings updated successfully!</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">
              Changes take effect immediately across all AI analysis and streaming chat calls.
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Proxy Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
