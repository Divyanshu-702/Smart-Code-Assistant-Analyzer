/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, Language, AnalysisResult, Project } from './types';
import { STARTER_CODES } from './utils/starterCode';
import { runStaticAnalysis } from './utils/staticAnalyzer';
import { saveHistoryEntry, getHistory } from './services/api';
import { validateAnalysisInput, validateProjectInput } from './utils/validation';

import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CodeAnalyzer } from './components/CodeAnalyzer';
import { AIAssistant } from './components/AIAssistant';
import { ProjectsManager } from './components/ProjectsManager';
import { HistoryView } from './components/HistoryView';
import { SecurityView } from './components/SecurityView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { SelfTrainingView } from './components/SelfTrainingView';
import { ArchitectureView } from './components/ArchitectureView';
import { APIKeyModal } from './components/APIKeyModal';
import { CommandPalette } from './components/CommandPalette';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState<string>(STARTER_CODES['javascript']);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isAPIKeyModalOpen, setIsAPIKeyModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [apiKeyErrorStatus, setApiKeyErrorStatus] = useState<number>(401);
  const [apiKeyErrorMessage, setApiKeyErrorMessage] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'proj-1',
      name: 'Default Workspace',
      description: 'Primary project sandbox for CodePilot AI code analysis.',
      files: [{ id: 'f-1', name: 'main.js', language: 'javascript', content: STARTER_CODES['javascript'] }],
      updatedAt: new Date().toISOString(),
    },
  ]);

  // Update starter code when language changes
  useEffect(() => {
    setCode(STARTER_CODES[language] || '// Enter your code here');
  }, [language]);

  // Load history on mount
  useEffect(() => {
    getHistory().then((res) => {
      if (res && res.length > 0) {
        setHistory(res);
        setAnalysis(res[0]);
      } else {
        // Run initial analysis on default code
        const initialResult = runStaticAnalysis(STARTER_CODES['javascript'], 'javascript', 'main.js', 'Default Workspace');
        setAnalysis(initialResult);
        setHistory([initialResult]);
      }
    });
  }, []);

  // Global event listener for 401/403/429 API errors
  useEffect(() => {
    const handleAPIError = (e: CustomEvent<{ status: number; message?: string }>) => {
      const status = e.detail?.status || 401;
      setApiKeyErrorStatus(status);
      setApiKeyErrorMessage(e.detail?.message || 'Gemini API authentication or quota error occurred.');
      setIsAPIKeyModalOpen(true);
    };

    window.addEventListener('api-key-error' as any, handleAPIError as any);
    const handleOpenPalette = () => setIsCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => {
      window.removeEventListener('api-key-error' as any, handleAPIError as any);
      window.removeEventListener('open-command-palette', handleOpenPalette);
    };
  }, []);
  // Global keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (!isMeta) return;

      // Ctrl + Enter: Trigger code analysis
      if (e.key === 'Enter') {
        e.preventDefault();
        setActiveTab('analyzer');
        handleRunAnalysis();
        return;
      }

      // Ctrl + 1 through 9: Switch tabs
      const tabMap: Record<string, ActiveTab> = {
        '1': 'dashboard',
        '2': 'analyzer',
        '3': 'ai-assistant',
        '4': 'self-training',
        '5': 'projects',
        '6': 'history',
        '7': 'security',
        '8': 'reports',
        '9': 'settings',
      };

      if (tabMap[e.key]) {
        e.preventDefault();
        setActiveTab(tabMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language]);

  const handleRunAnalysis = async (retries = 3, delay = 500) => {
    const payload = {
      code,
      language,
      fileName: 'active_snippet.' + (language === 'python' ? 'py' : language === 'java' ? 'java' : 'js'),
      projectName: 'Default Workspace',
    };

    const validation = validateAnalysisInput(payload);
    if (!validation.success) {
      console.error('Validation failed for analysis:', validation.error.format());
      alert('Invalid analysis input.');
      return;
    }

    setIsAnalyzing(true);

    const executeWorkerAttempt = (attempt: number, currentDelay: number) => {
      const worker = new Worker(new URL('./utils/analysisWorker.ts', import.meta.url), { type: 'module' });
      let timeoutId: any = null;

      // Timeout watchdog to detect hangs or memory pressure (e.g. 8s timeout)
      const watchdog = setTimeout(() => {
        worker.terminate();
        if (attempt < retries) {
          console.warn(`Analysis attempt ${attempt} timed out. Retrying in ${currentDelay}ms...`);
          setTimeout(() => executeWorkerAttempt(attempt + 1, currentDelay * 2), currentDelay);
        } else {
          setIsAnalyzing(false);
          if (confirm('Analysis timed out or failed after multiple attempts due to memory/CPU pressure. Would you like to retry now?')) {
            handleRunAnalysis(3, 500);
          }
        }
      }, 8000);

      worker.onmessage = async (e: MessageEvent<{ success: boolean; analysis?: AnalysisResult; error?: string; cached?: boolean }>) => {
        clearTimeout(watchdog);
        worker.terminate();
        if (e.data.success && e.data.analysis) {
          const result: AnalysisResult = e.data.analysis;
          setAnalysis(result);
          setHistory((prev) => [result, ...prev]);
          setIsAnalyzing(false);
          await saveHistoryEntry(result);
        } else {
          if (attempt < retries) {
            setTimeout(() => executeWorkerAttempt(attempt + 1, currentDelay * 2), currentDelay);
          } else {
            setIsAnalyzing(false);
            if (confirm(`Analysis failed: ${e.data.error || 'Unknown error'}. Would you like to retry?`)) {
              handleRunAnalysis(3, 500);
            }
          }
        }
      };

      worker.onerror = (err) => {
        clearTimeout(watchdog);
        worker.terminate();
        if (attempt < retries) {
          setTimeout(() => executeWorkerAttempt(attempt + 1, currentDelay * 2), currentDelay);
        } else {
          setIsAnalyzing(false);
          if (confirm('Analysis worker crashed or encountered a resource limit. Would you like to retry?')) {
            handleRunAnalysis(3, 500);
          }
        }
      };

      worker.postMessage(payload);
    };

    executeWorkerAttempt(1, delay);
  };

  const handleCreateProject = (name: string, description: string) => {
    const validation = validateProjectInput({ name, description });
    if (!validation.success) {
      alert('Invalid project input.');
      return;
    }

    const newProj: Project = {
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      name,
      description,
      files: [{ id: 'f-1', name: 'app.' + (language === 'python' ? 'py' : 'js'), language, content: code }],
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProj, ...prev]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          language={language}
          setLanguage={setLanguage}
          onAnalyze={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
          onQuickRefactor={() => setActiveTab('analyzer')}
          onExportReport={() => setActiveTab('reports')}
        />

        <ErrorBoundary>
          <main className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'dashboard' && (
              <Dashboard latestAnalysis={analysis} historyCount={history.length} setActiveTab={setActiveTab} />
            )}
            {activeTab === 'analyzer' && (
              <CodeAnalyzer
                code={code}
                setCode={setCode}
                language={language}
                analysis={analysis}
                onRunAnalysis={handleRunAnalysis}
                isAnalyzing={isAnalyzing}
              />
            )}
            {activeTab === 'architecture' && (
              <ArchitectureView code={code} language={language} projectName={analysis?.projectName || 'Default Workspace'} />
            )}
            {activeTab === 'ai-assistant' && <AIAssistant currentCode={code} language={language} />}
            {activeTab === 'self-training' && <SelfTrainingView />}
            {activeTab === 'projects' && (
              <ProjectsManager
                projects={projects}
                onSelectProject={(proj) => {
                  if (proj.files[0]) {
                    setCode(proj.files[0].content);
                    setLanguage(proj.files[0].language);
                  }
                  setActiveTab('analyzer');
                }}
                onCreateProject={handleCreateProject}
              />
            )}
            {activeTab === 'history' && (
              <HistoryView
                history={history}
                onSelectHistory={(item) => {
                  setAnalysis(item);
                  setLanguage(item.language);
                }}
                onClearHistory={() => setHistory([])}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === 'security' && <SecurityView latestAnalysis={analysis} />}
            {activeTab === 'reports' && <ReportsView latestAnalysis={analysis} />}
            {activeTab === 'settings' && <SettingsView />}
          </main>
        </ErrorBoundary>

        <APIKeyModal
          isOpen={isAPIKeyModalOpen}
          errorCode={apiKeyErrorStatus}
          errorMessage={apiKeyErrorMessage}
          onClose={() => setIsAPIKeyModalOpen(false)}
          onSaveKey={async (newKey) => {
            try {
              const res = await fetch('/api/config/key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: newKey }),
              });
              const data = await res.json();
              return data.success === true;
            } catch {
              return false;
            }
          }}
        />

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          setActiveTab={setActiveTab}
          onRunAnalysis={() => handleRunAnalysis()}
        />
      </div>
    </div>
  );
}
