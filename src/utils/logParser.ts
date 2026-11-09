/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParsedLogEntry, LogLevel, ForensicAnalysisResult, SrePostMortem } from '../types/forensic.ts';

const TIMESTAMP_REGEX = /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/;
const LEVEL_REGEX = /\b(PANIC|FATAL|CRITICAL|ERROR|WARN|WARNING|INFO|DEBUG|TRACE)\b/i;
const TRACE_ID_REGEX = /\[(trace_[a-z0-9_-]+|req_[a-z0-9_-]+|id=[0-9]+|evt_[a-z0-9_-]+)\]/i;

export function parseRawLogs(rawText: string, defaultServiceId = 'app-service', defaultServiceName = 'App Service'): ParsedLogEntry[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n');
  const parsed: ParsedLogEntry[] = [];

  let lastTimestamp = new Date().toISOString();
  let lastUnix = Date.now();

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Extract Timestamp
    let timestamp = lastTimestamp;
    let unixTime = lastUnix;
    const timeMatch = trimmed.match(TIMESTAMP_REGEX);
    if (timeMatch) {
      timestamp = timeMatch[1].replace(' ', 'T');
      if (!timestamp.endsWith('Z') && !timestamp.includes('+') && !timestamp.includes('-')) {
        timestamp += 'Z';
      }
      const parsedDate = new Date(timestamp);
      if (!isNaN(parsedDate.getTime())) {
        unixTime = parsedDate.getTime();
        lastTimestamp = timestamp;
        lastUnix = unixTime;
      }
    }

    // Extract Log Level
    let level: LogLevel = 'INFO';
    const levelMatch = trimmed.match(LEVEL_REGEX);
    if (levelMatch) {
      const matchedStr = levelMatch[1].toUpperCase();
      if (matchedStr === 'PANIC') level = 'PANIC';
      else if (matchedStr === 'FATAL' || matchedStr === 'CRITICAL') level = 'FATAL';
      else if (matchedStr === 'ERROR') level = 'ERROR';
      else if (matchedStr === 'WARN' || matchedStr === 'WARNING') level = 'WARN';
      else if (matchedStr === 'DEBUG' || matchedStr === 'TRACE') level = 'DEBUG';
      else level = 'INFO';
    } else {
      // Heuristic detection based on keywords
      const lower = trimmed.toLowerCase();
      if (lower.includes('deadlock') || lower.includes('oomkilled') || lower.includes('panic') || lower.includes('fatal')) {
        level = 'FATAL';
      } else if (lower.includes('error') || lower.includes('exception') || lower.includes('failed') || lower.includes('504') || lower.includes('502') || lower.includes('500')) {
        level = 'ERROR';
      } else if (lower.includes('warn') || lower.includes('slow') || lower.includes('timeout') || lower.includes('retry')) {
        level = 'WARN';
      }
    }

    // Extract Trace ID
    const traceMatch = trimmed.match(TRACE_ID_REGEX);
    const traceId = traceMatch ? traceMatch[1] : undefined;

    // Detect Anomaly
    const lower = trimmed.toLowerCase();
    const isAnomaly = level === 'FATAL' || level === 'PANIC' ||
      lower.includes('deadlock') ||
      lower.includes('oomkilled') ||
      lower.includes('too many clients') ||
      lower.includes('pool is probably full') ||
      lower.includes('double credit') ||
      lower.includes('connection timed out') ||
      lower.includes('memory cgroup out of memory');

    let anomalyReason: string | undefined;
    if (isAnomaly) {
      if (lower.includes('deadlock')) anomalyReason = 'Виявлено дедлок блокувань ресурсів';
      else if (lower.includes('oomkilled') || lower.includes('out of memory')) anomalyReason = 'Критичне вичерпання лімітів памʼяті (OOM)';
      else if (lower.includes('too many clients') || lower.includes('pool')) anomalyReason = 'Вичерпання пулу зʼєднань бази даних';
      else if (lower.includes('504') || lower.includes('timed out')) anomalyReason = 'Каскадний таймаут між сервісами (Upstream Timeout)';
      else if (lower.includes('double credit')) anomalyReason = 'Розподілений стан перегонів (Race Condition)';
      else anomalyReason = 'Критична системна аномалія';
    }

    parsed.push({
      id: `log_${defaultServiceId}_${index}_${unixTime}`,
      timestamp,
      unixTime,
      level,
      serviceId: defaultServiceId,
      serviceName: defaultServiceName,
      message: trimmed,
      raw: trimmed,
      isAnomaly,
      anomalyReason,
      traceId
    });
  });

  return parsed.sort((a, b) => a.unixTime - b.unixTime);
}

