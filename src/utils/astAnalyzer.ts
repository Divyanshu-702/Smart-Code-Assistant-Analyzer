/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse } from '@babel/parser';
import * as t from '@babel/types';

export interface ASTAnalysisResult {
  timeComplexity: string;
  confidence: number;
  evidence: string[];
  maxNestingDepth: number;
  hasRecursion: boolean;
  hasSorting: boolean;
  functionCount: number;
  loopCount: number;
}

export function analyzeCodeWithAST(code: string, language: string = 'javascript'): ASTAnalysisResult {
  const evidence: string[] = [];
  let maxNestingDepth = 0;
  let hasRecursion = false;
  let hasSorting = false;
  let functionCount = 0;
  let loopCount = 0;

  const isJSFamily = ['javascript', 'typescript', 'js', 'ts', 'html', 'css'].includes(language.toLowerCase());
  
  if (!isJSFamily) {
    return {
      timeComplexity: code.includes('for') && code.includes('for') ? 'O(n²)' : 'O(n)',
      confidence: 70,
      evidence: ['Heuristic static analysis applied for non-JS language'],
      maxNestingDepth: 1,
      hasRecursion: false,
      hasSorting: code.includes('sort'),
      functionCount: 1,
      loopCount: (code.match(/for|while/g) || []).length,
    };
  }

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'classProperties', 'decorators-legacy'],
    });

    const functionNames = new Set<string>();
    const recursiveCalls = new Set<string>();

    // First pass: collect function names
    const collectFunctions = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (t.isFunctionDeclaration(node) && node.id) {
        functionNames.add(node.id.name);
        functionCount++;
      } else if ((t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) && node.type === 'ArrowFunctionExpression' && (node as any).parent?.type === 'VariableDeclarator' && t.isIdentifier((node as any).parent.id)) {
        functionNames.add((node as any).parent.id.name);
        functionCount++;
      }
      for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c: any) => {
            if (c && typeof c === 'object') {
              c.parent = node;
              collectFunctions(c);
            }
          });
        } else if (child && typeof child === 'object') {
          (child as any).parent = node;
          collectFunctions(child);
        }
      }
    };

    collectFunctions(ast);

    // Second pass: traverse AST to measure nesting, loops, and recursion
    const traverse = (node: any, currentDepth = 0, currentFunctionName: string | null = null) => {
      if (!node || typeof node !== 'object') return;

      let depthIncrement = 0;

      if (t.isFunctionDeclaration(node) && node.id) {
        currentFunctionName = node.id.name;
      }

      // Detect loops
      if (
        t.isForStatement(node) ||
        t.isForInStatement(node) ||
        t.isForOfStatement(node) ||
        t.isWhileStatement(node) ||
        t.isDoWhileStatement(node)
      ) {
        loopCount++;
        depthIncrement = 1;
      }

      // Detect sorting / O(n log n) operations
      if (t.isCallExpression(node) && t.isMemberExpression(node.callee)) {
        const prop = node.callee.property;
        if (t.isIdentifier(prop) && ['sort', 'sorted'].includes(prop.name)) {
          hasSorting = true;
        }
      }

      // Detect recursion
      if (t.isCallExpression(node) && t.isIdentifier(node.callee) && currentFunctionName && node.callee.name === currentFunctionName) {
        hasRecursion = true;
        recursiveCalls.add(currentFunctionName);
      }

      const newDepth = currentDepth + depthIncrement;
      if (newDepth > maxNestingDepth) {
        maxNestingDepth = newDepth;
      }

      for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c: any) => {
            if (c && typeof c === 'object') {
              c.parent = node;
              traverse(c, newDepth, currentFunctionName);
            }
          });
        } else if (child && typeof child === 'object') {
          (child as any).parent = node;
          traverse(child, newDepth, currentFunctionName);
        }
      }
    };

    traverse(ast);

    if (hasSorting) {
      evidence.push('Sorting operation detected (e.g. .sort())');
    }
    if (loopCount > 0) {
      evidence.push(`Found ${loopCount} loop construct(s) with max nesting depth of ${maxNestingDepth}`);
    }
    if (hasRecursion) {
      evidence.push(`Recursive function call(s) detected: ${Array.from(recursiveCalls).join(', ')}`);
    }

    let timeComplexity = 'O(1)';
    let confidence = 92;

    if (maxNestingDepth >= 3) {
      timeComplexity = `O(n^${maxNestingDepth})`;
      evidence.push(`Deeply nested loops (${maxNestingDepth} levels)`);
    } else if (maxNestingDepth === 2) {
      timeComplexity = 'O(n²)';
      evidence.push('Quadratic nested traversal detected');
    } else if (hasSorting) {
      timeComplexity = 'O(n log n)';
    } else if (loopCount > 0 || hasRecursion) {
      timeComplexity = 'O(n)';
      evidence.push('Linear traversal over input collection');
    } else {
      evidence.push('Constant time operations or simple expressions');
    }

    return {
      timeComplexity,
      confidence,
      evidence,
      maxNestingDepth,
      hasRecursion,
      hasSorting,
      functionCount,
      loopCount,
    };
  } catch (err: any) {
    return {
      timeComplexity: 'O(n)',
      confidence: 65,
      evidence: [`AST Parsing warning: ${err.message || 'Syntax parse fallback'}`],
      maxNestingDepth: 1,
      hasRecursion: false,
      hasSorting: code.includes('sort'),
      functionCount: 1,
      loopCount: 1,
    };
  }
}
