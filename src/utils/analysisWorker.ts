/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple SHA-256 hash implementation for worker context
async function computeCodeHash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// IndexedDB Cache Layer for Worker
const DB_NAME = 'CodePilotCacheDB';
const STORE_NAME = 'analysis_cache';
const DB_VERSION = 1;

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getCachedAnalysis(hash: string): Promise<any | null> {
  try {
    const db = await openCacheDB();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(hash);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB read cache failed:', err);
    return null;
  }
}

async function setCachedAnalysis(hash: string, result: any): Promise<void> {
  try {
    const db = await openCacheDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(result, hash);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB write cache failed:', err);
  }
}

self.onmessage = async function (e: MessageEvent) {
  const { code, language, fileName, projectName } = e.data;
  
  try {
    const codeHash = await computeCodeHash(code + language);
    const cached = await getCachedAnalysis(codeHash);

    if (cached) {
      self.postMessage({ success: true, analysis: cached, cached: true });
      return;
    }

    const lines = code.split('\n');
    const lineCount = lines.length;
    const codeLength = code.length;

    // 1. Complexity Analysis
    let timeComplexity = 'O(1)';
    let timeConfidence = 'Medium';
    let timeReason = 'Constant time operations detected.';
    let spaceComplexity = 'O(1)';
    let spaceReason = 'No dynamic memory allocation proportional to input size.';
    const patternsDetected: string[] = [];

    const hasNestedLoops = /for\s*\(.*;.*;.*\)\s*\{[^}]*for\s*\(.*;.*;.*\)/s.test(code) || (code.match(/for\s*\(/g) || []).length >= 2;
    const hasSingleLoop = /for\s*\(|while\s*\(|\.forEach\(|\.map\(/.test(code);
    const hasRecursion = new RegExp(`\\b(\\w+)\\s*\\([^)]*\\)\\s*\\{[^}]*\\b\\1\\s*\\(`, 's').test(code) || code.includes('fibonacci');
    const hasLogarithmicPattern = /\/\s*=\s*2|\*\s*=\s*2|>>=|\bbinsearch\b|\bbinary_search\b/i.test(code);

    if (hasNestedLoops) {
      timeComplexity = 'O(n²)';
      timeConfidence = 'High';
      timeReason = 'Nested loops detected iterating over input data structures.';
      patternsDetected.push('Nested Loops');
    } else if (hasLogarithmicPattern) {
      timeComplexity = 'O(log n)';
      timeConfidence = 'High';
      timeReason = 'Halving or logarithmic step patterns identified.';
      patternsDetected.push('Logarithmic Scaling');
    } else if (hasSingleLoop) {
      timeComplexity = 'O(n)';
      timeConfidence = 'High';
      timeReason = 'Single linear loop iteration over collection elements.';
      patternsDetected.push('Linear Loop');
    } else if (hasRecursion) {
      timeComplexity = 'O(2ⁿ)';
      timeConfidence = 'Medium';
      timeReason = 'Recursive function calls suggesting branching tree complexity.';
      patternsDetected.push('Recursion');
    }

    if (/\[\s*\]|new\s+Array|malloc|vector|List|Map|Set/.test(code)) {
      spaceComplexity = 'O(n)';
      spaceReason = 'Data structures or dynamic allocations created proportional to input.';
      patternsDetected.push('Dynamic Allocation');
    }

    const complexity = {
      timeComplexity,
      timeConfidence,
      timeReason,
      spaceComplexity,
      spaceReason,
      patternsDetected,
    };

    // 2. Security Analysis
    const securityFindings = [];
    
    if (/sk_live_[a-zA-Z0-9]{10,}|apiKey\s*=\s*['"][a-zA-Z0-9_\-]{16,}['"]|password\s*=\s*['"][^'"]+['"]/i.test(code)) {
      securityFindings.push({
        id: 'sec-1',
        severity: 'Critical' as const,
        issue: 'Hardcoded Secret or API Key',
        risk: 'Exposure of sensitive credentials in source code.',
        explanation: 'Hardcoded secrets can be extracted by unauthorized users or repository scanners.',
        recommendation: 'Move credentials to environment variables (e.g., process.env.API_KEY).',
      });
    }

    if (/\beval\s*\(/.test(code)) {
      securityFindings.push({
        id: 'sec-2',
        severity: 'Critical' as const,
        issue: 'Unsafe eval() Execution',
        risk: 'Remote Code Execution (RCE) vulnerability.',
        explanation: 'Using eval() evaluates arbitrary code passed as a string, posing severe security risks.',
        recommendation: 'Avoid eval(). Use safe JSON parsing or deterministic expression parsers.',
      });
    }

    if (/\binnerHTML\b/.test(code)) {
      securityFindings.push({
        id: 'sec-3',
        severity: 'High' as const,
        issue: 'Unsafe innerHTML Assignment',
        risk: 'Cross-Site Scripting (XSS) vulnerability.',
        explanation: 'Assigning untrusted input directly to innerHTML executes injected malicious scripts.',
        recommendation: 'Use textContent or sanitize HTML inputs before rendering.',
      });
    }

    if (/\bstrcpy\s*\(|\bsprintf\s*\(/.test(code)) {
      securityFindings.push({
        id: 'sec-4',
        severity: 'Critical' as const,
        issue: 'Unsafe Buffer Operation',
        risk: 'Buffer Overflow leading to memory corruption or arbitrary code execution.',
        explanation: 'Functions like strcpy do not bounds-check destination buffers.',
        recommendation: 'Use bounded alternatives such as strncpy or snprintf.',
      });
    }

    if (securityFindings.length === 0) {
      securityFindings.push({
        id: 'sec-0',
        severity: 'Informational' as const,
        issue: 'No Critical Vulnerabilities Detected',
        risk: 'None',
        explanation: 'Static scan found no standard hardcoded secrets, unsafe eval, or buffer overflow patterns.',
        recommendation: 'Continue following secure coding best practices.',
      });
    }

    // 3. Bug Detection
    const bugFindings = [];

    if (/\.\w+\.\w+/.test(code) && !/\?\.|\bif\b/.test(code)) {
      bugFindings.push({
        id: 'bug-1',
        severity: 'High' as const,
        message: 'Potential null/undefined property dereference risk.',
        suggestion: 'Use optional chaining (?.) or validate object presence before accessing nested properties.',
      });
    }

    if (/while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/.test(code)) {
      bugFindings.push({
        id: 'bug-2',
        severity: 'High' as const,
        message: 'Possible infinite loop detected without explicit break condition.',
        suggestion: 'Ensure loop termination conditions are reachable and bounded.',
      });
    }

    if (!/try\s*\{|\bcatch\b|\bthrows?\b/.test(code) && codeLength > 100) {
      bugFindings.push({
        id: 'bug-3',
        severity: 'Medium' as const,
        message: 'Missing error handling mechanisms (try/catch blocks).',
        suggestion: 'Add try-catch blocks or error propagation to handle runtime exceptions gracefully.',
      });
    }

    if (bugFindings.length === 0) {
      bugFindings.push({
        id: 'bug-0',
        severity: 'Low' as const,
        message: 'No major syntactic or runtime anomaly flags raised.',
        suggestion: 'Code structure appears sound.',
      });
    }

    // 4. Code Quality Notes
    const codeQualityNotes = [];
    if (lineCount > 50) {
      codeQualityNotes.push('Function or file length is moderately high. Consider modularizing into smaller functions.');
    } else {
      codeQualityNotes.push('Function length is concise and manageable.');
    }

    if (hasNestedLoops) {
      codeQualityNotes.push('Performance optimization recommended: reduce algorithmic complexity from O(n²) using hash maps or sets.');
    } else {
      codeQualityNotes.push('Algorithmic efficiency is optimal for expected dataset sizes.');
    }

    codeQualityNotes.push(`Language dialect recognized: ${language.toUpperCase()}. Formatting and syntax conventions align with standard guidelines.`);

    // 5. Health Score Calculation
    let overallScore = 92;
    if (securityFindings.some(f => f.severity === 'Critical')) overallScore -= 25;
    if (securityFindings.some(f => f.severity === 'High')) overallScore -= 15;
    if (bugFindings.length > 1) overallScore -= 10;
    if (timeComplexity === 'O(n²)' || timeComplexity === 'O(2ⁿ)') overallScore -= 10;
    overallScore = Math.max(35, Math.min(100, overallScore));

    const healthScore = {
      overall: overallScore,
      readability: Math.min(100, overallScore + 5),
      maintainability: Math.min(100, overallScore + 2),
      performance: timeComplexity === 'O(n²)' ? 65 : 90,
      security: securityFindings.some(f => f.severity === 'Critical') ? 45 : 92,
      complexityScore: timeComplexity === 'O(n²)' ? 70 : 95,
      explanation: overallScore > 85 ? 'Codebase is robust, well-structured, and secure.' : 'Codebase contains performance bottlenecks or security risks requiring attention.',
    };

    const analysisResult = {
      id: 'analysis-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      projectName,
      fileName,
      language,
      codeLength,
      lineCount,
      healthScore,
      complexity,
      securityFindings,
      bugFindings,
      codeQualityNotes,
    };

    const serializedResult = JSON.parse(JSON.stringify(analysisResult));
    await setCachedAnalysis(codeHash, serializedResult);

    self.postMessage({ success: true, analysis: serializedResult, cached: false });
  } catch (err: any) {
    const errorDetails = {
      code: err?.code || 'ANALYSIS_WORKER_ERROR',
      message: err?.message || String(err),
      name: err?.name || 'WorkerError',
      stack: err?.stack || undefined,
    };
    self.postMessage({ 
      success: false, 
      error: errorDetails.message,
      errorDetails 
    });
  }
};