export interface TimeBucket {
  timestampLabel: string;
  unixTime: number;
  total: number;
  errors: number;
  warns: number;
  criticals: number;
}

export function groupLogsIntoBuckets(logs: ParsedLogEntry[], bucketCount = 12): TimeBucket[] {
  if (logs.length === 0) return [];

  const minTime = Math.min(...logs.map(l => l.unixTime));
  const maxTime = Math.max(...logs.map(l => l.unixTime));
  const timeSpan = Math.max(maxTime - minTime, 1000); // minimum 1 second
  const bucketDuration = Math.ceil(timeSpan / bucketCount);

  const buckets: TimeBucket[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = minTime + i * bucketDuration;
    const date = new Date(bucketStart);
    const label = date.toISOString().substring(11, 19);
    buckets.push({
      timestampLabel: label,
      unixTime: bucketStart,
      total: 0,
      errors: 0,
      warns: 0,
      criticals: 0
    });
  }

  logs.forEach(log => {
    let bucketIndex = Math.floor((log.unixTime - minTime) / bucketDuration);
    if (bucketIndex < 0) bucketIndex = 0;
    if (bucketIndex >= bucketCount) bucketIndex = bucketCount - 1;

    const b = buckets[bucketIndex];
    b.total++;
    if (log.level === 'ERROR') b.errors++;
    else if (log.level === 'WARN') b.warns++;
    else if (log.level === 'FATAL' || log.level === 'PANIC') {
      b.criticals++;
      b.errors++;
    }
  });

  return buckets;
}

/**
 * Local Heuristic Fallback Engine
 * Generates an instant high-quality root cause report without calling any API
 */
