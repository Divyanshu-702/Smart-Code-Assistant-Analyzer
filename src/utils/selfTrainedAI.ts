/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SelfTrainedRule {
  id: string;
  pattern: string;
  category: 'security' | 'performance' | 'style' | 'bug';
  suggestion: string;
  confidenceBoost: number;
  hitCount: number;
  lastTrained: string;
}

const STORAGE_KEY = 'codepilot_self_trained_models_v1';

export function getSelfTrainedRules(): SelfTrainedRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults: SelfTrainedRule[] = [
        {
          id: 'rule-1',
          pattern: 'console.log',
          category: 'style',
          suggestion: 'Self-learning heuristic: Production code contains debug logging statements.',
          confidenceBoost: 0.94,
          hitCount: 14,
          lastTrained: new Date().toISOString(),
        },
        {
          id: 'rule-2',
          pattern: 'var ',
          category: 'style',
          suggestion: 'Self-learning heuristic: Legacy var declaration detected. Prefer const or let.',
          confidenceBoost: 0.98,
          hitCount: 29,
          lastTrained: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load self-trained rules:', err);
    return [];
  }
}

export function recordProblemSolvingAttempt(code: string, language: string, success: boolean): SelfTrainedRule[] {
  const rules = getSelfTrainedRules();
  
  // Reinforcement learning simulation: adapt confidence & weights based on problem solving success
  const updated = rules.map(rule => {
    if (code.includes(rule.pattern)) {
      return {
        ...rule,
        hitCount: rule.hitCount + (success ? 1 : 0),
        confidenceBoost: Math.min(0.99, Number((rule.confidenceBoost + (success ? 0.01 : -0.005)).toFixed(3))),
        lastTrained: new Date().toISOString(),
      };
    }
    return rule;
  });

  // If new heuristic pattern detected, evolve new rule
  if (code.length > 50 && Math.random() > 0.6) {
    const newId = 'rule-' + Math.random().toString(36).substring(2, 7);
    updated.push({
      id: newId,
      pattern: language === 'python' ? 'def ' : 'function ',
      category: 'performance',
      suggestion: `Evolved adaptive heuristic for ${language} problem structure.`,
      confidenceBoost: 0.85,
      hitCount: 1,
      lastTrained: new Date().toISOString(),
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save self-trained rules:', err);
  }

  return updated;
}
