/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GitCommit, ArrowRight, AlertOctagon, CheckCircle2, Flame, ShieldAlert, Cpu } from 'lucide-react';
import { CausationStep, ForensicAnalysisResult } from '../types/forensic';

interface CausationFlowProps {
  analysis: ForensicAnalysisResult;
}

export const CausationFlow: React.FC<CausationFlowProps> = ({ analysis }) => {
  const steps = analysis.causationChain || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-cyan-400" />
            Ланцюг причинно-наслідкових звʼязків (Chain of Causation)
          </h3>
          <p className="text-xs text-slate-400">
            Реконструкція розвитку збою від первинного тригера до повного колапсу системи
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            Винуватець: <span className="font-bold text-white">{analysis.culpritService}</span>
          </span>
        </div>
      </div>

      {/* Summary Alert Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            Справжня першопричина (Root Cause)
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {analysis.rootCause}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Масштаб ураження (Blast Radius)
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {analysis.blastRadius}
          </p>
        </div>
      </div>

      {/* Horizontal / Vertical Chain Steps */}
      <div className="space-y-4 relative">
        {/* Left vertical timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-500 via-amber-500 to-rose-500 hidden sm:block" />

        {steps.map((step, idx) => {
          const isCritical = step.severity === 'critical';
          const isLast = idx === steps.length - 1;

          return (
            <div
              key={step.step}
              className={`relative sm:pl-11 p-4 rounded-xl border transition-all ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/30 shadow-md shadow-rose-950/10'
                  : 'bg-slate-950/50 border-slate-800/80'
              }`}
            >
              {/* Timeline marker icon on the left */}
              <div
                className={`absolute left-2.5 top-5 -translate-x-1/2 w-4 h-4 rounded-full border-2 hidden sm:flex items-center justify-center ${
                  isCritical
                    ? 'bg-rose-500 border-rose-300 ring-4 ring-rose-500/20'
                    : 'bg-slate-900 border-cyan-400 ring-4 ring-cyan-500/10'
                }`}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Крок {step.step}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
                    {step.service}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Час події: <span className="text-slate-200 font-bold">{step.time}</span>
                </div>
              </div>

              {/* Event description */}
              <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                {step.event}
              </h4>

              {/* Technical impact */}
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                <span className="text-slate-400 font-semibold">Наслідок: </span>
                {step.technicalImpact}
              </p>

              {/* Log Snippet quote */}
              {step.logSnippet && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-cyan-200/90 break-all flex items-start gap-2">
                  <span className="text-slate-500 select-none">ЛОГ:</span>
                  <span>{step.logSnippet}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
