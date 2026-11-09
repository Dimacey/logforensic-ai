/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, type Request, type Response } from 'express';
import { analyzeIncidentWithGemini, pingGeminiApiKey } from './geminiForensic.ts';
import { parseRawLogs, generateLocalHeuristicReport } from '../utils/logParser.ts';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    service: 'LogForensic AI System Forensic Service',
    hasSystemKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// Ping BYOK Key
apiRouter.post('/forensic/ping', async (req: Request, res: Response) => {
  try {
    const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
    if (!clientKey) {
      return res.status(400).json({ success: false, message: 'Будь ласка, вкажіть API-ключ для перевірки.' });
    }

    const pingResult = await pingGeminiApiKey(clientKey);
    return res.json(pingResult);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Помилка тестування ключа' });
  }
});

// Full Forensic Incident Analysis Endpoint
apiRouter.post('/forensic/analyze', async (req: Request, res: Response) => {
  try {
    const { logs, sourceCode, allowHeuristicFallback = true } = req.body || {};
    const clientKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
    const hasAnyKey = Boolean(clientKey || (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'));

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Не надано логів для аналізу. Завантажте файл або вставте текст логу.',
      });
    }

    // If no key is configured and heuristic fallback is permitted:
    if (!hasAnyKey) {
      if (allowHeuristicFallback) {
        // Run fast offline heuristic analysis
        const combinedParsedLogs = logs.flatMap((stream, idx) =>
          parseRawLogs(stream.rawLogs, stream.serviceId || `service_${idx}`, stream.serviceName || `Service #${idx + 1}`)
        );
        const heuristicResult = generateLocalHeuristicReport(combinedParsedLogs, sourceCode);

        return res.json({
          success: true,
          modelUsed: 'local-heuristic',
          result: heuristicResult,
          tokensEstimate: 0,
          durationMs: 45,
          cascadeNote: 'Гостьовий режим (0 токенів автора): виконано локальний евристичний аналіз. Для залучення повної потужності нейромережі Gemini 3.8 Flash підключіть власний ключ у шапці сайту.',
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'MISSING_KEY: Для аналізу власних даних потрібен Gemini API Key. Введіть його у вікні "Власний ключ (BYOK)".',
        });
      }
    }

    // Call Gemini with Auto-Cascade
    try {
      const response = await analyzeIncidentWithGemini({
        logs,
        sourceCode,
        apiKey: clientKey,
      });
      return res.json(response);
    } catch (geminiError: any) {
      console.warn('Gemini cloud analysis failed, falling back to local heuristic if permitted:', geminiError?.message);

      if (allowHeuristicFallback) {
        const combinedParsedLogs = logs.flatMap((stream, idx) =>
          parseRawLogs(stream.rawLogs, stream.serviceId || `service_${idx}`, stream.serviceName || `Service #${idx + 1}`)
        );
        const heuristicResult = generateLocalHeuristicReport(combinedParsedLogs, sourceCode);

        return res.json({
          success: true,
          modelUsed: 'local-heuristic',
          result: heuristicResult,
          tokensEstimate: 0,
          durationMs: 80,
          cascadeNote: `Каскадний захист: Gemini API повернув помилку (${geminiError?.message || 'Квоту вичерпано'}). Активовано автономний евристичний аналіз для безперебійної роботи без білого екрана.`,
        });
      }

      return res.status(500).json({
        success: false,
        error: geminiError?.message || 'Не вдалося виконати аналіз інциденту',
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Внутрішня помилка сервера аналітики',
    });
  }
});
