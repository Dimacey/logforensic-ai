/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Wrench, Copy, Check, FileCog, Shield } from 'lucide-react';

interface MitigationPatchProps {
  patch?: {
    filename: string;
    content: string;
    language: string;
    explanation: string;
  };
}

export const MitigationPatchViewer: React.FC<MitigationPatchProps> = ({ patch }) => {
  const [copied, setCopied] = useState(false);

  if (!patch) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(patch.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileCog className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-mono">
                {patch.filename}
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {patch.language}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Готовий конфігураційний патч для усунення вразливості на рівні інфраструктури
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Скопійовано!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Копіювати конфіг</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 bg-emerald-950/20 border-b border-emerald-500/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-200 leading-relaxed font-sans">
          <span className="font-bold text-emerald-300">Призначення патчу: </span>
          {patch.explanation}
        </div>
      </div>

      <div className="p-4 overflow-x-auto bg-slate-950 font-mono text-xs leading-relaxed text-emerald-300/90 max-h-[300px] overflow-y-auto">
        <pre className="whitespace-pre">{patch.content}</pre>
      </div>
    </div>
  );
};
