/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Code2, AlertTriangle, CheckCircle2, Copy, Check, FileCode2, Sparkles, ArrowLeftRight } from 'lucide-react';
import { SourceCodeFile } from '../types/forensic';

interface CodeCulpritViewerProps {
  sourceCode: SourceCodeFile;
  culpritDiff?: string;
  problemExplanation?: string;
}

export const CodeCulpritViewer: React.FC<CodeCulpritViewerProps> = ({
  sourceCode,
  culpritDiff,
  problemExplanation,
}) => {
  const [viewMode, setViewMode] = useState<'original' | 'fixed' | 'diff'>('original');
  const [copied, setCopied] = useState(false);

  const startLine = sourceCode.culpritStartLine || 1;
  const endLine = sourceCode.culpritEndLine || startLine;

  const currentCodeToDisplay =
    viewMode === 'fixed' && sourceCode.fixedCode
      ? sourceCode.fixedCode
      : viewMode === 'diff' && culpritDiff
      ? culpritDiff
      : sourceCode.code;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCodeToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lines = currentCodeToDisplay.split('\n');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-mono">
                {sourceCode.filename}
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {sourceCode.language}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Локалізація підозрілого фрагмента коду за результатами крос-кореляції
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setViewMode('original')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'original'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Вразливий код
            </button>
            {sourceCode.fixedCode && (
              <button
                onClick={() => setViewMode('fixed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'fixed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Виправлений код
              </button>
            )}
            {culpritDiff && (
              <button
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'diff'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Diff патч
              </button>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
            title="Копіювати код"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Скопійовано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Копіювати</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      {(problemExplanation || sourceCode.problemExplanation) && (
        <div className="p-4 bg-rose-950/20 border-b border-rose-500/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200 leading-relaxed font-sans">
            <span className="font-bold text-rose-300">Діагностика анти-патерну: </span>
            {problemExplanation || sourceCode.problemExplanation}
          </div>
        </div>
      )}

      {/* Code Listing */}
      <div className="p-4 overflow-x-auto max-h-[460px] overflow-y-auto bg-slate-950 font-mono text-[13px] leading-relaxed">
        <pre className="text-slate-200">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isCulpritLine = viewMode === 'original' && lineNum >= startLine && lineNum <= endLine;
            const isDiffAdd = viewMode === 'diff' && line.startsWith('+');
            const isDiffRemove = viewMode === 'diff' && line.startsWith('-');

            let lineStyle = 'hover:bg-slate-900/60';
            if (isCulpritLine) {
              lineStyle = 'bg-rose-950/40 border-l-4 border-l-rose-500 text-rose-200';
            } else if (isDiffAdd) {
              lineStyle = 'bg-emerald-950/30 text-emerald-300 border-l-4 border-l-emerald-500';
            } else if (isDiffRemove) {
              lineStyle = 'bg-rose-950/30 text-rose-300 line-through opacity-80 border-l-4 border-l-rose-500';
            }

            return (
              <div key={idx} className={`flex items-start px-3 py-0.5 rounded-sm ${lineStyle}`}>
                <span className="w-10 text-right pr-4 text-slate-600 select-none shrink-0 font-mono text-xs">
                  {lineNum}
                </span>
                <span className="flex-1 whitespace-pre">{line || ' '}</span>
                {isCulpritLine && idx === startLine - 1 && (
                  <span className="ml-4 shrink-0 px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-sans font-semibold">
                    Рядки-винуватці
                  </span>
                )}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};
