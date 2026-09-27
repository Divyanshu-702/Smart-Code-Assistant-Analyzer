import { AnalysisResult, RefactorResult } from '../types';
import { httpClient } from './httpClient';

export async function fetchAIAnalysis(code: string, language: string): Promise<string> {
  try {
    const data = await httpClient<{ success: boolean; analysis?: string; error?: string }>('/api/ai/deep-analyze', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
      timeoutMs: 45000,
    });
    if (data.success && data.analysis) return data.analysis;
    throw new Error(data.error || 'Deep analysis failed');
  } catch (err: any) {
    console.error('Deep AI analysis error:', err);
    return 'AI Deep Analysis unavailable (Check API key or network connection).';
  }
}

export async function fetchAIExplain(code: string, language: string): Promise<string> {
  const data = await httpClient<{ success: boolean; explanation?: string; error?: string }>('/api/ai/explain', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
    timeoutMs: 30000,
  });
  if (data.success && data.explanation) return data.explanation;
  throw new Error(data.error || 'Explanation failed');
}

export async function fetchAIRefactor(code: string, language: string): Promise<RefactorResult> {
  const data = await httpClient<{ success: boolean; result?: RefactorResult; error?: string }>('/api/ai/refactor', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
    timeoutMs: 45000,
  });
  if (data.success && data.result) return data.result;
  throw new Error(data.error || 'Refactoring failed');
}

export async function fetchAITests(code: string, language: string, framework: string): Promise<string> {
  const data = await httpClient<{ success: boolean; tests?: string; error?: string }>('/api/ai/tests', {
    method: 'POST',
    body: JSON.stringify({ code, language, framework }),
    timeoutMs: 45000,
  });
  if (data.success && data.tests) return data.tests;
  throw new Error(data.error || 'Test generation failed');
}

export async function fetchAIDocumentation(code: string, language: string): Promise<string> {
  const data = await httpClient<{ success: boolean; documentation?: string; error?: string }>('/api/ai/document', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
    timeoutMs: 30000,
  });
  if (data.success && data.documentation) return data.documentation;
  throw new Error(data.error || 'Documentation generation failed');
}

export async function sendAIChatMessage(message: string, contextCode?: string, language?: string): Promise<string> {
  const data = await httpClient<{ success: boolean; reply?: string; error?: string }>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, contextCode, language }),
    timeoutMs: 45000,
  });
  if (data.success && data.reply) return data.reply;
  throw new Error(data.error || 'AI chat failed');
}

export async function saveHistoryEntry(entry: AnalysisResult): Promise<void> {
  await httpClient('/api/history', {
    method: 'POST',
    body: JSON.stringify(entry),
    timeoutMs: 10000,
  });
}

export async function getHistory(): Promise<any[]> {
  try {
    const data = await httpClient<{ success: boolean; history?: any[] }>('/api/history', {
      method: 'GET',
      timeoutMs: 10000,
    });
    return data.success && data.history ? data.history : [];
  } catch {
    return [];
  }
}