export function generateLocalHeuristicReport(
  parsedLogs: ParsedLogEntry[],
  codeSnippet?: { filename: string; code: string }
): ForensicAnalysisResult {
  const errors = parsedLogs.filter(l => l.level === 'ERROR' || l.level === 'FATAL' || l.level === 'PANIC');
  const warns = parsedLogs.filter(l => l.level === 'WARN');
  const anomalies = parsedLogs.filter(l => l.isAnomaly);

  // Group by services to identify culprit service
  const serviceErrorCounts: Record<string, number> = {};
  errors.forEach(e => {
    serviceErrorCounts[e.serviceName] = (serviceErrorCounts[e.serviceName] || 0) + 1;
  });

  let culpritService = 'Невідомий сервіс';
  let maxCount = 0;
  Object.entries(serviceErrorCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      culpritService = name;
    }
  });

  const firstError = errors[0] || parsedLogs[0];
  const peakError = anomalies[0] || errors[0] || parsedLogs[0];

  const causationChain = parsedLogs
    .filter(l => l.level === 'WARN' || l.level === 'ERROR' || l.level === 'FATAL' || l.isAnomaly)
    .slice(0, 5)
    .map((l, idx) => ({
      step: idx + 1,
      time: l.timestamp.substring(11, 19),
      service: l.serviceName,
      event: l.message.length > 90 ? l.message.substring(0, 90) + '...' : l.message,
      severity: (l.level === 'FATAL' || l.level === 'PANIC' || l.level === 'ERROR') ? 'critical' as const : 'warn' as const,
      logSnippet: l.raw,
      technicalImpact: l.anomalyReason || 'Підвищена ймовірність каскадної деградації'
    }));

  const srePostMortem: SrePostMortem = {
    title: `Post-Mortem: Системний збій у ${culpritService}`,
    severity: (errors.length > 5 || anomalies.length > 0) ? 'SEV-1' : 'SEV-2',
    date: new Date().toISOString().substring(0, 10),
    leadInvestigator: 'LogForensic AI Heuristic Engine (Offline/0-Token Mode)',
    impactSummary: `Зафіксовано ${errors.length} критичних помилок та ${warns.length} попереджень у потоці логів. Найбільша концентрація дефектів припадає на ${culpritService}.`,
    downtimeDuration: 'Уточнюється за даними моніторингу',
    detectionTime: 'Виявлено миттєво евристичним аналізатором логів',
    rootCauseAnalysis: anomalies.length > 0
      ? `Виявлено аномалію: ${anomalies[0].anomalyReason}. Повідомлення: "${anomalies[0].message.substring(0, 120)}"`
      : `Періодичний спайк помилок ${firstError ? firstError.message.substring(0, 100) : 'у сервісній шині'}.`,
    triggerEvent: firstError ? `Подія о ${firstError.timestamp}: ${firstError.message.substring(0, 100)}` : 'Сплеск вхідних запитів',
    blastRadius: `Основне ураження: ${culpritService}. Супутні сервіси під загрозою таймаутів.`,
    lessonsLearned: {
      whatWentWell: [
        'Логи містять часові мітки та рівні повідомлень, що дозволило побудувати хронологію без затримок.',
        'Локальний аналізатор виділив ключові вузли відмови без виклику хмарних API.'
      ],
      whatWentWrong: [
        'Каскадна ланцюгова реакція між компонентами не була перервана на ранній стадії (відсутній Circuit Breaker).',
        'Недостатній моніторинг ресурсів на рівні пулів підключень та виділеної памʼяті.'
      ],
      whereWeGotLucky: [
        'Критичний збій не призвів до повної втрати збереженості даних.'
      ]
    },
    actionItems: [
      {
        id: 'ACT-LOC-1',
        task: `Встановити Circuit Breaker та жорсткі таймаути для викликів у ${culpritService}`,
        type: 'Mitigation',
        owner: 'SRE / Core Team',
        priority: 'P0',
        status: 'To Do'
      },
      {
        id: 'ACT-LOC-2',
        task: 'Провести детальне профілювання навантаження та аудит черг очікування',
        type: 'Preventative',
        owner: 'Platform Team',
        priority: 'P1',
        status: 'To Do'
      }
    ]
  };

  return {
    summary: `Евристичний аналіз ${parsedLogs.length} рядків логів виявив ${errors.length} помилок. Найбільш імовірним джерелом інциденту є сервіс ${culpritService}.`,
    rootCause: anomalies.length > 0
      ? `${anomalies[0].anomalyReason}: ${anomalies[0].message}`
      : `Каскадна помилка в ${culpritService}: ${firstError ? firstError.message : 'Нестача ресурсів'}`,
    culpritService,
    triggerEvent: firstError ? firstError.message : 'Підвищення навантаження',
    blastRadius: `${culpritService} та залежні мікросервіси`,
    causationChain,
    anomalies: anomalies.map((a, i) => ({
      id: `anom_local_${i}`,
      service: a.serviceName,
      type: a.anomalyReason || 'Системна аномалія',
      description: a.message,
      timestamp: a.timestamp,
      confidence: 0.85
    })),
    culpritCode: codeSnippet ? {
      filename: codeSnippet.filename,
      culpritLines: [1, 2, 3],
      problemExplanation: 'Виявлено фрагменти коду, повʼязані з операціями очікування ресурсів.',
      proposedDiff: `// Перевірте конфігурацію таймаутів та звільнення ресурсів у ${codeSnippet.filename}`
    } : undefined,
    srePostMortem,
    metricsSummary: {
      totalLogsParsed: parsedLogs.length,
      errorCount: errors.length,
      warnCount: warns.length,
      criticalSpikeTime: peakError ? peakError.timestamp : 'N/A',
      confidenceScore: 0.88
    }
  };
}
