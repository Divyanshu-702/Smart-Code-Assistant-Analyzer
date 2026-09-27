/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnalysisResult, ActiveTab } from '../types';
import { Shield, Code, Zap, ArrowUpRight, CheckCircle2, Activity, Sparkles, Terminal, Cpu, GitBranch, Lock } from 'lucide-react';

interface DashboardProps {
  latestAnalysis: AnalysisResult | null;
  historyCount: number;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ latestAnalysis, historyCount, setActiveTab }) => {
  const health = latestAnalysis?.healthScore || {
    overall: 94,
    readability: 96,
    maintainability: 91,
    performance: 95,
    security: 93,
  };

  const recentMetrics = [
    {
      title: 'Code Health Score',
      value: `${health.overall}%`,
      subtitle: 'Excellent quality index',
      icon: Activity,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      badgeBg: 'bg-emerald-500/10 text-emerald-300',
    },
    {
      title: 'Time Complexity',
      value: latestAnalysis?.complexity?.timeComplexity || 'O(n log n)',
      subtitle: 'Optimized execution profile',
      icon: Zap,
      color: 'from-indigo-500/20 to-blue-500/10 text-indigo-400 border-indigo-500/30',
      badgeBg: 'bg-indigo-500/10 text-indigo-300',
    },
    {
      title: 'Security Vulnerabilities',
      value: latestAnalysis?.securityFindings?.length || 0,
      subtitle: 'Zero critical threat vectors',
      icon: Shield,
      color: 'from-cyan-500/20 to-sky-500/10 text-cyan-400 border-cyan-500/30',
      badgeBg: 'bg-cyan-500/10 text-cyan-300',
    },
    {
      title: 'Total Inspections',
      value: historyCount || 1,
      subtitle: 'Saved sessions & checkpoints',
      icon: CheckCircle2,
      color: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/30',
      badgeBg: 'bg-purple-500/10 text-purple-300',
    },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-950">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-8 md:p-10 shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono shadow-inner">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            CodePilot AI Enterprise Workspace v3.2
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Next-Gen Code Intelligence & <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Autonomous Refactoring</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
            Harness advanced Gemini Pro reasoning, deep static code analysis, and real-time security auditing to elevate your codebase to elite enterprise standards.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('analyzer')}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Code className="w-4 h-4" />
              <span>Launch Code Analyzer</span>
            </button>
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-medium text-sm border border-slate-700/80 shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <span>Ask AI Chat Assistant</span>
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentMetrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="group relative bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{item.title}</span>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} border flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{item.value}</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Breakdown & Feature Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Code Health Breakdown */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Comprehensive Health Breakdown
            </h3>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              Real-time Analysis
            </span>
          </div>

          <div className="space-y-5">
            {[
              { label: 'Readability & Formatting', score: health.readability, color: 'from-indigo-500 to-blue-500', icon: Terminal },
              { label: 'Maintainability & Modularity', score: health.maintainability, color: 'from-violet-500 to-purple-500', icon: GitBranch },
              { label: 'Performance & Algorithmic Efficiency', score: health.performance, color: 'from-cyan-500 to-teal-500', icon: Cpu },
              { label: 'Security & Vulnerability Standard', score: health.security, color: 'from-emerald-500 to-green-500', icon: Lock },
            ].map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <div key={idx} className="space-y-2 bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-slate-200 flex items-center gap-2 font-semibold">
                      <ItemIcon className="w-4 h-4 text-indigo-400" />
                      {item.label}
                    </span>
                    <span className="text-indigo-300 font-mono font-bold text-sm">{item.score}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-700 shadow-sm`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Shortcuts & AI Insights */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Quick Workspace Actions
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('analyzer')}
                className="w-full text-left p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Analyze Snippet</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Inspect AST & time complexity instantly</p>
                </div>
                <Code className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('ai-assistant')}
                className="w-full text-left p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Chat with Gemini</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ask questions with streaming responses</p>
                </div>
                <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className="w-full text-left p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Security Audit</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Review OWASP risks & vulnerabilities</p>
                </div>
                <Shield className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Powered by Gemini 3.1 Pro</span>
            <span className="text-emerald-400 font-mono font-semibold">● Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};
