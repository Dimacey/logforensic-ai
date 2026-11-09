/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Copy, Check, Printer, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Sparkles, Download } from 'lucide-react';
import { SrePostMortem } from '../types/forensic';
import { executeReportPrint } from '../utils/printReport';

interface PostMortemReportProps {
  postMortem: SrePostMortem;
}

export const PostMortemReport: React.FC<PostMortemReportProps> = ({ postMortem }) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [actionItems, setActionItems] = useState(postMortem.actionItems);

  // Sync action items when scenario changes
  React.useEffect(() => {
    setActionItems(postMortem.actionItems);
  }, [postMortem]);

  const handleToggleStatus = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let nextStatus: 'To Do' | 'In Progress' | 'Done' = 'To Do';
          if (item.status === 'To Do') nextStatus = 'In Progress';
          else if (item.status === 'In Progress') nextStatus = 'Done';
          else nextStatus = 'To Do';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const generateMarkdown = (): string => {
    return `# ${postMortem.title}
**Рівень критичності:** ${postMortem.severity}
**Дата інциденту:** ${postMortem.date}
**Час простою (Downtime):** ${postMortem.downtimeDuration}
**Час виявлення:** ${postMortem.detectionTime}
**Відповідальний розслідувач:** ${postMortem.leadInvestigator}

---

## 1. Резюме та бізнес-вплив (Executive Summary)
${postMortem.impactSummary}

## 2. Справжня першопричина (Root Cause Analysis)
${postMortem.rootCauseAnalysis}

## 3. Подія-тригер (Trigger Event)
${postMortem.triggerEvent}

## 4. Масштаб ураження (Blast Radius)
${postMortem.blastRadius}

---

## 5. Засвоєні уроки (Lessons Learned)

### Що спрацювало добре:
${postMortem.lessonsLearned.whatWentWell.map((w) => `- ${w}`).join('\n')}

### Що пішло не так:
${postMortem.lessonsLearned.whatWentWrong.map((w) => `- ${w}`).join('\n')}

### Де нам пощастило:
${postMortem.lessonsLearned.whereWeGotLucky.map((w) => `- ${w}`).join('\n')}

---

## 6. План коригувальних дій (Action Items)

| Пріоритет | Завдання | Тип | Відповідальний | Статус |
|:---|:---|:---|:---|:---|
${actionItems
  .map(
    (item) =>
      `| **${item.priority}** | ${item.task} | ${item.type} | ${item.owner} | ${item.status} |`
  )
  .join('\n')}

---
*Звіт згенеровано аналітичною платформою LogForensic AI (Google SRE Framework)*
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 1500);
  };

  const handlePrintOrDownload = () => {
    executeReportPrint({
      ...postMortem,
      actionItems,
    });
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl print-page">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
              Google SRE Standard
            </span>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono ${
                postMortem.severity === 'SEV-1'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {postMortem.severity}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {postMortem.title}
          </h2>
        </div>

        <div className="flex items-center gap-2.5 no-print shrink-0 flex-wrap">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            {copiedMd ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Скопійовано Markdown!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>Копіювати для GitHub/Jira</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrintOrDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
            title="Завантажити звіт та відкрити для друку/збереження у PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Друк / Зберегти у PDF</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-fade-in no-print">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Звіт сформовано та завантажено!</strong> Файл звіту на білому бланку готовий. Якщо браузер не показав вікно друку через обмеження iframe, відкрийте завантажений файл і збережіть як PDF (<kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-white">Ctrl+P</kbd>).
            </span>
          </div>
        </div>
      )}

      {/* Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-8 font-mono text-xs">
        <div>
          <div className="text-slate-500 text-[11px] uppercase">Дата інциденту</div>
          <div className="text-slate-200 font-bold mt-0.5">{postMortem.date}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[11px] uppercase">Час простою (Downtime)</div>
          <div className="text-rose-400 font-bold mt-0.5">{postMortem.downtimeDuration}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[11px] uppercase">Час виявлення</div>
          <div className="text-cyan-400 font-bold mt-0.5">{postMortem.detectionTime}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[11px] uppercase">Провідний слідчий</div>
          <div className="text-slate-200 font-bold mt-0.5 truncate">{postMortem.leadInvestigator}</div>
        </div>
      </div>

      {/* Section 1: Executive Summary */}
      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        <div>
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            1. Резюме інциденту та бізнес-вплив (Executive Summary)
          </h3>
          <p className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 text-slate-200">
            {postMortem.impactSummary}
          </p>
        </div>

        {/* Section 2: Root Cause & Trigger */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1.5">
              2. Справжня першопричина (Root Cause)
            </h4>
            <p className="text-slate-200 font-medium">
              {postMortem.rootCauseAnalysis}
            </p>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              3. Подія-тригер (Trigger Event)
            </h4>
            <p className="text-slate-200 font-medium">
              {postMortem.triggerEvent}
            </p>
          </div>
        </div>

        {/* Section 3: Lessons Learned */}
        <div>
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            4. Засвоєні уроки (Lessons Learned)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* What Went Well */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4">
              <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Що спрацювало добре
              </h5>
              <ul className="space-y-2 text-xs text-slate-300">
                {postMortem.lessonsLearned.whatWentWell.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What Went Wrong */}
            <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-4">
              <h5 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                Що пішло не так
              </h5>
              <ul className="space-y-2 text-xs text-slate-300">
                {postMortem.lessonsLearned.whatWentWrong.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Where We Got Lucky */}
            <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4">
              <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Де нам пощастило
              </h5>
              <ul className="space-y-2 text-xs text-slate-300">
                {postMortem.lessonsLearned.whereWeGotLucky.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4: Action Items */}
        <div>
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            5. План коригувальних дій (Action Items & Mitigations)
          </h3>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Пріоритет</th>
                    <th className="py-2.5 px-4 font-semibold">Завдання</th>
                    <th className="py-2.5 px-4 font-semibold">Тип</th>
                    <th className="py-2.5 px-4 font-semibold">Відповідальний</th>
                    <th className="py-2.5 px-4 font-semibold flex items-center gap-1">
                      <span>Статус</span>
                      <span className="text-[9px] text-cyan-400 font-normal no-print">(клікабельно)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {actionItems.map((action) => (
                    <tr key={action.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            action.priority === 'P0'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {action.priority}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-xs font-medium max-w-md transition-all ${
                        action.status === 'Done' ? 'text-slate-500 line-through' : 'text-slate-200'
                      }`}>
                        {action.task}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {action.type}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {action.owner}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(action.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold font-mono border transition-all cursor-pointer select-none ${
                            action.status === 'Done'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-sm'
                              : action.status === 'In Progress'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300'
                          }`}
                          title="Клікніть, щоб змінити статус: To Do ➔ In Progress ➔ Done"
                        >
                          {action.status === 'Done' && <Check className="w-3 h-3 text-emerald-400" />}
                          {action.status === 'In Progress' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                          {action.status === 'To Do' && <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                          <span>{action.status}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
