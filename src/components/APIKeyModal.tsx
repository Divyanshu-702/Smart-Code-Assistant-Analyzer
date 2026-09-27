/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, AlertTriangle, CheckCircle, X, ShieldAlert } from 'lucide-react';

interface APIKeyModalProps {
  isOpen: boolean;
  errorCode?: number;
  errorMessage?: string;
  onClose: () => void;
  onSaveKey: (apiKey: string) => Promise<boolean>;
}

export const APIKeyModal: React.FC<APIKeyModalProps> = ({
  isOpen,
  errorCode = 401,
  errorMessage,
  onClose,
  onSaveKey,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey('');
      setSuccessMessage(null);
      setErrorText(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setErrorText('Please enter a valid API key.');
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    try {
      const success = await onSaveKey(apiKey.trim());
      if (success) {
        setSuccessMessage('API key updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorText('Failed to validate or save API key. Please check the key and try again.');
      }
    } catch (err: any) {
      setErrorText(err?.message || 'An error occurred while saving the API key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorDetails = () => {
    if (errorCode === 429) {
      return {
        title: 'API Quota Exceeded (429 Rate Limit)',
        description: 'You have exceeded your current Gemini API quota or free tier rate limit. Please provide a paid or alternative Gemini API key to continue without interruption.',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    }
    if (errorCode === 403) {
      return {
        title: 'API Access Forbidden (403)',
        description: 'Your Gemini API key lacks necessary permissions or is restricted. Please update your key below.',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      };
    }
    return {
      title: 'API Authentication Required (401 Unauthorized)',
      description: 'Your Gemini API key is missing, invalid, or expired. Please enter a valid Gemini API key to restore AI features.',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
  };

  const details = getErrorDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Gemini API Key Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${details.badgeColor}`}>
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">{details.title}</p>
              <p className="opacity-90">{details.description}</p>
              {errorMessage && <p className="mt-2 font-mono text-[10px] opacity-75 bg-black/20 p-1.5 rounded">{errorMessage}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Enter New Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Your API key is stored securely in local state and never sent to external third parties. Get a key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                Google AI Studio
              </a>
              .
            </p>
          </div>

          {errorText && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !apiKey.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving & Testing...</span>
                </>
              ) : (
                <span>Save API Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
