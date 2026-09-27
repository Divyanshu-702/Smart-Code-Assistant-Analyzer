/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage } from '../types';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

/**
 * Formats chat messages into a clean markdown or structured context string for LLM injection.
 */
export function formatChatContext(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'} (${m.timestamp}):\n${m.text}`)
    .join('\n\n--- ' + '-\n\n');
}

/**
 * Generates a concise title from the first user query in a session.
 */
export function generateChatTitle(firstMessageText: string): string {
  if (!firstMessageText) return 'New Conversation';
  const clean = firstMessageText.trim().replace(/[\n\r]+/g, ' ');
  return clean.length > 32 ? clean.substring(0, 32) + '...' : clean;
}
