import React from 'react';
import { AnalysisResult } from '../types';
import { FileText, Download, Printer } from 'lucide-react';

interface ReportsViewProps {
  latestAnalysis: AnalysisResult | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ latestAnalysis }) => {
  const generateMarkdownReport = () => {
    if (!latestAnalysis) return 'No analysis available.';
    return `# CodePilot AI Code Analysis Report

**Project:** ${latestAnalysis.projectName}
**File:** ${latestAnalysis.fileName}
**Language:** ${latestAnalysis.language.toUpperCase()}
**Timestamp:** ${new Date(latestAnalysis.timestamp).toLocaleString()}

## Code Health Score: ${latestAnalysis.healthScore.overall}/100
- Readability: ${latestAnalysis.healthScore.readability}%
- Maintainability: ${latestAnalysis.healthScore.maintainability}%
- Performance: ${latestAnalysis.healthScore.performance}%
- Security: ${latestAnalysis.healthScore.security}%

## Complexity Analysis
- **Time Complexity:** ${latestAnalysis.complexity.timeComplexity} (${latestAnalysis.complexity.timeConfidence} confidence)
- **Space Complexity:** ${latestAnalysis.complexity.spaceComplexity}
- **Reason:** ${latestAnalysis.complexity.timeReason}

## Security Findings (${latestAnalysis.securityFindings.length})
${latestAnalysis.securityFindings.map(f => `- **[${f.severity}] ${f.issue}**: ${f.explanation} (Fix: ${f.recommendation})`).join('\n')}

## Potential Bugs (${latestAnalysis.bugFindings.length})
${latestAnalysis.bugFindings.map(b => `- **[${b.severity}]**: ${b.message} (Suggestion: ${b.suggestion})`).join('\n')}
`;
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codepilot-report-${latestAnalysis?.fileName || 'code'}.md`;
    a.click();
  };

  const handleDownloadJSON = () => {
    if (!latestAnalysis) return;
    const json = JSON.stringify(latestAnalysis, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codepilot-report-${latestAnalysis.fileName}.json`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Code Analysis Reports & Export
          </h2>
          <p className="text-slate-400 text-xs mt-1">Export professional technical review reports in JSON, Markdown, or PDF format.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Markdown</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Report Preview (Markdown)</h3>
        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {generateMarkdownReport()}
        </pre>
      </div>
    </div>
  );
};
