/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Filter, Search, AlertTriangle, Bug, Zap, Layers, Copy, Check, Clock } from 'lucide-react';
import { ParsedLogEntry, ServiceDefinition } from '../types/forensic';
import { groupLogsIntoBuckets } from '../utils/logParser';

interface TimelineVisualizerProps {
  logs: ParsedLogEntry[];
  services: ServiceDefinition[];
  criticalSpikeTime?: string;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  logs,
  services,
  criticalSpikeTime,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Time buckets for the spike histogram
  const buckets = useMemo(() => groupLogsIntoBuckets(logs, 14), [logs]);
  const maxBucketTotal = useMemo(() => Math.max(...buckets.map(b => b.total), 1), [buckets]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Level filter
      if (selectedLevel === 'CRITICAL' && !log.isAnomaly && log.level !== 'ERROR' && log.level !== 'FATAL' && log.level !== 'PANIC') {
        return false;
      }
      if (selectedLevel === 'WARN' && log.level !== 'WARN') {
        return false;
      }
      if (selectedLevel === 'INFO' && log.level !== 'INFO' && log.level !== 'DEBUG') {
        return false;
      }

      // Service filter
      if (selectedServiceId !== 'ALL' && log.serviceId !== selectedServiceId) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          log.raw.toLowerCase().includes(query) ||
          log.serviceName.toLowerCase().includes(query) ||
          (log.traceId && log.traceId.toLowerCase().includes(query)) ||
          (log.anomalyReason && log.anomalyReason.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [logs, selectedLevel, selectedServiceId, searchTerm]);

  const copyLog = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getServiceColor = (srvId: string) => {
    const s = services.find((x) => x.id === srvId);
    return s?.color || '#06b6d4';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header & Metrics */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Хронологічний таймлайн та спайк-гістограма аномалій
            </h3>
            <p className="text-xs text-slate-400">
              Потокова синхронізація логів різних мікросервісів за мілісекундними мітками часу
            </p>
          </div>

          {criticalSpikeTime && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Епіцентр збою (T-0): <span className="font-bold text-white">{criticalSpikeTime}</span></span>
            </div>
          )}
        </div>

        {/* Time-Series Spike Histogram */}
        {buckets.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
              <span>Динаміка інтенсивності подій та відмов:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-rose-500" /> Помилки / Аномалії
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-amber-500" /> Попередження
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-cyan-600" /> Звичайний потік
                </span>
              </div>
            </div>

            <div className="h-16 flex items-end gap-1.5 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              {buckets.map((b, i) => {
                const totalHeight = Math.max((b.total / maxBucketTotal) * 100, 10);
                const errorRatio = b.errors / (b.total || 1);
                const warnRatio = b.warns / (b.total || 1);

                let barColor = 'bg-cyan-600/70 hover:bg-cyan-500';
                if (b.criticals > 0 || errorRatio > 0.4) {
                  barColor = 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
                } else if (warnRatio > 0.4 || b.warns > 0) {
                  barColor = 'bg-amber-500 hover:bg-amber-400';
                }

                // Smart horizontal positioning to prevent clipping at edges
                let tooltipAlign = 'left-1/2 -translate-x-1/2';
                if (i <= 1) {
                  tooltipAlign = 'left-0 translate-x-0';
                } else if (i >= buckets.length - 2) {
                  tooltipAlign = 'right-0 translate-x-0';
                }

                return (
                  <div
                    key={i}
                    className="flex-1 h-full flex items-end group relative cursor-pointer"
                  >
                    <div
                      style={{ height: `${totalHeight}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${barColor}`}
                    />
                    <div className={`absolute bottom-full mb-2 hidden group-hover:block z-30 whitespace-nowrap bg-slate-900/95 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-lg text-[11px] text-white shadow-2xl pointer-events-none font-mono ${tooltipAlign}`}>
                      <div className="flex items-center justify-between gap-3 font-bold text-cyan-300 border-b border-slate-800 pb-0.5 mb-1">
                        <span>{b.timestampLabel}</span>
                        <span className="text-slate-400 font-normal text-[10px]">Бакет #{i + 1}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-slate-300">Всього: <strong className="text-white">{b.total}</strong></span>
                        {b.errors > 0 && <span className="text-rose-400">Помилок: <strong>{b.errors}</strong></span>}
                        {b.warns > 0 && <span className="text-amber-400">Warn: <strong>{b.warns}</strong></span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Control Filter Bar */}
      <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Фільтр за текстом, traceId або винятком..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-white placeholder-slate-500 outline-none font-mono"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Level Filter */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSelectedLevel('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                selectedLevel === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Всі ({logs.length})
            </button>
            <button
              onClick={() => setSelectedLevel('CRITICAL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                selectedLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bug className="w-3 h-3 text-rose-400" />
              Помилки
            </button>
            <button
              onClick={() => setSelectedLevel('WARN')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                selectedLevel === 'WARN' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Warn
            </button>
          </div>

          {/* Service Filter */}
          <div className="relative">
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] outline-none cursor-pointer focus:border-cyan-500"
            >
              <option value="ALL">Всі сервіси ({services.length})</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Показано: <span className="text-cyan-400 font-bold">{filteredLogs.length}</span>
          </span>
        </div>
      </div>

      {/* Log Stream Container */}
      <div className="divide-y divide-slate-800/60 max-h-[440px] overflow-y-auto font-mono text-[12px] bg-slate-950/70">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p>Жодного рядка логу не знайдено за заданими критеріями фільтра</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isCritical = log.level === 'FATAL' || log.level === 'PANIC' || log.level === 'ERROR';
            const isWarn = log.level === 'WARN';

            let rowBg = 'hover:bg-slate-900/60';
            if (log.isAnomaly) {
              rowBg = 'bg-rose-950/25 hover:bg-rose-950/40 border-l-4 border-l-rose-500';
            } else if (isCritical) {
              rowBg = 'bg-rose-950/10 hover:bg-rose-950/25 border-l-2 border-l-rose-500/50';
            } else if (isWarn) {
              rowBg = 'hover:bg-amber-950/15 border-l-2 border-l-amber-500/40';
            }

            return (
              <div
                key={log.id}
                className={`p-2.5 sm:px-4 transition-colors flex flex-col sm:flex-row sm:items-start gap-2.5 group relative ${rowBg}`}
              >
                {/* Line number and Timestamp */}
                <div className="flex items-center gap-2 shrink-0 select-none text-[11px] text-slate-500">
                  <span className="w-8 text-right font-mono text-slate-600">{index + 1}</span>
                  <span className="text-slate-400">{log.timestamp.substring(11, 23) || log.timestamp}</span>
                </div>

                {/* Service Tag */}
                <div className="shrink-0">
                  <span
                    style={{ borderColor: getServiceColor(log.serviceId) }}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border text-slate-300"
                  >
                    {log.serviceName}
                  </span>
                </div>

                {/* Level Tag */}
                <div className="shrink-0">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.level === 'FATAL' || log.level === 'PANIC'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : log.level === 'ERROR'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : log.level === 'WARN'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {log.level}
                  </span>
                </div>

                {/* Trace ID Tag */}
                {log.traceId && (
                  <button
                    onClick={() => setSearchTerm(log.traceId || '')}
                    className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer"
                    title="Клікніть, щоб відфільтрувати за цим Trace ID"
                  >
                    {log.traceId}
                  </button>
                )}

                {/* Message Body */}
                <div className="flex-1 break-all text-slate-200 leading-relaxed">
                  {log.message}
                  {log.isAnomaly && log.anomalyReason && (
                    <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-sans font-semibold">
                      <Zap className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{log.anomalyReason}</span>
                    </div>
                  )}
                </div>

                {/* Copy single line button */}
                <button
                  onClick={() => copyLog(log.id, log.raw)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-opacity shrink-0 cursor-pointer"
                  title="Копіювати рядок"
                >
                  {copiedId === log.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
