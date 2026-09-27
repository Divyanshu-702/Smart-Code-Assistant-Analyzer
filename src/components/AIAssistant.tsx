/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChatMessage, Language } from '../types';
import { Bot, Send, User, Sparkles, Plus, MessageSquare, Trash2, RefreshCw, History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { streamAIChatMessage } from '../services/aiService';
import { ChatSession, generateChatTitle } from '../utils/chatContextFormatter';

interface AIAssistantProps {
  currentCode: string;
  language: Language;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ currentCode, language }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('codepilot_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'session-1',
        title: 'Initial Code Discussion',
        messages: [
          {
            id: 'm-1',
            sender: 'assistant',
            text: 'Hello! I am CodePilot AI, powered by Gemini with advanced reasoning. Ask me anything about your current code, request optimizations, debugging help, or architecture advice.',
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
        createdAt: new Date().toLocaleTimeString(),
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('codepilot_chat_sessions', JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const quickPrompts = [
    'Explain this code in detail',
    'Why is this O(n²) and how do I fix it?',
    'Find potential security risks or bugs',
    'Convert this code to TypeScript / Python',
    'Add robust error handling & validation',
  ];

  const handleNewChat = () => {
    const newId = 'session-' + Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [
        {
          id: 'm-' + Math.random().toString(36).substring(2, 9),
          sender: 'assistant',
          text: 'Started a new session. How can I help you analyze or improve your code today?',
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      createdAt: new Date().toLocaleTimeString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleNewChat();
      return;
    }
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0].id);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    const newTitle = activeSession.title === 'New Conversation' ? generateChatTitle(query) : activeSession.title;

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: updatedMessages, title: newTitle } : s))
    );

    if (!textToSend) setInput('');
    setIsSending(true);

    const assistantMsgId = 'ast-' + Math.random().toString(36).substring(2, 9);
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString(),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...s.messages, initialAssistantMsg] } : s))
    );

    try {
      await streamAIChatMessage(query, currentCode, language, (chunk) => {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, text: m.text + chunk } : m
              ),
            };
          })
        );
      });
    } catch (err: any) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMsgId
                ? { ...m, text: 'Error connecting to Gemini AI service: ' + (err.message || 'Unknown error') }
                : m
            ),
          };
        })
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex bg-slate-950 overflow-hidden">
      {/* Sidebar for Chat History */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 overflow-hidden`}
      >
        <div className="h-16 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Chat Sessions</span>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between group cursor-pointer transition-all ${
                s.id === activeSessionId
                  ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-200'
                  : 'bg-slate-950/40 border border-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${s.id === activeSessionId ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="truncate font-medium">{s.title}</span>
              </div>
              <button
                onClick={(e) => handleDeleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-all"
                title="Delete session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title={sidebarOpen ? 'Hide History' : 'Show History'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeSession.title}</span>
              </h2>
              <p className="text-[11px] text-indigo-400 font-mono">Model: Gemini Pro Code Assistant</p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono hidden md:block">
            Active Context: <span className="text-indigo-300 font-semibold uppercase">{language}</span>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSession.messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-4 max-w-3xl ${
                m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-indigo-400'
                }`}
              >
                {m.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-mono'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className={`text-[10px] opacity-70 ${m.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-2 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Thinking deeply with Gemini...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-6 py-2 bg-slate-900/50 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Suggestions:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs whitespace-nowrap border border-slate-700 transition-all flex-shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 max-w-4xl mx-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CodePilot AI about your code, complexity, or refactoring..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
