/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Clock, 
  GitCommit, 
  FileCode2, 
  FileText, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Cpu, 
  RefreshCw 
} from 'lucide-react';

import { 
  IncidentScenario, 
  ForensicAnalysisResult, 
  AnalysisEngineMode, 
  ParsedLogEntry, 
  LogStreamInput, 
  SourceCodeFile 
} from './types/forensic';
import { DEMO_SCENARIOS } from './data/demoScenarios';
import { parseRawLogs } from './utils/logParser';
import { executeReportPrint } from './utils/printReport';
import { getStoredApiKey, requestForensicAnalysis } from './services/apiClient';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ScenarioSelector } from './components/ScenarioSelector';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { CausationFlow } from './components/CausationFlow';
import { CodeCulpritViewer } from './components/CodeCulpritViewer';
import { PostMortemReport } from './components/PostMortemReport';
import { MitigationPatchViewer } from './components/MitigationPatchViewer';
import { CustomLogUploader } from './components/CustomLogUploader';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'custom'>('sandbox');
  const [selectedScenario, setSelectedScenario] = useState<IncidentScenario>(DEMO_SCENARIOS[0]);
  const [currentAnalysis, setCurrentAnalysis] = useState<ForensicAnalysisResult>(DEMO_SCENARIOS[0].precomputedAnalysis);
  const [engineMode, setEngineMode] = useState<AnalysisEngineMode>('demo-sandbox');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasByokKey, setHasByokKey] = useState(false);
  const [isByokModalOpen, setIsByokModalOpen] = useState(false);
  const [cascadeNote, setCascadeNote] = useState<string | null>(null);

  // Sub-navigation inside forensic investigation
  const [subTab, setSubTab] = useState<'timeline' | 'causation' | 'code' | 'postmortem' | 'patch'>('timeline');

  // Check stored API key on mount
  useEffect(() => {
    const key = getStoredApiKey();
    setHasByokKey(Boolean(key));
  }, []);

  // Compute parsed logs for currently active scenario
  const scenarioParsedLogs = useMemo(() => {
    return selectedScenario.logStreams.flatMap((stream) =>
      parseRawLogs(stream.rawLogs, stream.serviceId, stream.serviceName)
    );
  }, [selectedScenario]);

  const [activeParsedLogs, setActiveParsedLogs] = useState<ParsedLogEntry[]>(scenarioParsedLogs);

  // Sync logs when scenario changes in sandbox mode
  useEffect(() => {
    if (activeTab === 'sandbox') {
      setActiveParsedLogs(scenarioParsedLogs);
      setCurrentAnalysis(selectedScenario.precomputedAnalysis);
      setEngineMode('demo-sandbox');
      setCascadeNote(null);
    }
  }, [selectedScenario, activeTab, scenarioParsedLogs]);

  // Handle Scenario selection in Sandbox
  const handleSelectScenario = (scenario: IncidentScenario) => {
    setSelectedScenario(scenario);
  };

  // Handle custom logs analysis
  const handleStartCustomAnalysis = async (streams: LogStreamInput[], code?: SourceCodeFile) => {
    setIsAnalyzing(true);
    setCascadeNote(null);

    // Pre-parse logs on client immediately for real-time visualization
    const parsed = streams.flatMap((stream) =>
      parseRawLogs(stream.rawLogs, stream.serviceId, stream.serviceName)
    );
    setActiveParsedLogs(parsed);

    try {
      const response = await requestForensicAnalysis({
        logs: streams,
        sourceCode: code ? { filename: code.filename, code: code.code } : undefined,
      });

      if (response.success && response.result) {
        setCurrentAnalysis(response.result);
        setEngineMode(response.modelUsed);
        if (response.cascadeNote) {
          setCascadeNote(response.cascadeNote);
        }
      }
    } catch (err: any) {
      console.error('Custom analysis failed:', err);
      setCascadeNote(`Помилка аналізу: ${err?.message || 'Невідомий збій'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset session
  const handleResetSession = () => {
    setSelectedScenario(DEMO_SCENARIOS[0]);
    setCurrentAnalysis(DEMO_SCENARIOS[0].precomputedAnalysis);
    setActiveParsedLogs(
      DEMO_SCENARIOS[0].logStreams.flatMap((stream) =>
        parseRawLogs(stream.rawLogs, stream.serviceId, stream.serviceName)
      )
    );
    setActiveTab('sandbox');
    setSubTab('timeline');
    setEngineMode('demo-sandbox');
    setCascadeNote(null);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasByokKey={hasByokKey}
          onOpenByokModal={() => setIsByokModalOpen(true)}
          engineMode={engineMode}
          onResetSession={handleResetSession}
          onPrintReport={() => {
            executeReportPrint(currentAnalysis.srePostMortem);
            setCascadeNote('📄 Звіт успішно сформовано та завантажено на ваш пристрій! Відкрийте файл у браузері для друку або збереження в PDF.');
            setTimeout(() => setCascadeNote(null), 5000);
          }}
        />

        {/* Cascade or Notification Banner */}
        {cascadeNote && (
          <div className="bg-emerald-950/60 border-b border-emerald-500/40 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between no-print animate-fade-in">
            <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cascadeNote}</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* View mode 1: Sandbox Demo */}
          {activeTab === 'sandbox' && (
            <div className="space-y-6 animate-fade-in">
              <ScenarioSelector
                selectedScenarioId={selectedScenario.id}
                onSelectScenario={handleSelectScenario}
              />

              {/* Sub-Tabs Navigation for Forensic Artifacts */}
              <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold no-print">
                <button
                  onClick={() => setSubTab('timeline')}
                  className={`px-3.5 py-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
                    subTab === 'timeline'
                      ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Таймлайн & Спайки</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                    {activeParsedLogs.length}
                  </span>
                </button>

                <button
                  onClick={() => setSubTab('causation')}
                  className={`px-3.5 py-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
                    subTab === 'causation'
                      ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Ланцюг причинності</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                    {currentAnalysis.causationChain?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setSubTab('code')}
                  className={`px-3.5 py-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
                    subTab === 'code'
                      ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Вихідний код дефекту</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
                    {selectedScenario.sourceCode.filename.split('/').pop()}
                  </span>
                </button>

                <button
                  onClick={() => setSubTab('postmortem')}
                  className={`px-3.5 py-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
                    subTab === 'postmortem'
                      ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>SRE Post-Mortem звіт</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                    Google SRE
                  </span>
                </button>

                {currentAnalysis.mitigationConfigPatch && (
                  <button
                    onClick={() => setSubTab('patch')}
                    className={`px-3.5 py-2 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
                      subTab === 'patch'
                        ? 'border-cyan-400 text-cyan-300 bg-slate-900/80'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Інфра-патч</span>
                  </button>
                )}
              </div>

              {/* Sub-Tab Contents */}
              <div className="space-y-6">
                {subTab === 'timeline' && (
                  <TimelineVisualizer
                    logs={activeParsedLogs}
                    services={selectedScenario.services}
                    criticalSpikeTime={currentAnalysis.metricsSummary?.criticalSpikeTime}
                  />
                )}

                {subTab === 'causation' && (
                  <CausationFlow analysis={currentAnalysis} />
                )}

                {subTab === 'code' && (
                  <CodeCulpritViewer
                    sourceCode={selectedScenario.sourceCode}
                    culpritDiff={currentAnalysis.culpritCode?.proposedDiff}
                    problemExplanation={currentAnalysis.culpritCode?.problemExplanation}
                  />
                )}

                {subTab === 'postmortem' && (
                  <PostMortemReport postMortem={currentAnalysis.srePostMortem} />
                )}

                {subTab === 'patch' && (
                  <MitigationPatchViewer patch={currentAnalysis.mitigationConfigPatch} />
                )}
              </div>
            </div>
          )}

          {/* View mode 2: Custom Log Uploader (BYOK / Power User) */}
          {activeTab === 'custom' && (
            <div className="space-y-6 animate-fade-in">
              <CustomLogUploader
                onStartAnalysis={handleStartCustomAnalysis}
                isAnalyzing={isAnalyzing}
                hasByokKey={hasByokKey}
                onOpenByokModal={() => setIsByokModalOpen(true)}
              />

              {/* Display analysis results if available */}
              {activeParsedLogs.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Результати аналізу інциденту
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      Оброблено записів: {activeParsedLogs.length}
                    </span>
                  </div>

                  <TimelineVisualizer
                    logs={activeParsedLogs}
                    services={[
                      {
                        id: 'service_1',
                        name: 'Сервіс 1',
                        type: 'node',
                        color: '#6366f1',
                        badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
                        badgeText: 'text-indigo-400',
                        description: 'Користувацький потік',
                      },
                      {
                        id: 'service_2',
                        name: 'Сервіс 2',
                        type: 'postgres',
                        color: '#06b6d4',
                        badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
                        badgeText: 'text-cyan-400',
                        description: 'Користувацький потік',
                      },
                    ]}
                    criticalSpikeTime={currentAnalysis.metricsSummary?.criticalSpikeTime}
                  />

                  <CausationFlow analysis={currentAnalysis} />

                  <PostMortemReport postMortem={currentAnalysis.srePostMortem} />
                </div>
              )}
            </div>
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">LogForensic AI</span>
              <span>— комерційна платформа SRE форензік-аналізу на базі Gemini 3.8 Flash</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Ліцензія MIT</span>
              <span>•</span>
              <span>Розгортання: Google Cloud Run</span>
              <span>•</span>
              <button
                onClick={() => setIsByokModalOpen(true)}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                BYOK Налаштування
              </button>
            </div>
          </div>
        </footer>

        {/* BYOK Modal */}
        <ApiKeyModal
          isOpen={isByokModalOpen}
          onClose={() => setIsByokModalOpen(false)}
          onKeyChanged={(hasKey) => setHasByokKey(hasKey)}
        />
      </div>
    </ErrorBoundary>
  );
}
