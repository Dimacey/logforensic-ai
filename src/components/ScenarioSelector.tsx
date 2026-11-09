/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, Clock, Users, DollarSign, Database, Server, Cpu } from 'lucide-react';
import { IncidentScenario } from '../types/forensic';
import { DEMO_SCENARIOS } from '../data/demoScenarios';

interface ScenarioSelectorProps {
  selectedScenarioId: string;
  onSelectScenario: (scenario: IncidentScenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  selectedScenarioId,
  onSelectScenario,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Виберіть інцидент для розслідування (Демо-пісочниця)
          </h2>
          <p className="text-xs text-slate-500">
            Реальні сценарії розподілених збоїв із взаємоповʼязаними логами 3-4 мікросервісів та кодом
          </p>
        </div>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Миттєвий аналіз (0 токенів)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DEMO_SCENARIOS.map((sc) => {
          const isSelected = sc.id === selectedScenarioId;
          const isSev1 = sc.severity === 'SEV-1';

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-cyan-500/70 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Subtle top indicator bar */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500" />
              )}

              {/* Severity badge & Duration */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border font-mono ${
                    isSev1
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  {sc.severity}
                </span>

                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {sc.duration}
                </span>
              </div>

              {/* Title */}
              <h3 className={`text-sm font-bold line-clamp-1 mb-1 transition-colors ${
                isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
              }`}>
                {sc.title}
              </h3>

              {/* Subtitle */}
              <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                {sc.subtitle}
              </p>

              {/* Impact stats */}
              <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{sc.affectedUsers}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{sc.financialImpact}</span>
                </div>
              </div>

              {/* Microservice Badges */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {sc.services.map((srv) => (
                  <span
                    key={srv.id}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${srv.badgeBg} ${srv.badgeText}`}
                  >
                    {srv.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
