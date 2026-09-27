/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse } from '@babel/parser';
import * as t from '@babel/types';

export interface GraphNode {
  id: string;
  name: string;
  type: 'function' | 'class' | 'service' | 'api' | 'database';
  calls: string[];
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function parseDependencyGraph(code: string, language: string = 'javascript'): DependencyGraphData {
  const nodesMap = new Map<string, GraphNode>();
  const linksSet = new Set<string>();

  const addNode = (id: string, name: string, type: GraphNode['type']) => {
    if (!nodesMap.has(id)) {
      nodesMap.set(id, { id, name, type, calls: [] });
    }
  };

  const addLink = (source: string, target: string) => {
    if (source !== target) {
      linksSet.add(`${source}-->${target}`);
    }
  };

  // Add default core architectural nodes
  addNode('app', 'App Component', 'class');
  addNode('auth', 'AuthService', 'service');
  addNode('db', 'Firestore Database', 'database');
  addNode('api', 'Gemini AI API', 'api');

  addLink('app', 'auth');
  addLink('auth', 'db');
  addLink('app', 'api');

  const isJSFamily = ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].includes(language.toLowerCase());
  
  if (isJSFamily) {
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'classProperties', 'decorators-legacy'],
      });

      let currentFunc: string | null = null;

      const visit = (node: any) => {
        if (!node || typeof node !== 'object') return;

        if (t.isFunctionDeclaration(node) && node.id) {
          const name = node.id.name;
          addNode(name, name, 'function');
          currentFunc = name;
          addLink('app', name);
        } else if (t.isClassDeclaration(node) && node.id) {
          const name = node.id.name;
          addNode(name, name, 'class');
          currentFunc = name;
          addLink('app', name);
        } else if (t.isCallExpression(node) && t.isIdentifier(node.callee) && currentFunc) {
          const calleeName = node.callee.name;
          addNode(calleeName, calleeName, calleeName.toLowerCase().includes('fetch') || calleeName.toLowerCase().includes('api') ? 'api' : 'function');
          addLink(currentFunc, calleeName);
        }

        for (const key of Object.keys(node)) {
          if (key === 'parent') continue;
          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach((c) => visit(c));
          } else if (child && typeof child === 'object') {
            visit(child);
          }
        }

        if (t.isFunctionDeclaration(node) || t.isClassDeclaration(node)) {
          currentFunc = null;
        }
      };

      visit(ast);
    } catch {
      // Fallback regex parsing
    }
  }

  // Regex fallback / extraction for any language
  const funcMatches = code.match(/(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g) || [];
  funcMatches.forEach(m => {
    const nameMatch = m.match(/([a-zA-Z0-9_]+)/g);
    if (nameMatch && nameMatch.length > 1) {
      const name = nameMatch[1] === 'function' ? nameMatch[2] : nameMatch[1];
      if (name) {
        addNode(name, name, 'function');
        addLink('app', name);
      }
    }
  });

  if (code.includes('fetch') || code.includes('axios') || code.includes('ai.models')) {
    addLink('app', 'api');
  }
  if (code.includes('db') || code.includes('firestore') || code.includes('SQL')) {
    addLink('app', 'db');
  }

  const nodes = Array.from(nodesMap.values());
  const links = Array.from(linksSet).map(l => {
    const [source, target] = l.split('-->');
    return { source, target };
  });

  return { nodes, links };
}
