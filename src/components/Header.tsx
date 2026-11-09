/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Key, Printer, RotateCcw, Cpu, Sparkles, Terminal } from 'lucide-react';
import { AnalysisEngineMode } from '../types/forensic';

interface HeaderProps {
  activeTab: 'sandbox' | 'custom';
  onTabChange: (tab: 'sandbox' | 'custom') => void;
  hasByokKey: boolean;
  onOpenByokModal: () => void;
  engineMode: AnalysisEngineMode;
  onResetSession: () => void;
  onPrintReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  hasByokKey,
  onOpenByokModal,
  engineMode,
  onResetSession,
  onPrintReport,
}) => {
  const getEngineBadge = () => {
    switch (engineMode) {
      case 'gemini-3.8-flash':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Gemini 3.8 Flash (BYOK)
          </span>
        );
      case 'gemini-flash-latest':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Каскад (Ступінь 2): Flash Latest
          </span>
        );
      case 'gemini-3.1-flash-lite':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Каскад (Ступінь 3): Flash-Lite
          </span>
        );
      case 'local-heuristic':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Cpu className="w-3 h-3" />
            Офлайн Евристика (0 токенів)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-3 h-3" />
            Інтерактивна пісочниця (0 токенів)
          </span>
        );
    }
  };

  const handlePrint = () => {
    onPrintReport();
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-slate-950/85 border-b border-slate-800/80 transition-all isolation: isolate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 p-[1px] shadow-lg shadow-cyan-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                LogForensic<span className="text-cyan-400">AI</span>
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider font-mono">
                2M+ Context
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Zero-Shot System Forensic & SRE Post-Mortem
            </p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800/90 shadow-inner">
          <button
            onClick={() => onTabChange('sandbox')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Демо-пісочниця</span>
          </button>
          <button
            onClick={() => onTabChange('custom')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Власні логи та код</span>
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5">
          {/* Active Engine Badge */}
          <div className="hidden lg:block">
            {getEngineBadge()}
          </div>

          {/* BYOK Button */}
          <button
            onClick={onOpenByokModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              hasByokKey
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
            title="Підключення персонального ключа для аналізу власних даних"
          >
            <Key className={`w-3.5 h-3.5 ${hasByokKey ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {hasByokKey ? 'BYOK активний' : 'Власний ключ (BYOK)'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasByokKey ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Друк / Експорт SRE Post-Mortem у PDF"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Reset Session */}
          <button
            onClick={onResetSession}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Скинути стан сесії"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
