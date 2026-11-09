/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SrePostMortem } from '../types/forensic';

export function generatePrintableHtml(postMortem: SrePostMortem): string {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>${postMortem.title} — SRE Incident Post-Mortem Report</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.6;
      font-size: 13px;
      margin: 0;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
      text-transform: uppercase;
      margin-right: 8px;
    }
    .sev1 { background: #ffe4e6; color: #e11d48; border: 1px solid #fda4af; }
    .sev2 { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
    .standard { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
    h1 {
      font-size: 20px;
      margin: 10px 0 4px 0;
      color: #0f172a;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .meta-label {
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .meta-val {
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    h2 {
      font-size: 15px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .lessons-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .lesson-col {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
      font-size: 11.5px;
    }
    .lesson-col h3 {
      font-size: 11.5px;
      margin-top: 0;
      margin-bottom: 8px;
      text-transform: uppercase;
      font-weight: 700;
    }
    .table-container {
      margin-top: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
    }
    .p0 { color: #e11d48; font-weight: bold; }
    .p1 { color: #d97706; font-weight: bold; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge standard">Google SRE Framework</span>
      <span class="badge ${postMortem.severity === 'SEV-1' ? 'sev1' : 'sev2'}">${postMortem.severity}</span>
    </div>
    <h1>${postMortem.title}</h1>
    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Платформа розслідувань LogForensic AI (Zero-Shot System Forensic)</div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="meta-label">Дата інциденту</div>
      <div class="meta-val">${postMortem.date}</div>
    </div>
    <div>
      <div class="meta-label">Час простою (Downtime)</div>
      <div class="meta-val" style="color: #e11d48;">${postMortem.downtimeDuration}</div>
    </div>
    <div>
      <div class="meta-label">Час виявлення</div>
      <div class="meta-val" style="color: #0284c7;">${postMortem.detectionTime}</div>
    </div>
    <div>
      <div class="meta-label">Відповідальний розслідувач</div>
      <div class="meta-val">${postMortem.leadInvestigator}</div>
    </div>
  </div>

  <h2>1. Резюме та бізнес-вплив (Executive Summary)</h2>
  <div class="box">${postMortem.impactSummary}</div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div>
      <h2>2. Справжня першопричина (Root Cause)</h2>
      <div class="box">${postMortem.rootCauseAnalysis}</div>
    </div>
    <div>
      <h2>3. Подія-тригер (Trigger Event)</h2>
      <div class="box">${postMortem.triggerEvent}</div>
    </div>
  </div>

  <h2>4. Засвоєні уроки (Lessons Learned)</h2>
  <div class="lessons-grid">
    <div class="lesson-col" style="border-left: 3px solid #10b981;">
      <h3 style="color: #059669;">Що спрацювало добре</h3>
      <ul style="padding-left: 16px; margin: 0;">
        ${postMortem.lessonsLearned.whatWentWell.map(w => `<li>${w}</li>`).join('')}
      </ul>
    </div>
    <div class="lesson-col" style="border-left: 3px solid #f43f5e;">
      <h3 style="color: #e11d48;">Що пішло не так</h3>
      <ul style="padding-left: 16px; margin: 0;">
        ${postMortem.lessonsLearned.whatWentWrong.map(w => `<li>${w}</li>`).join('')}
      </ul>
    </div>
    <div class="lesson-col" style="border-left: 3px solid #06b6d4;">
      <h3 style="color: #0891b2;">Де нам пощастило</h3>
      <ul style="padding-left: 16px; margin: 0;">
        ${postMortem.lessonsLearned.whereWeGotLucky.map(w => `<li>${w}</li>`).join('')}
      </ul>
    </div>
  </div>

  <h2>5. План коригувальних дій (Action Items & Mitigations)</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 70px;">Пріоритет</th>
          <th>Завдання</th>
          <th style="width: 100px;">Тип</th>
          <th style="width: 140px;">Відповідальний</th>
          <th style="width: 90px;">Статус</th>
        </tr>
      </thead>
      <tbody>
        ${postMortem.actionItems.map(item => `
          <tr>
            <td class="${item.priority === 'P0' ? 'p0' : 'p1'}">${item.priority}</td>
            <td>${item.task}</td>
            <td style="color: #64748b;">${item.type}</td>
            <td>${item.owner}</td>
            <td><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${item.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>Звіт згенеровано: LogForensic AI (Google SRE Incident Response Standard)</div>
    <div>Конфіденційно • Для внутрішнього використання</div>
  </div>

  <script>
    // Спроба автоматичного відкриття діалогу друку, якщо дозволено браузером
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch(e) {}
      }, 500);
    });
  </script>
</body>
</html>`;
}

/**
 * Robust print/export handler:
 * 1. Tries window.print().
 * 2. If blocked by iframe or printer unavailable, automatically downloads the standalone printable HTML/PDF report
 */
export function executeReportPrint(postMortem: SrePostMortem): void {
  // Always trigger file download as guaranteed fallback so user gets a pristine report even without a printer or inside sandbox iframe
  const htmlContent = generatePrintableHtml(postMortem);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Try opening in new window and printing
  let openedWindow: Window | null = null;
  try {
    openedWindow = window.open(url, '_blank');
  } catch (e) {
    console.warn('window.open blocked by iframe sandbox');
  }

  // Also download the file directly so the user has the report on their disk
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = postMortem.title.replace(/[^a-zA-Z0-9а-яА-ЯіІїЇєЄґҐ_-]/g, '_').substring(0, 40);
  a.download = `SRE_PostMortem_${safeTitle}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // If new window opened, trigger print on it, otherwise try in-page print
  if (!openedWindow) {
    try {
      window.print();
    } catch (e) {
      console.warn('window.print failed:', e);
    }
  }

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
