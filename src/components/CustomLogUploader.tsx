/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Upload, FileText, Code2, Sparkles, AlertCircle, Key, Cpu, Play } from 'lucide-react';
import { LogStreamInput, SourceCodeFile } from '../types/forensic';

interface CustomLogUploaderProps {
  onStartAnalysis: (streams: LogStreamInput[], code?: SourceCodeFile) => Promise<void>;
  isAnalyzing: boolean;
  hasByokKey: boolean;
  onOpenByokModal: () => void;
}

export const CustomLogUploader: React.FC<CustomLogUploaderProps> = ({
  onStartAnalysis,
  isAnalyzing,
  hasByokKey,
  onOpenByokModal,
}) => {
  const [streams, setStreams] = useState<LogStreamInput[]>([
    {
      serviceId: 'service_1',
      serviceName: 'API Gateway / Ingress',
      rawLogs: `2026-11-09T10:00:01.120Z [INFO] GET /api/v1/orders HTTP/1.1 200 120ms\n2026-11-09T10:00:04.500Z [WARN] POST /api/v1/checkout HTTP/1.1 200 4500ms slow_response\n2026-11-09T10:00:08.900Z [ERROR] POST /api/v1/checkout HTTP/1.1 504 15000ms upstream timed out`,
    },
    {
      serviceId: 'service_2',
      serviceName: 'Orders Microservice',
      rawLogs: `2026-11-09T10:00:04.100Z [INFO] Processing checkout order_49102\n2026-11-09T10:00:06.800Z [WARN] DB client acquisition latency: 2800ms\n2026-11-09T10:00:08.850Z [FATAL] Timeout acquiring connection from database pool (max: 50)`,
    },
  ]);

  const [includeCode, setIncludeCode] = useState(true);
  const [sourceCode, setSourceCode] = useState<SourceCodeFile>({
    filename: 'src/services/orderService.ts',
    language: 'typescript',
    code: `export async function handleCheckout(cartId: string) {\n  const pool = getDbPool();\n  // Отримання зʼєднання без таймауту\n  const client = await pool.connect();\n  try {\n    await client.query('BEGIN');\n    // ... операції\n    await client.query('COMMIT');\n  } catch (err) {\n    await client.query('ROLLBACK');\n    throw err;\n  }\n}`,
  });

  const handleAddStream = () => {
    const newIdx = streams.length + 1;
    setStreams([
      ...streams,
      {
        serviceId: `service_${newIdx}_${Date.now()}`,
        serviceName: `Мікросервіс #${newIdx}`,
        rawLogs: '',
      },
    ]);
  };

  const handleRemoveStream = (idx: number) => {
    if (streams.length <= 1) return;
    setStreams(streams.filter((_, i) => i !== idx));
  };

  const handleUpdateStream = (idx: number, field: 'serviceName' | 'rawLogs', value: string) => {
    const updated = [...streams];
    updated[idx] = { ...updated[idx], [field]: value };
    setStreams(updated);
  };

  const handleFileUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleUpdateStream(idx, 'rawLogs', content);
      }
    };
    reader.readAsText(file);
  };

  const totalLines = streams.reduce((acc, s) => acc + (s.rawLogs.trim() ? s.rawLogs.split('\n').length : 0), 0);
  const estimatedTokens = Math.round(
    (streams.reduce((acc, s) => acc + s.rawLogs.length, 0) + (includeCode ? sourceCode.code.length : 0)) / 3.8
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalLines === 0) return;
    await onStartAnalysis(streams, includeCode && sourceCode.code.trim() ? sourceCode : undefined);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl">
      <div className="pb-5 border-b border-slate-800/80 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Завантаження власних системних логів та коду (Power User)
          </h2>
          <p className="text-xs text-slate-400">
            Аналізуйте реальні дампи Kubernetes, Docker, Nginx, PostgreSQL чи власних мікросервісів
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-2.5 font-mono text-xs">
          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Рядків: <span className="font-bold text-cyan-400">{totalLines}</span>
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            Токенів: <span className="font-bold text-emerald-400">~{estimatedTokens}</span>
          </span>
        </div>
      </div>

      {/* BYOK Status Banner */}
      {!hasByokKey ? (
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-300">
              <span className="font-bold text-cyan-300">Гостьовий захисний режим (0 токенів автора): </span>
              Зараз аналіз виконується на локальному клієнтському рушії. Для активації моделі{' '}
              <span className="font-semibold text-white">Gemini 3.8 Flash (2M+ Context)</span> вкажіть ваш безкоштовний ключ.
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenByokModal}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Підключити ключ (BYOK)
          </button>
        </div>
      ) : (
        <div className="mb-6 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Власний ключ BYOK активний. Запит буде спрямовано до моделі <span className="font-bold text-white">Gemini 3.8 Flash</span> з Auto-Cascade захистом квоти.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Streams List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Потоки логів сервісів ({streams.length})
            </label>
            <button
              type="button"
              onClick={handleAddStream}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 transition-colors border border-slate-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Додати сервіс
            </button>
          </div>

          {streams.map((stream, idx) => (
            <div
              key={stream.serviceId}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={stream.serviceName}
                  onChange={(e) => handleUpdateStream(idx, 'serviceName', e.target.value)}
                  placeholder="Назва сервісу (наприклад, Nginx Ingress, Payment API)"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:border-cyan-500 outline-none w-full max-w-xs"
                />

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Файл (.log, .txt)</span>
                    <input
                      type="file"
                      accept=".log,.txt,.json"
                      onChange={(e) => handleFileUpload(idx, e)}
                      className="hidden"
                    />
                  </label>

                  {streams.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStream(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Видалити потік логів"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={stream.rawLogs}
                onChange={(e) => handleUpdateStream(idx, 'rawLogs', e.target.value)}
                placeholder="Вставте сирі логи сервісу сюди (підтримуються будь-які часові мітки, JSON-логи, стек-трейси, помилки)..."
                rows={5}
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none resize-y"
              />
            </div>
          ))}
        </div>

        {/* Source Code Toggle & Input */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 select-none">
              <input
                type="checkbox"
                checked={includeCode}
                onChange={(e) => setIncludeCode(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Додати фрагмент вихідного коду для перехресного аналізу дефектів</span>
            </label>
          </div>

          {includeCode && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={sourceCode.filename}
                  onChange={(e) => setSourceCode({ ...sourceCode, filename: e.target.value })}
                  placeholder="Шлях до файлу (наприклад, src/controllers/order.ts)"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:border-cyan-500 outline-none w-full max-w-sm"
                />
                <input
                  type="text"
                  value={sourceCode.language}
                  onChange={(e) => setSourceCode({ ...sourceCode, language: e.target.value })}
                  placeholder="Мова (typescript, python, go, etc.)"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 focus:border-cyan-500 outline-none w-36"
                />
              </div>

              <textarea
                value={sourceCode.code}
                onChange={(e) => setSourceCode({ ...sourceCode, code: e.target.value })}
                placeholder="Вставте код методу або класу, де підозрюється помилка..."
                rows={6}
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none resize-y"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isAnalyzing || totalLines === 0}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:via-indigo-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-cyan-500/20 transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-slate-950" />
                <span>Глибинний аналіз інциденту...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>Запустити форензік Gemini ({totalLines} рядків)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
