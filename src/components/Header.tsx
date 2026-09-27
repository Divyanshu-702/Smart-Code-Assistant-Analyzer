/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { Sparkles, Download, Cpu } from 'lucide-react';
import { healthService, HealthState } from '../services/health';
import { AuthStatusBadge } from './AuthBadge';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onQuickRefactor: () => void;
  onExportReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  onQuickRefactor,
  onExportReport,
}) => {
  const [health, setHealth] = useState<HealthState>(healthService.getState());

  useEffect(() => {
    const unsubscribe = healthService.subscribe((state) => {
      setHealth(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const languages: { id: Language; name: string }[] = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'c', name: 'C' },
    { id: 'cpp', name: 'C++' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
    { id: 'json', name: 'JSON' },
  ];

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-medium text-slate-300">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer"
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id} className="bg-slate-900 text-slate-200">
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          {health.status === 'healthy' && (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>API Healthy ({health.latencyMs}ms)</span>
            </span>
          )}
          {health.status === 'degraded' && (
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>API Degraded ({health.latencyMs}ms)</span>
            </span>
          )}
          {health.status === 'offline' && (
            <span className="inline-flex items-center gap-1.5 text-rose-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>API Offline</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onQuickRefactor}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">AI Refactor</span>
        </button>

        <button
          onClick={onExportReport}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Export Report</span>
        </button>

        <AuthStatusBadge />
      </div>
    </header>
  );
};
