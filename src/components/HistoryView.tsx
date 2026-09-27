import React from 'react';
import { AnalysisResult, ActiveTab } from '../types';
import { History, Calendar, FileCode, ArrowRight, Activity, Trash2 } from 'lucide-react';

interface HistoryViewProps {
  history: AnalysisResult[];
  onSelectHistory: (item: AnalysisResult) => void;
  onClearHistory: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelectHistory, onClearHistory, setActiveTab }) => {
  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            Analysis History & Records
          </h2>
          <p className="text-slate-400 text-xs mt-1">Review past code inspections, health scores, and complexity metrics.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Analysis History Yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Run an analysis in the Code Analyzer to automatically record inspection results.
          </p>
          <button
            onClick={() => setActiveTab('analyzer')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Go to Analyzer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/40 transition-all shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/20">
                    {item.language.toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-white">{item.projectName} / {item.fileName}</span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Health: <strong className="text-white font-mono">{item.healthScore.overall}/100</strong>
                  </span>
                  <span>Time Complexity: <strong className="text-indigo-400 font-mono">{item.complexity.timeComplexity}</strong></span>
                  <span>Security Issues: <strong className="text-rose-400 font-mono">{item.securityFindings.length}</strong></span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectHistory(item);
                  setActiveTab('analyzer');
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm"
              >
                <span>View Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
