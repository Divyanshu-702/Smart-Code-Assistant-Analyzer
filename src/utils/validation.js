/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const analysisRequestSchema = z.object({
  code: z.string().min(1, 'Code snippet cannot be empty').max(100000, 'Code snippet is too large'),
  language: z.enum(['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'html', 'css', 'json']),
  fileName: z.string().min(1, 'File name is required').max(255),
  projectName: z.string().min(1, 'Project name is required').max(255),
});

export const projectCreationSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
});

export function validateAnalysisInput(data) {
  return analysisRequestSchema.safeParse(data);
}

export function validateProjectInput(data) {
  return projectCreationSchema.safeParse(data);
}
