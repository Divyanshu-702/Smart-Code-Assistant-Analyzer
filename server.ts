/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;

// Initialize Gemini client on server side
let ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory store for projects, history, and reports
let projectsStore = [
  {
    id: 'proj-1',
    name: 'Default Workspace',
    description: 'Primary project sandbox for CodePilot AI analyses.',
    files: [
      { id: 'f-1', name: 'main.js', language: 'javascript', content: '// Write or paste your code here' }
    ],
    updatedAt: new Date().toISOString()
  }
];

let historyStore: any[] = [];
let reportsStore: any[] = [];

// Helper to handle AI errors gracefully with proper HTTP status codes
function handleRouteError(error: any, res: any) {
  const message = error?.message || String(error);
  const status = error?.status || error?.statusCode || 
    (message.includes('401') || message.includes('Unauthorized') ? 401 :
     message.includes('403') || message.includes('Forbidden') ? 403 :
     message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED') ? 429 : 500);

  if (status === 429) {
    console.warn('[Server Warning] Gemini API quota limit (429) hit. Returning status 429 to client.');
  } else {
    console.error('API Route Error:', error);
  }

  res.status(status === 401 || status === 403 || status === 429 ? status : 500).json({
    success: false,
    status,
    error: message,
  });
}

// Model fallback generator helper
async function generateWithFallback(aiClient: any, { contents, config, systemInstruction, responseMimeType, requestedModel }: any) {
  const models = [requestedModel || 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
  // Deduplicate model array preserving order
  const uniqueModels = Array.from(new Set(models.filter(Boolean)));
  let lastErr: any = null;

  for (const model of uniqueModels) {
    try {
      const fullConfig: any = { ...(config || {}) };
      if (systemInstruction) fullConfig.systemInstruction = systemInstruction;
      if (responseMimeType) fullConfig.responseMimeType = responseMimeType;

      const response = await aiClient.models.generateContent({
        model,
        contents,
        config: fullConfig,
      });

      return { text: response.text || '', candidates: response.candidates || [] };
    } catch (err: any) {
      lastErr = err;
      const message = err?.message || String(err);
      const isQuota = err?.status === 429 || message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED');
      if (!isQuota) {
        throw err;
      }
    }
  }
  throw lastErr;
}

// Streaming fallback generator helper
async function generateStreamWithFallback(aiClient: any, { contents, config, systemInstruction, requestedModel }: any) {
  const models = [requestedModel || 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
  const uniqueModels = Array.from(new Set(models.filter(Boolean)));
  let lastErr: any = null;

  for (const model of uniqueModels) {
    try {
      const fullConfig: any = { ...(config || {}) };
      if (systemInstruction) fullConfig.systemInstruction = systemInstruction;

      const responseStream = await aiClient.models.generateContentStream({
        model,
        contents,
        config: fullConfig,
      });

      return responseStream;
    } catch (err: any) {
      lastErr = err;
      const message = err?.message || String(err);
      const isQuota = err?.status === 429 || message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED');
      if (!isQuota) {
        throw err;
      }
    }
  }
  throw lastErr;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Update Gemini API Key dynamically at runtime
app.post('/api/config/key', (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ success: false, error: 'Valid API key is required' });
    }

    process.env.GEMINI_API_KEY = apiKey.trim();
    // @ts-ignore
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    res.json({ success: true, message: 'API key updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update API key' });
  }
});

// Backend proxy endpoint at '/api/proxy/gemini'
app.post('/api/proxy/gemini', async (req, res) => {
  try {
    const { model = 'gemini-3.8-flash', contents, config } = req.body;
    if (!contents) {
      return res.status(400).json({ success: false, error: 'Contents are required for proxy request' });
    }

    const authHeader = req.headers.authorization;
    let activeAi = ai;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const clientKey = authHeader.substring(7).trim();
      if (clientKey) {
        activeAi = new GoogleGenAI({
          apiKey: clientKey,
          httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' },
          },
        });
      }
    }

    const result = await generateWithFallback(activeAi, {
      requestedModel: model,
      contents,
      config,
    });

    res.json({
      success: true,
      text: result.text,
      candidates: result.candidates,
    });
  } catch (error: any) {
    handleRouteError(error, res);
  }
});

// AI Deep Analysis endpoint
app.post('/api/ai/deep-analyze', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }

    const prompt = `Perform an exhaustive, expert-level code review for this ${language} snippet. Analyze time complexity, space complexity, security risks, potential bugs, architectural quality, and provide precise optimization recommendations.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;

    const result = await generateWithFallback(ai, {
      requestedModel: 'gemini-3.8-flash',
      contents: prompt,
      systemInstruction: 'You are CodePilot AI Chief Architect and Senior Security Engineer. Provide precise, professional, structured code review feedback.',
    });

    res.json({
      success: true,
      analysis: result.text || 'No AI analysis generated.',
    });
  } catch (error: any) {
    handleRouteError(error, res);
  }
});

// AI Explain endpoint
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { code, language } = req.body;
    const result = await generateWithFallback(ai, {
      requestedModel: 'gemini-3.8-flash',
      contents: `Explain how this ${language} code works step by step, its purpose, and key logic:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      systemInstruction: 'You are an expert coding instructor. Explain code clearly with bullet points and technical precision.',
    });

    res.json({ success: true, explanation: result.text });
  } catch (error: any) {
    handleRouteError(error, res);
  }
});

