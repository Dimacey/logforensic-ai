/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ForensicAnalysisResult } from '../types/forensic';

const LOCAL_STORAGE_KEY = 'logforensic_byok_api_key';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
}

export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(LOCAL_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export function clearStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export interface PingResponse {
  success: boolean;
  model: string;
  message: string;
}

export async function pingApiKey(key: string): Promise<PingResponse> {
  const res = await fetch('/api/forensic/ping', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gemini-api-key': key.trim(),
    },
    body: JSON.stringify({ apiKey: key.trim() }),
  });

  return await res.json();
}

export interface AnalyzePayload {
  logs: { serviceId?: string; serviceName: string; rawLogs: string }[];
  sourceCode?: { filename: string; code: string };
  allowHeuristicFallback?: boolean;
}

export interface AnalyzeResponse {
  success: boolean;
  modelUsed: 'gemini-3.8-flash' | 'gemini-flash-latest' | 'gemini-3.1-flash-lite' | 'local-heuristic';
  result: ForensicAnalysisResult;
  tokensEstimate: number;
  durationMs: number;
  cascadeNote?: string;
  error?: string;
}

export async function requestForensicAnalysis(payload: AnalyzePayload): Promise<AnalyzeResponse> {
  const userKey = getStoredApiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userKey) {
    headers['x-gemini-api-key'] = userKey;
  }

  const res = await fetch('/api/forensic/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...payload,
      allowHeuristicFallback: true,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Помилка сервера (${res.status})`);
  }

  return await res.json();
}
