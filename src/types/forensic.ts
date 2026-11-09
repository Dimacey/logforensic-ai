/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeverityLevel = 'SEV-1' | 'SEV-2' | 'SEV-3';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'PANIC';

export interface ServiceDefinition {
  id: string;
  name: string;
  type: 'nginx' | 'k8s' | 'postgres' | 'redis' | 'node' | 'python' | 'go' | 'gateway';
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export interface ParsedLogEntry {
  id: string;
  timestamp: string;
  unixTime: number;
  level: LogLevel;
  serviceId: string;
  serviceName: string;
  message: string;
  raw: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
  traceId?: string;
}

export interface LogStreamInput {
  serviceId: string;
  serviceName: string;
  rawLogs: string;
}

export interface SourceCodeFile {
  filename: string;
  language: string;
  code: string;
  culpritStartLine?: number;
  culpritEndLine?: number;
  problemExplanation?: string;
  fixedCode?: string;
}

export interface CausationStep {
  step: number;
  time: string;
  service: string;
  event: string;
  severity: 'info' | 'warn' | 'critical';
  logSnippet?: string;
  technicalImpact: string;
}

export interface SrePostMortem {
  title: string;
  severity: SeverityLevel;
  date: string;
  leadInvestigator: string;
  impactSummary: string;
  downtimeDuration: string;
  detectionTime: string;
  rootCauseAnalysis: string;
  triggerEvent: string;
  blastRadius: string;
  lessonsLearned: {
    whatWentWell: string[];
    whatWentWrong: string[];
    whereWeGotLucky: string[];
  };
  actionItems: {
    id: string;
    task: string;
    type: 'Preventative' | 'Mitigation' | 'Monitoring';
    owner: string;
    priority: 'P0' | 'P1' | 'P2';
    status: 'To Do' | 'In Progress' | 'Done';
  }[];
}

export interface ForensicAnalysisResult {
  summary: string;
  rootCause: string;
  culpritService: string;
  triggerEvent: string;
  blastRadius: string;
  causationChain: CausationStep[];
  anomalies: {
    id: string;
    service: string;
    type: string;
    description: string;
    timestamp: string;
    confidence: number;
  }[];
  culpritCode?: {
    filename: string;
    culpritLines: number[];
    problemExplanation: string;
    proposedDiff: string;
  };
  srePostMortem: SrePostMortem;
  mitigationConfigPatch?: {
    filename: string;
    content: string;
    language: string;
    explanation: string;
  };
  metricsSummary: {
    totalLogsParsed: number;
    errorCount: number;
    warnCount: number;
    criticalSpikeTime: string;
    confidenceScore: number;
  };
}

export interface IncidentScenario {
  id: string;
  title: string;
  subtitle: string;
  severity: SeverityLevel;
  duration: string;
  affectedUsers: string;
  financialImpact: string;
  services: ServiceDefinition[];
  logStreams: LogStreamInput[];
  sourceCode: SourceCodeFile;
  precomputedAnalysis: ForensicAnalysisResult;
}

export type AnalysisEngineMode = 'demo-sandbox' | 'gemini-3.8-flash' | 'gemini-flash-latest' | 'gemini-3.1-flash-lite' | 'local-heuristic';

export interface AnalysisState {
  isAnalyzing: boolean;
  engineMode: AnalysisEngineMode;
  error: string | null;
  result: ForensicAnalysisResult | null;
  parsedLogs: ParsedLogEntry[];
  analyzedAt: string | null;
  tokensProcessedEstimate: number;
}
