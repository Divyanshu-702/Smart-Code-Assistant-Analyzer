/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab } from '../types';
import { 
  Search, Command, LayoutDashboard, Code, Bot, FolderKanban, 
  History, ShieldAlert, FileText, Settings, Sparkles, Terminal, X 
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onRunAnalysis: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onRunAnalysis,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open command palette
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      run: () => setActiveTab('dashboard'),
    },
    {
      id: 'analyzer',
      label: 'Open Code Analyzer',
      category: 'Navigation',
      icon: Code,
      run: () => setActiveTab('analyzer'),
    },
    {
      id: 'ai-assistant',
      label: 'Open AI Chat Assistant',
      category: 'Navigation',
      icon: Bot,
      run: () => setActiveTab('ai-assistant'),
    },
    {
      id: 'projects',
      label: 'Manage Projects',
      category: 'Navigation',
      icon: FolderKanban,
      run: () => setActiveTab('projects'),
    },
    {
      id: 'history',
      label: 'View Analysis History',
      category: 'Navigation',
      icon: History,
      run: () => setActiveTab('history'),
    },
    {
      id: 'security',
      label: 'Open Security Audit',
      category: 'Navigation',
      icon: ShieldAlert,
      run: () => setActiveTab('security'),
    },
    {
      id: 'reports',
      label: 'Export Reports',
      category: 'Navigation',
      icon: FileText,
      run: () => setActiveTab('reports'),
    },
    {
      id: 'settings',
      label: 'Open Settings',
      category: 'Navigation',
      icon: Settings,
      run: () => setActiveTab('settings'),
    },
    {
      id: 'run-analysis',
      label: 'Trigger Code Analysis (AST & Complexity)',
      category: 'Actions',
      icon: Sparkles,
      run: () => {
        setActiveTab('analyzer');
        onRunAnalysis();
      },
    },
  ];

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase()) ||
    action.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden neon-border">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3 bg-slate-950/50">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            placeholder="Type a command or search features (e.g. 'Analyze', 'Security')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-mono">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.run();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-indigo-600/20 text-slate-300 hover:text-white transition-all group border border-transparent hover:border-indigo-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-indigo-600/30 border border-slate-700 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                    </div>
                    <span className="text-xs font-semibold">{action.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-300 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {action.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Esc</kbd> Close</span>
          </div>
          <span className="text-indigo-400 flex items-center gap-1">
            <Command className="w-3 h-3" /> Ctrl+K
          </span>
        </div>
      </div>
    </div>
  );
};
