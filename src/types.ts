/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'c' | 'cpp' | 'html' | 'css' | 'json';

export type ActiveTab = 'dashboard' | 'analyzer' | 'architecture' | 'ai-assistant' | 'projects' | 'history' | 'security' | 'reports' | 'settings' | 'self-training';

export interface SecurityFinding {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  file?: string;
  line?: number;
  issue: string;
  risk: string;
  explanation: string;
  recommendation: string;
}

export interface BugFinding {
  id: string;
  severity: 'High' | 'Medium' | 'Low';
  line?: number;
  message: string;
  suggestion: string;
}

export interface ComplexityAnalysis {
  timeComplexity: string;
  timeConfidence: 'High' | 'Medium' | 'Low';
  timeReason: string;
  spaceComplexity: string;
  spaceReason: string;
  patternsDetected: string[];
}

export interface CodeHealthScore {
  overall: number;
  readability: number;
  maintainability: number;
  performance: number;
  security: number;
  complexityScore: number;
  explanation: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  projectName: string;
  fileName: string;
  language: Language;
  codeLength: number;
  lineCount: number;
  healthScore: CodeHealthScore;
  complexity: ComplexityAnalysis;
  securityFindings: SecurityFinding[];
  bugFindings: BugFinding[];
  codeQualityNotes: string[];
  aiSummary?: string;
}

export interface RefactorResult {
  originalCode: string;
  refactoredCode: string;
  explanation: string;
  beforeComplexity: string;
  afterComplexity: string;
  changesMade: string[];
  tradeoffs: string[];
}

export interface ProjectFile {
  id: string;
  name: string;
  language: Language;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: ProjectFile[];
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  thinking?: string;
}

export interface AnalysisReport {
  id: string;
  title: string;
  createdAt: string;
  analysis: AnalysisResult;
}
