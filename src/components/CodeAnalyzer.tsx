import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Language, AnalysisResult, RefactorResult } from '../types';
import { 
  Code, ShieldAlert, Bug, Activity, Sparkles, FileCode, CheckCircle, 
  Copy, Check, FileText, Cpu, AlertCircle, Wrench, Play, Terminal
} from 'lucide-react';
import { 
  fetchAIAnalysis, fetchAIExplain, fetchAIRefactor, fetchAITests, fetchAIDocumentation 
} from '../services/api';
import { executeCodeInWorker, ExecutionResult } from '../utils/codeRunner';
import { SkeletonText } from './SkeletonLoader';

interface CodeAnalyzerProps {
  code: string;
  setCode: (code: string) => void;
  language: Language;
  analysis: AnalysisResult | null;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const CodeAnalyzer: React.FC<CodeAnalyzerProps> = ({
  code,
  setCode,
  language,
  analysis,
  onRunAnalysis,
  isAnalyzing,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'complexity' | 'security' | 'bugs' | 'quality' | 'ai-review' | 'refactor' | 'tests' | 'docs' | 'run'>('overview');
  
  // AI Feature States
  const [aiReviewText, setAiReviewText] = useState<string>('');
  const [isAiReviewing, setIsAiReviewing] = useState<boolean>(false);
  
  const [refactorResult, setRefactorResult] = useState<RefactorResult | null>(null);
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false);

  const [testFramework, setTestFramework] = useState<string>('Jest');
  const [generatedTests, setGeneratedTests] = useState<string>('');
  const [isGeneratingTests, setIsGeneratingTests] = useState<boolean>(false);

  const [generatedDocs, setGeneratedDocs] = useState<string>('');
  const [isGeneratingDocs, setIsGeneratingDocs] = useState<boolean>(false);

  // Sandbox Execution States
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAiReview = async () => {
    setIsAiReviewing(true);
    setActiveSubTab('ai-review');
    const res = await fetchAIAnalysis(code, language);
    setAiReviewText(res);
    setIsAiReviewing(false);
  };

  const handleRunRefactor = async () => {
    setIsRefactoring(true);
    setActiveSubTab('refactor');
    try {
      const res = await fetchAIRefactor(code, language);
      setRefactorResult(res);
    } catch (err: any) {
      setRefactorResult({
        originalCode: code,
        refactoredCode: '// Refactoring error or timeout',
        explanation: err.message || 'Failed to refactor.',
        beforeComplexity: 'O(n²)',
        afterComplexity: 'O(n)',
        changesMade: ['Refactoring encountered an issue'],
        tradeoffs: ['None']
      });
    }
    setIsRefactoring(false);
  };

  const handleGenerateTests = async () => {
    setIsGeneratingTests(true);
    setActiveSubTab('tests');
    try {
      const res = await fetchAITests(code, language, testFramework);
      setGeneratedTests(res);
    } catch (err: any) {
      setGeneratedTests('Failed to generate tests: ' + err.message);
    }
    setIsGeneratingTests(false);
  };

  const handleGenerateDocs = async () => {
    setIsGeneratingDocs(true);
    setActiveSubTab('docs');
    try {
      const res = await fetchAIDocumentation(code, language);
      setGeneratedDocs(res);
    } catch (err: any) {
      setGeneratedDocs('Failed to generate docs: ' + err.message);
    }
    setIsGeneratingDocs(false);
  };

  const handleExecuteSnippet = async () => {
    setIsExecuting(true);
    setActiveSubTab('run');
    const res = await executeCodeInWorker(code, 3000);
    setExecutionResult(res);
    setIsExecuting(false);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* Left Pane: Code Editor */}
      <div className="flex-1 flex flex-col border-r border-slate-800 min-h-[350px]">
        <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">Editor — {language.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            {(language === 'javascript' || language === 'typescript') && (
              <button
                onClick={handleExecuteSnippet}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium shadow-sm transition-all"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>{isExecuting ? 'Running...' : 'Run JavaScript Preview'}</span>
              </button>
            )}
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium shadow-sm transition-all"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language === 'c' || language === 'cpp' ? 'cpp' : language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>

      {/* Right Pane: Analysis Results & AI Tools */}
      <div className="w-full lg:w-[540px] flex flex-col bg-slate-900 border-t lg:border-t-0 border-slate-800 flex-shrink-0">
        {/* SubTab Navigation */}
        <div className="flex items-center overflow-x-auto bg-slate-950 border-b border-slate-800 px-2 py-1.5 gap-1 flex-shrink-0">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'complexity', label: 'Complexity', icon: Cpu },
            { id: 'security', label: 'Security', icon: ShieldAlert },
            { id: 'bugs', label: 'Bugs', icon: Bug },
            { id: 'ai-review', label: 'AI Review', icon: Sparkles },
            { id: 'refactor', label: 'Refactor', icon: Wrench },
            { id: 'tests', label: 'Tests', icon: CheckCircle },
            { id: 'docs', label: 'Docs', icon: FileText },
            { id: 'run', label: 'JS Preview', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SubTab Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {isAnalyzing ? (
            <div className="space-y-6 py-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 animate-pulse">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-8 w-16 bg-slate-800 rounded" />
                <div className="h-3 w-48 bg-slate-800/60 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 animate-pulse">
                  <div className="h-3 w-20 bg-slate-800 rounded" />
                  <div className="h-6 w-16 bg-slate-800 rounded" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 animate-pulse">
                  <div className="h-3 w-20 bg-slate-800 rounded" />
                  <div className="h-6 w-16 bg-slate-800 rounded" />
                </div>
              </div>
              <SkeletonText lines={4} />
            </div>
          ) : !analysis && activeSubTab !== 'ai-review' && activeSubTab !== 'refactor' && activeSubTab !== 'tests' && activeSubTab !== 'docs' ? (
            <div className="text-center py-16 space-y-3">
              <Code className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
              <h4 className="text-sm font-semibold text-slate-300">No Analysis Results Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click "Analyze Code" above or run AI review to inspect complexity, security, and quality metrics.
              </p>
              <button
                onClick={onRunAnalysis}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Run Instant Analysis
              </button>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeSubTab === 'overview' && analysis && (
                <div className="space-y-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-400">Health Score</span>
                      <div className="text-3xl font-bold text-white font-mono mt-1">
                        {analysis.healthScore.overall} <span className="text-xs text-emerald-400">/ 100</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{analysis.healthScore.explanation}</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-indigo-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <span className="text-xs text-slate-400 font-medium">Time Complexity</span>
                      <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
                        {analysis.complexity.timeComplexity}
                      </div>
                      <span className="text-[10px] text-slate-500">Confidence: {analysis.complexity.timeConfidence}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <span className="text-xs text-slate-400 font-medium">Space Complexity</span>
                      <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                        {analysis.complexity.spaceComplexity}
                      </div>
                      <span className="text-[10px] text-slate-500">Memory Allocation</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Actions</h5>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleRunAiReview}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/30 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run AI Deep Review</span>
                      </button>
                      <button
                        onClick={handleRunRefactor}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Optimize & Refactor</span>
                      </button>
                      <button
                        onClick={handleGenerateTests}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Generate Tests</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPLEXITY TAB */}
              {activeSubTab === 'complexity' && analysis && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Time Complexity Analysis</h5>
                    <div className="text-2xl font-bold text-indigo-400 font-mono">{analysis.complexity.timeComplexity}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{analysis.complexity.timeReason}</p>
                    <div className="text-[11px] text-slate-400 font-mono">Confidence Level: {analysis.complexity.timeConfidence}</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Space Complexity Analysis</h5>
                    <div className="text-2xl font-bold text-cyan-400 font-mono">{analysis.complexity.spaceComplexity}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{analysis.complexity.spaceReason}</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Detected Patterns</h5>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {analysis.complexity.patternsDetected.map((p, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeSubTab === 'security' && analysis && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Security Vulnerability Audit</h5>
                  {analysis.securityFindings.map((finding) => (
                    <div key={finding.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{finding.issue}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          finding.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          finding.severity === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {finding.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{finding.explanation}</p>
                      <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-indigo-300 font-mono">
                        Recommendation: {finding.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* BUGS TAB */}
              {activeSubTab === 'bugs' && analysis && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Potential Bug Detection</h5>
                  {analysis.bugFindings.map((bug) => (
                    <div key={bug.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{bug.message}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {bug.severity}
                        </span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-cyan-300 font-mono">
                        Suggestion: {bug.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI REVIEW TAB */}
              {activeSubTab === 'ai-review' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Gemini 3.1 Pro Deep Review
                    </h5>
                    <button
                      onClick={handleRunAiReview}
                      disabled={isAiReviewing}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                    >
                      {isAiReviewing ? 'Analyzing...' : 'Re-run AI'}
                    </button>
                  </div>

                  {isAiReviewing ? (
                    <div className="text-center py-16 space-y-3">
                      <Cpu className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">Executing high-thinking reasoning review...</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-mono">
                      {aiReviewText || 'Click "Run AI Deep Review" to generate comprehensive insights.'}
                    </div>
                  )}
                </div>
              )}

              {/* REFACTOR TAB */}
              {activeSubTab === 'refactor' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-400" />
                      AI Refactoring & Optimization
                    </h5>
                    <button
                      onClick={handleRunRefactor}
                      disabled={isRefactoring}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
                    >
                      {isRefactoring ? 'Refactoring...' : 'Optimize Now'}
                    </button>
                  </div>

                  {isRefactoring ? (
                    <div className="text-center py-16 space-y-3">
                      <Cpu className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">Synthesizing optimized code structure...</p>
                    </div>
                  ) : refactorResult ? (
                    <div className="space-y-4">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-rose-400">Before: {refactorResult.beforeComplexity}</span>
                          <span className="text-emerald-400">After: {refactorResult.afterComplexity}</span>
                        </div>
                        <p className="text-xs text-slate-300">{refactorResult.explanation}</p>
                      </div>

                      <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-indigo-300">Optimized Code</span>
                          <button
                            onClick={() => handleCopy(refactorResult.refactoredCode)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="text-xs text-indigo-200 font-mono overflow-x-auto p-2 bg-slate-900 rounded">
                          {refactorResult.refactoredCode}
                        </pre>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setCode(refactorResult.refactoredCode)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow"
                        >
                          Apply Changes to Editor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-500">
                      Click "Optimize Now" to refactor this code and reduce time complexity.
                    </div>
                  )}
                </div>
              )}

              {/* TESTS TAB */}
              {activeSubTab === 'tests' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Unit Test Generator</h5>
                    <button
                      onClick={handleGenerateTests}
                      disabled={isGeneratingTests}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      {isGeneratingTests ? 'Generating...' : 'Generate Tests'}
                    </button>
                  </div>

                  {isGeneratingTests ? (
                    <div className="text-center py-16 space-y-3">
                      <Cpu className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">Writing comprehensive test cases...</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-mono">Framework: {testFramework}</span>
                        <button
                          onClick={() => handleCopy(generatedTests)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-200 rounded text-[11px]"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Tests</span>
                        </button>
                      </div>
                      <pre className="text-xs text-slate-200 font-mono overflow-x-auto p-3 bg-slate-900 rounded">
                        {generatedTests || 'Click "Generate Tests" to create robust unit tests.'}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* DOCS TAB */}
              {activeSubTab === 'docs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Documentation Generator</h5>
                    <button
                      onClick={handleGenerateDocs}
                      disabled={isGeneratingDocs}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                    >
                      {isGeneratingDocs ? 'Generating...' : 'Generate Docs'}
                    </button>
                  </div>

                  {isGeneratingDocs ? (
                    <div className="text-center py-16 space-y-3">
                      <Cpu className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">Synthesizing documentation & docstrings...</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-mono">JSDoc / Docstring</span>
                        <button
                          onClick={() => handleCopy(generatedDocs)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-200 rounded text-[11px]"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Docs</span>
                        </button>
                      </div>
                      <pre className="text-xs text-slate-200 font-mono overflow-x-auto p-3 bg-slate-900 rounded whitespace-pre-wrap">
                        {generatedDocs || 'Click "Generate Docs" to create documentation.'}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* RUN JS PREVIEW TAB */}
              {activeSubTab === 'run' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        Browser-Only JavaScript Preview
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Non-secure client Web Worker execution</p>
                    </div>
                    <button
                      onClick={handleExecuteSnippet}
                      disabled={isExecuting}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      {isExecuting ? 'Running...' : 'Run Preview'}
                    </button>
                  </div>

                  {isExecuting ? (
                    <div className="text-center py-16 space-y-3">
                      <Cpu className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">Executing in secure Web Worker sandbox...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                          <span>Execution Status: <strong className={executionResult?.success ? 'text-emerald-400' : 'text-rose-400'}>{executionResult ? (executionResult.success ? 'Success' : 'Error') : 'Ready'}</strong></span>
                          <span>Time: {executionResult?.executionTimeMs || 0}ms</span>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Console Output (stdout)</span>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {executionResult?.logs && executionResult.logs.length > 0 
                              ? executionResult.logs.join('\n') 
                              : '// No console.log output recorded. Click "Run Snippet" to execute.'}
                          </div>
                        </div>

                        {executionResult?.result !== undefined && (
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Return Value</span>
                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-indigo-300 overflow-x-auto">
                              {executionResult.result}
                            </div>
                          </div>
                        )}

                        {executionResult?.error && (
                          <div>
                            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Runtime Error</span>
                            <div className="bg-rose-950/40 border border-rose-500/30 rounded-lg p-3 font-mono text-xs text-rose-300 overflow-x-auto">
                              {executionResult.error}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
