import React from 'react';
import { AnalysisResult } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface SecurityViewProps {
  latestAnalysis: AnalysisResult | null;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ latestAnalysis }) => {
  const findings = latestAnalysis?.securityFindings || [];

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            Security Audit & Vulnerability Scanner
          </h2>
          <p className="text-slate-400 text-xs mt-1">Autonomous static security inspection for hardcoded secrets, injection risks, and unsafe constructs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <span className="text-xs font-medium text-slate-400">Total Audit Findings</span>
          <div className="text-3xl font-bold text-white font-mono mt-2">{findings.length}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <span className="text-xs font-medium text-slate-400">Critical Vulnerabilities</span>
          <div className="text-3xl font-bold text-rose-400 font-mono mt-2">
            {findings.filter(f => f.severity === 'Critical').length}
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <span className="text-xs font-medium text-slate-400">Security Score</span>
          <div className="text-3xl font-bold text-emerald-400 font-mono mt-2">
            {latestAnalysis?.healthScore?.security || 90}%
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">Detected Security Findings</h3>
        {findings.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No Security Vulnerabilities</h4>
            <p className="text-xs text-slate-400">Your inspected codebase passed all static security audits.</p>
          </div>
        ) : (
          findings.map((f) => (
            <div key={f.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${f.severity === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`} />
                  <h4 className="text-base font-bold text-white">{f.issue}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                  f.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  f.severity === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {f.severity}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{f.explanation}</p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-indigo-300 font-mono">
                <strong>Recommended Fix:</strong> {f.recommendation}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
