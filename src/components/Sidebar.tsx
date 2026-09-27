/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, Code2, Bot, FolderKanban, History, ShieldAlert, FileText, Settings, TerminalSquare, Network } from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyzer' as ActiveTab, label: 'Code Analyzer', icon: Code2 },
    { id: 'architecture' as ActiveTab, label: 'Architecture', icon: Network },
    { id: 'ai-assistant' as ActiveTab, label: 'AI Assistant', icon: Bot },
    { id: 'projects' as ActiveTab, label: 'Projects', icon: FolderKanban },
    { id: 'history' as ActiveTab, label: 'History', icon: History },
    { id: 'security' as ActiveTab, label: 'Security Audit', icon: ShieldAlert },
    { id: 'reports' as ActiveTab, label: 'Reports', icon: FileText },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 select-none">
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <TerminalSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 tracking-wide text-base">CodePilot <span className="text-indigo-400 font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span></h1>
          <p className="text-[11px] text-slate-400 font-mono">v2.5 Enterprise</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">Gemini 3.8 Flash Engine</p>
            <p className="text-[10px] text-slate-400 font-mono">Thinking Level: HIGH</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
