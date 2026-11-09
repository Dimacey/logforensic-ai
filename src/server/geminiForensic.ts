/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { ForensicAnalysisResult } from '../types/forensic.ts';

interface AnalyzeRequestPayload {
  logs: { serviceId?: string; serviceName: string; rawLogs: string }[];
  sourceCode?: { filename: string; code: string };
  apiKey?: string;
}

export interface AnalysisServerResponse {
  success: boolean;
  modelUsed: 'gemini-3.8-flash' | 'gemini-flash-latest' | 'gemini-3.1-flash-lite' | 'local-heuristic';
  result: ForensicAnalysisResult;
  tokensEstimate: number;
  durationMs: number;
  cascadeNote?: string;
}

export async function analyzeIncidentWithGemini(
  payload: AnalyzeRequestPayload
): Promise<AnalysisServerResponse> {
  const startTime = Date.now();
  const effectiveApiKey = payload.apiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

  // If no API key is available at all, return informative response
  if (!effectiveApiKey) {
    throw new Error('MISSING_API_KEY: Для аналізу власних даних потрібен Gemini API Key. Введіть його у вікні "Власний ключ (BYOK)".');
  }

  const ai = new GoogleGenAI({
    apiKey: effectiveApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Prepare system prompt and contents
  const systemInstruction = `Ти — світовий експерт із розподілених систем, Staff SRE та Linux Systems Forensic Architect.
Твоє завдання — провести глибокий реверс-аналіз інциденту на основі мультисервісних логів та фрагментів вихідного коду.
Твоя мета:
1. Знайти СПРАВЖНЮ ПЕРШОПРИЧИНУ (Root Cause), а не просто симптоми.
2. Побудувати чіткий ланцюг причинності (Causation Chain) від тригера до колапсу з мілісекундною точністю.
3. Локалізувати конкретні рядки коду (якщо надано код), що спричинили дедлок, витік памʼяті або стан перегонів (Race Condition).
4. Скласти професійний звіт за офіційним стандартом Google SRE Post-Mortem.
5. Уся текстова аналітика та звіти мають бути виключно літературною українською мовою.`;

  const logsFormatted = payload.logs
    .map((stream, idx) => `=== ЛОГ-ПОТІК #${idx + 1}: [Сервіс: ${stream.serviceName}] ===\n${stream.rawLogs}`)
    .join('\n\n');

  const codeFormatted = payload.sourceCode?.code
    ? `\n\n=== ПІДОЗРІЛИЙ ВИХІДНИЙ КОД [Файл: ${payload.sourceCode.filename}] ===\n${payload.sourceCode.code}`
    : '';

  const userPrompt = `Проаналізуй наступні логи розподіленої системи та код інциденту:\n\n${logsFormatted}${codeFormatted}\n\nПоверни структурований аналіз інциденту у форматі JSON згідно зі схемою.`;

  // Define structured JSON response schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: 'Коротке резюме інциденту (1-2 речення українською).' },
      rootCause: { type: Type.STRING, description: 'Справжня технічна першопричина збою українською.' },
      culpritService: { type: Type.STRING, description: 'Назва сервісу або компонента, що став винуватцем.' },
      triggerEvent: { type: Type.STRING, description: 'Подія-тригер, яка запустила каскадний збій.' },
      blastRadius: { type: Type.STRING, description: 'Масштаб ураження та постраждалі компоненти.' },
      causationChain: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.INTEGER },
            time: { type: Type.STRING, description: 'Часова мітка події (HH:MM:SS або повна).' },
            service: { type: Type.STRING },
            event: { type: Type.STRING, description: 'Опис події українською.' },
            severity: { type: Type.STRING, description: 'info, warn, або critical.' },
            logSnippet: { type: Type.STRING, description: 'Цитата відповідного рядка логу.' },
            technicalImpact: { type: Type.STRING, description: 'Технічний вплив на систему.' },
          },
        },
      },
      anomalies: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            service: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            timestamp: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
        },
      },
      culpritCode: {
        type: Type.OBJECT,
        properties: {
          filename: { type: Type.STRING },
          culpritLines: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
          },
          problemExplanation: { type: Type.STRING },
          proposedDiff: { type: Type.STRING },
        },
      },
      srePostMortem: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          severity: { type: Type.STRING },
          date: { type: Type.STRING },
          leadInvestigator: { type: Type.STRING },
          impactSummary: { type: Type.STRING },
          downtimeDuration: { type: Type.STRING },
          detectionTime: { type: Type.STRING },
          rootCauseAnalysis: { type: Type.STRING },
          triggerEvent: { type: Type.STRING },
          blastRadius: { type: Type.STRING },
          lessonsLearned: {
            type: Type.OBJECT,
            properties: {
              whatWentWell: { type: Type.ARRAY, items: { type: Type.STRING } },
              whatWentWrong: { type: Type.ARRAY, items: { type: Type.STRING } },
              whereWeGotLucky: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          actionItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                task: { type: Type.STRING },
                type: { type: Type.STRING },
                owner: { type: Type.STRING },
                priority: { type: Type.STRING },
                status: { type: Type.STRING },
              },
            },
          },
        },
      },
      mitigationConfigPatch: {
        type: Type.OBJECT,
        properties: {
          filename: { type: Type.STRING },
          content: { type: Type.STRING },
          language: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
      },
      metricsSummary: {
        type: Type.OBJECT,
        properties: {
          totalLogsParsed: { type: Type.INTEGER },
          errorCount: { type: Type.INTEGER },
          warnCount: { type: Type.INTEGER },
          criticalSpikeTime: { type: Type.STRING },
          confidenceScore: { type: Type.NUMBER },
        },
      },
    },
  };

  // СТУПІНЬ 1 (Primary Flagship): gemini-3.8-flash
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const parsedJson = JSON.parse(response.text || '{}') as ForensicAnalysisResult;
    const durationMs = Date.now() - startTime;
    const tokensEstimate = Math.round((userPrompt.length + (response.text?.length || 0)) / 3.8);

    return {
      success: true,
      modelUsed: 'gemini-3.8-flash',
      result: parsedJson,
      tokensEstimate,
      durationMs,
    };
  } catch (primaryErr: any) {
    console.warn('Каскадний крок 1: Gemini 3.8 Flash повернув помилку або квоту вичерпано. Переходимо на ступінь 2 (gemini-flash-latest):', primaryErr?.message || primaryErr);

    // СТУПІНЬ 2 (Intermediate Cascade): gemini-flash-latest
    try {
      const stage2Response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const parsedJson = JSON.parse(stage2Response.text || '{}') as ForensicAnalysisResult;
      const durationMs = Date.now() - startTime;
      const tokensEstimate = Math.round((userPrompt.length + (stage2Response.text?.length || 0)) / 3.8);

      return {
        success: true,
        modelUsed: 'gemini-flash-latest',
        result: parsedJson,
        tokensEstimate,
        durationMs,
        cascadeNote: 'Auto-Cascade Guard (Ступінь 2): Квоту 3.8 вичерпано. Аналіз виконано стабільним пулом gemini-flash-latest.',
      };
    } catch (stage2Err: any) {
      console.warn('Каскадний крок 2: gemini-flash-latest також недоступний. Переходимо на ступінь 3 (gemini-3.1-flash-lite):', stage2Err?.message || stage2Err);

      // СТУПІНЬ 3 (Ultra-Lite Quota Savior): gemini-3.1-flash-lite
      try {
        const stage3Response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema,
          },
        });

        const parsedJson = JSON.parse(stage3Response.text || '{}') as ForensicAnalysisResult;
        const durationMs = Date.now() - startTime;
        const tokensEstimate = Math.round((userPrompt.length + (stage3Response.text?.length || 0)) / 3.8);

        return {
          success: true,
          modelUsed: 'gemini-3.1-flash-lite',
          result: parsedJson,
          tokensEstimate,
          durationMs,
          cascadeNote: 'Auto-Cascade Guard (Ступінь 3): Активовано полегшену модель Gemini 3.1 Flash-Lite для збереження квоти.',
        };
      } catch (stage3Err: any) {
        console.error('Усі хмарні моделі Gemini вичерпали квоту або недоступні:', stage3Err?.message || stage3Err);
        throw new Error(`Помилка Gemini API: ${primaryErr?.message || 'Сервіс тимчасово недоступний'}. Спробуйте перевірити ключ у вікні BYOK.`);
      }
    }
  }
}

export async function pingGeminiApiKey(apiKey: string): Promise<{ success: boolean; model: string; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, model: '', message: 'Ключ порожній' };
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Ping test. Відповідай лише словом PONG.',
    });
    return {
      success: true,
      model: 'gemini-3.8-flash',
      message: res.text?.trim() || 'PONG',
    };
  } catch (err: any) {
    // Try lite model for ping
    try {
      const resLite = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'Ping test. Відповідай лише словом PONG.',
      });
      return {
        success: true,
        model: 'gemini-3.1-flash-lite',
        message: resLite.text?.trim() || 'PONG',
      };
    } catch (errLite: any) {
      return {
        success: false,
        model: '',
        message: errLite?.message || err?.message || 'Помилка валідації API-ключа',
      };
    }
  }
}