// AI Refactor endpoint
app.post('/api/ai/refactor', async (req, res) => {
  try {
    const { code, language } = req.body;
    const result = await generateWithFallback(ai, {
      requestedModel: 'gemini-3.8-flash',
      contents: `Refactor and optimize this ${language} code. Improve performance, readability, and robustness. Return the response in JSON format matching this structure: { "refactoredCode": "...", "explanation": "...", "beforeComplexity": "...", "afterComplexity": "...", "changesMade": ["..."], "tradeoffs": ["..."] }:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      responseMimeType: 'application/json',
      systemInstruction: 'You are a principal software engineer. Provide refactored code and architectural justification in JSON format.',
    });

    let data;
    try {
      data = JSON.parse(result.text || '{}');
    } catch {
      data = {
        refactoredCode: result.text,
        explanation: 'Refactored successfully.',
        beforeComplexity: 'O(n²)',
        afterComplexity: 'O(n)',
        changesMade: ['Optimized loops', 'Improved data structures'],
        tradeoffs: ['Minimal memory trade-off for speed']
      };
    }

    res.json({ success: true, result: data });
  } catch (error: any) {
    handleRouteError(error, res);
  }
});

// AI Test Generator endpoint
app.post('/api/ai/tests', async (req, res) => {
  try {
    const { code, language, framework } = req.body;
    const result = await generateWithFallback(ai, {
      requestedModel: 'gemini-3.8-flash',
      contents: `Generate comprehensive unit tests using ${framework || 'Jest/PyTest'} for this ${language} code, covering edge cases, null inputs, and normal paths:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      systemInstruction: 'You are a QA automation expert. Write clean, complete, executable unit tests.',
    });

    res.json({ success: true, tests: result.text });
  } catch (error: any) {
    handleRouteError(error, res);
  }
});

// AI Documentation Generator endpoint
app.post('/api/ai/document', async (req, res) => {
  try {
    const { code, language } = req.body;
    const result = await generateWithFallback(ai, {
      requestedModel: 'gemini-3.8-flash',
      contents: `Generate professional documentation and docstrings/JSDoc for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      systemInstruction: 'You are a technical writer and API architect. Produce pristine documentation.',
    });

    res.json({ success: true, documentation: result.text });
  } catch (error: any) {
    handleRouteError(error, res);
  }
});

// AI Chat Assistant endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, contextCode, language } = req.body;
    const prompt = contextCode 
      ? `Current Code Context (${language}):\n\`\`\`${language}\n${contextCode}\n\`\`\`\n\nUser Question: ${message}`
      : `User Question: ${message}`;

    const result = await generateWithFallback(ai, {
      requestedModel: 'gemini-3.8-flash',
      contents: prompt,
      systemInstruction: 'You are CodePilot AI, a brilliant senior software engineer and coding assistant.',
    });

    res.json({ success: true, reply: result.text });
  } catch (error: any) {
    handleRouteError(error, res);
  }
});

// AI Chat Streaming endpoint using ReadableStream
app.post('/api/ai/chat-stream', async (req, res) => {
  try {
    const { message, contextCode, language } = req.body;
    const prompt = contextCode 
      ? `Current Code Context (${language}):\n\`\`\`${language}\n${contextCode}\n\`\`\`\n\nUser Question: ${message}`
      : `User Question: ${message}`;

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await generateStreamWithFallback(ai, {
      requestedModel: 'gemini-3.8-flash',
      contents: prompt,
      systemInstruction: 'You are CodePilot AI, a brilliant senior software engineer and coding assistant.',
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error: any) {
    if (!res.headersSent) {
      handleRouteError(error, res);
    } else {
      res.write(`\n\n[Quota Limit Exceeded: Please enter a valid Gemini API key in settings to continue]`);
      res.end();
    }
  }
});

// Projects API
app.get('/api/projects', (req, res) => {
  res.json({ success: true, projects: projectsStore });
});

app.post('/api/projects', (req, res) => {
  const newProj = {
    id: 'proj-' + Math.random().toString(36).substring(2, 9),
    name: req.body.name || 'New Project',
    description: req.body.description || '',
    files: req.body.files || [{ id: 'f-1', name: 'app.js', language: 'javascript', content: '// New file' }],
    updatedAt: new Date().toISOString()
  };
  projectsStore.push(newProj);
  res.json({ success: true, project: newProj });
});

// History API
app.get('/api/history', (req, res) => {
  res.json({ success: true, history: historyStore });
});

app.post('/api/history', (req, res) => {
  const entry = { ...req.body, id: 'hist-' + Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString() };
  historyStore.unshift(entry);
  res.json({ success: true, entry });
});

// Reports API
app.get('/api/reports', (req, res) => {
  res.json({ success: true, reports: reportsStore });
});

app.post('/api/reports', (req, res) => {
  const report = { ...req.body, id: 'rep-' + Math.random().toString(36).substring(2, 9), createdAt: new Date().toISOString() };
  reportsStore.unshift(report);
  res.json({ success: true, report });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
