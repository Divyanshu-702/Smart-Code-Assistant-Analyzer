/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisResult, Language, SecurityFinding, BugFinding, ComplexityAnalysis, CodeHealthScore } from '../types';
import { analyzeCodeWithAST } from './astAnalyzer';

export function runStaticAnalysis(code: string, language: Language, fileName: string, projectName: string): AnalysisResult {
  const lines = code.split('\n');
  const lineCount = lines.length;
  const codeLength = code.length;

  // 1. Complexity Analysis using Babel AST Parser & Visitor Pattern
  const astResult = analyzeCodeWithAST(code, language);

  let timeConfidence: 'High' | 'Medium' | 'Low' = astResult.confidence >= 85 ? 'High' : astResult.confidence >= 70 ? 'Medium' : 'Low';
  let timeReason = astResult.evidence.join('. ') || 'AST complexity calculated.';
  let spaceComplexity = 'O(1)';
  let spaceReason = 'No dynamic memory allocation proportional to input size detected.';
  const patternsDetected: string[] = [];

  if (astResult.maxNestingDepth >= 2) {
    patternsDetected.push('Nested Loops');
  } else if (astResult.loopCount > 0) {
    patternsDetected.push('Linear Loop');
  }
  if (astResult.hasSorting) {
    patternsDetected.push('Sorting Algorithm');
  }
  if (astResult.hasRecursion) {
    patternsDetected.push('Recursion');
  }

  if (/\[\s*\]|new\s+Array|malloc|vector|List|Map|Set/.test(code)) {
    spaceComplexity = 'O(n)';
    spaceReason = 'Data structures or dynamic memory allocations created proportional to input.';
    patternsDetected.push('Dynamic Allocation');
  }

  const complexity: ComplexityAnalysis = {
    timeComplexity: astResult.timeComplexity,
    timeConfidence,
    timeReason,
    spaceComplexity,
    spaceReason,
    patternsDetected,
  };

  // 2. Security Analysis
  const securityFindings: SecurityFinding[] = [];
  
  if (/sk_live_[a-zA-Z0-9]{10,}|apiKey\s*=\s*['"][a-zA-Z0-9_\-]{16,}['"]|password\s*=\s*['"][^'"]+['"]/i.test(code)) {
    securityFindings.push({
      id: 'sec-1',
      severity: 'Critical',
      issue: 'Hardcoded Secret or API Key',
      risk: 'Exposure of sensitive credentials in source code.',
      explanation: 'Hardcoded secrets can be extracted by unauthorized users or repository scanners.',
      recommendation: 'Move credentials to environment variables (e.g., process.env.API_KEY).',
    });
  }

  if (/\beval\s*\(/.test(code)) {
    securityFindings.push({
      id: 'sec-2',
      severity: 'Critical',
      issue: 'Unsafe eval() Execution',
      risk: 'Remote Code Execution (RCE) vulnerability.',
      explanation: 'Using eval() evaluates arbitrary code passed as a string, posing severe security risks.',
      recommendation: 'Avoid eval(). Use safe JSON parsing or deterministic expression parsers.',
    });
  }

  if (/\binnerHTML\b/.test(code)) {
    securityFindings.push({
      id: 'sec-3',
      severity: 'High',
      issue: 'Unsafe innerHTML Assignment',
      risk: 'Cross-Site Scripting (XSS) vulnerability.',
      explanation: 'Assigning untrusted input directly to innerHTML executes injected malicious scripts.',
      recommendation: 'Use textContent or sanitize HTML inputs before rendering.',
    });
  }

  if (/\bstrcpy\s*\(|\bsprintf\s*\(/.test(code)) {
    securityFindings.push({
      id: 'sec-4',
      severity: 'Critical',
      issue: 'Unsafe Buffer Operation',
      risk: 'Buffer Overflow leading to memory corruption or arbitrary code execution.',
      explanation: 'Functions like strcpy do not bounds-check destination buffers.',
      recommendation: 'Use bounded alternatives such as strncpy or snprintf.',
    });
  }

  if (securityFindings.length === 0) {
    securityFindings.push({
      id: 'sec-0',
      severity: 'Informational',
      issue: 'No Critical Vulnerabilities Detected',
      risk: 'None',
      explanation: 'Static AST & pattern scan found no standard hardcoded secrets, unsafe eval, or buffer overflow patterns.',
      recommendation: 'Continue following secure coding best practices.',
    });
  }

  // 3. Bug Detection
  const bugFindings: BugFinding[] = [];

  if (/\.\w+\.\w+/.test(code) && !/\?\.|\bif\b/.test(code)) {
    bugFindings.push({
      id: 'bug-1',
      severity: 'High',
      message: 'Potential null/undefined property dereference risk.',
      suggestion: 'Use optional chaining (?.) or validate object presence before accessing nested properties.',
    });
  }

  if (/while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/.test(code)) {
    bugFindings.push({
      id: 'bug-2',
      severity: 'High',
      message: 'Possible infinite loop detected without explicit break condition.',
      suggestion: 'Ensure loop termination conditions are reachable and bounded.',
    });
  }

  if (!/try\s*\{|\bcatch\b|\bthrows?\b/.test(code) && codeLength > 100) {
    bugFindings.push({
      id: 'bug-3',
      severity: 'Medium',
      message: 'Missing error handling mechanisms (try/catch blocks).',
      suggestion: 'Add try-catch blocks or error propagation to handle runtime exceptions gracefully.',
    });
  }

  if (bugFindings.length === 0) {
    bugFindings.push({
      id: 'bug-0',
      severity: 'Low',
      message: 'No major syntactic or runtime anomaly flags raised.',
      suggestion: 'Code structure appears sound.',
    });
  }

  // 4. Code Quality Notes
  const codeQualityNotes: string[] = [];
  if (lineCount > 50) {
    codeQualityNotes.push('Function or file length is moderately high. Consider modularizing into smaller functions.');
  } else {
    codeQualityNotes.push('Function length is concise and manageable.');
  }
  if (astResult.functionCount > 3) {
    codeQualityNotes.push(`Modular function count: ${astResult.functionCount} functions defined.`);
  }

  const maintainabilityIndex = Math.max(40, Math.min(100, 100 - (lineCount / 4) - (astResult.loopCount * 5)));

  const healthScore: CodeHealthScore = {
    overall: Math.round((maintainabilityIndex + (securityFindings[0]?.severity === 'Critical' ? 50 : 95)) / 2),
    readability: Math.round(maintainabilityIndex),
    maintainability: Math.round(maintainabilityIndex),
    security: securityFindings[0]?.severity === 'Critical' ? 50 : 95,
    performance: astResult.maxNestingDepth >= 2 ? 65 : 90,
    complexityScore: Math.round(maintainabilityIndex),
    explanation: `AST Analysis evaluated ${astResult.functionCount} functions, ${astResult.loopCount} loops, and max nesting depth of ${astResult.maxNestingDepth}.`,
  };

  return {
    id: 'analysis-' + Math.random().toString(36).substring(2, 9),
    projectName,
    fileName,
    language,
    timestamp: new Date().toISOString(),
    codeLength,
    lineCount,
    complexity,
    securityFindings,
    bugFindings,
    codeQualityNotes,
    healthScore,
  };
}
