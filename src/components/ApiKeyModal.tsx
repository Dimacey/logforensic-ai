/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Zap, X, Trash2 } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, pingApiKey } from '../services/apiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChanged: (hasKey: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyChanged }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; model?: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      setApiKeyInput(stored);
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKeyInput);
    setSavedSuccess(true);
    onKeyChanged(Boolean(apiKeyInput.trim()));
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKeyInput('');
    setTestResult(null);
    onKeyChanged(false);
  };

  const handlePingTest = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ success: false, message: 'Введіть ключ перед тестуванням' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await pingApiKey(apiKeyInput.trim());
      setTestResult({
        success: res.success,
        model: res.model,
        message: res.success ? `Зʼєднання успішне! Модель: ${res.model} відповіла (PONG)` : res.message,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Помилка зʼєднання з сервером перевірки',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in isolation: isolate">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent gradient */}
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Власний ключ (BYOK)
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Guest Strict Mode
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Підключення персонального Gemini API Key для приватних логів</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Закрити (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Privacy & Zero-Token Notice */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-emerald-300">Повна безпека та 0 витрат автора:</p>
              <p className="text-slate-400 leading-relaxed">
                Всі вбудовані інтерактивні демо-інциденти працюють на клієнті абсолютно безкоштовно без витрати токенів.
                Для аналізу <span className="text-slate-200 font-medium">ваших власних логів та коду</span> підключіть безкоштовний ключ. Він зберігається суворо в <code className="text-cyan-300">localStorage</code> вашого браузера.
              </p>
            </div>
          </div>

          {/* Key Input Field */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Gemini API Key (Google AI Studio)</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium hover:underline"
              >
                Отримати безкоштовно за 30 сек
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 pr-20 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-mono text-white placeholder-slate-500 transition-all outline-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                  title={showKey ? 'Приховати ключ' : 'Показати ключ'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Ping test status */}
          {testResult && (
            <div
              className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-mono">{testResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePingTest}
                disabled={isTesting || !apiKeyInput.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-colors border border-slate-700 cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Тестування...' : 'Перевірити зʼєднання'}
              </button>

              {apiKeyInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Очистити збережений ключ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Видалити
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Збережено!
                  </>
                ) : (
                  'Зберегти ключ'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
