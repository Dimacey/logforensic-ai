# 🛡️ LogForensic AI
### Zero-Shot Distributed System Forensic & SRE Incident Post-Mortem Platform
> **Глибинний реверс-аналіз системних інцидентів, мікросервісних логів та коду на базі наддовгого 2M+ контексту Gemini 3.8 Flash**

[![Ліцензія: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-blue.svg)](https://tailwindcss.com)
[![Gemini API](https://img.shields.io/badge/Gemini-3.8_Flash_2M-purple.svg)](https://aistudio.google.com)
[![Google Cloud Run](https://img.shields.io/badge/Deploy-Cloud_Run-4285F4.svg)](https://cloud.google.com/run)

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/TerehovDV/LogForensicAI.git)

---

## 🎯 Про проект

Більшість сучасних систем моніторингу (Datadog, Dynatrace, CloudWatch) лише констатують факт аварії («HTTP 500 вище 15%»), але **не розуміють вихідного коду** і не можуть знайти мілісекундну причину дедлоку чи витоку пам'яті. Звичайні ШІ-утиліти працюють лише з короткими стек-трейсами.

**LogForensic AI** приймає повний мультисервісний дамп (Nginx, Kubernetes, microservices API, PostgreSQL slow logs) разом із фрагментами вихідного коду і завдяки наддовгому вікну контексту Gemini:
1. 🔍 **Знаходить справжню першопричину (Root Cause)**, розрізняючи симптоми та джерело збою.
2. ⏱️ **Будує ланцюг причинності (Chain of Causation)** з мілісекундною точністю подій (T-0, тригер, ескалація, колапс).
3. 🎯 **Локалізує дефектні рядки у вихідному коді** (анти-патерни блокувань, витоки EventListener, відсутність атомарності локів).
4. 📋 **Генерує офіційний звіт стандарту Google SRE Post-Mortem** (Executive Summary, Trigger, Lessons Learned, Action Items P0/P1) із можливістю експорту в Markdown для GitHub/Jira або друку в чистий білий PDF.
5. 🛠️ **Формує готовий інфраструктурний конфіг-патч** (`postgresql.conf`, k8s manifests, SQL міграції).

---

## 💎 Продуктова формула (Freemium без бар'єрів)

1. **Миттєвий вхід (Перші 10 секунд):**
   - Гість заходить на сайт — усе вже працює в інтерактивній пісочниці на 3 реальних драматичних інцидентах світового рівня:
     - 🛒 **«Каскадний дедлок пулу PostgreSQL у Чорну Пʼятницю» (SEV-1)** — зовнішній виклик еквайрингу всередині незакритої SQL-транзакції.
     - 💬 **«Тихий витік памʼяті WebSocket-кластера та шторм OOMKilled» (SEV-2)** — незнятий слухач Redis EventEmitter при реконнекті.
     - 💳 **«Розподілений стан перегонів (Race Condition) у платіжному Ledger» (SEV-1)** — неатомарний Redis Lock та подвійне списання.
   - **0 витрат токенів автора:** усі демо-сценарії, парсинг логів та евристики працюють на клієнті в браузері.

2. **Power User & Режим захисту ключів (BYOK — Bring Your Own Key):**
   - Для аналізу власних файлів логів та коду користувач вводить свій безкоштовний Gemini API Key.
   - Ключ зберігається виключно в `localStorage` клієнта і передається лише через захищений заголовок `x-gemini-api-key`.
   - Вбудована перевірка з'єднання (Ping Test) в модальному вікні.

3. **Auto-Cascade Quota Guard:**
   - Автоматичний каскадний перехід при вичерпанні лімітів або помилках 429:
     `Gemini 3.8 Flash` ➔ `Gemini Flash Latest` ➔ `Gemini 3.1 Flash-Lite` ➔ `Автономний клієнтський евристичний аналізатор`.
   - Застосунок завжди віддає статус 200 OK і ніколи не падає в білий екран.

---

## 🏗️ Архітектура та стек технологій

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ФРОНТЕНД (React 19 + Vite 8)                    │
│                                                                        │
│  - Справжня гумова верстка (Rubber Layout, isolation: isolate)         │
│  - Tailwind CSS v4 + шрифти JetBrains Mono & Inter                     │
│  - Клієнтський парсер логів (0 токенів) + Спайк-гістограма             │
│  - Модалка BYOK з тестом з'єднання (Ping)                              │
│  - Підтримка друку @media print (чистий білий папір для Post-Mortem)   │
│  - React 19 ErrorBoundary для відмовостійкості                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ authFetch (x-gemini-api-key)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       БЕКЕНД (server.ts / Express 4)                   │
│                                                                        │
│  - @google/genai SDK (v2.4+)                                           │
│  - Моделі: gemini-3.8-flash (Primary) -> gemini-3.1-flash-lite         │
│  - Response Schema зі строго типізованим JSON виводом                  │
│  - Ліміт завантаження логів до 30MB                                    │
│  - Безпечний шлюз системного env-ключа                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Швидкий запуск

### Варіант 1: Локально через Node.js

1. **Клонуйте репозиторій:**
   ```bash
   git clone https://github.com/TerehovDV/LogForensicAI.git
   cd LogForensicAI
   ```

2. **Встановіть залежності:**
   ```bash
   npm install
   ```

3. **(Опціонально) Налаштуйте системний ключ автора у `.env`:**
   ```bash
   cp .env.example .env
   # Вкажіть GEMINI_API_KEY="ваш_ключ" (або залиште порожнім для використання BYOK у браузері)
   ```

4. **Запустіть режим розробки:**
   ```bash
   npm run dev
   ```
   Відкрийте браузер за адресою [http://localhost:3000](http://localhost:3000).

---

### Варіант 2: Запуск у Docker контейнері

1. **Збірка образу:**
   ```bash
   docker build -t logforensic-ai .
   ```

2. **Запуск контейнера:**
   ```bash
   docker run -d -p 3000:3000 --name logforensic logforensic-ai
   ```
   Сервіс буде доступний на порту 3000 з автоматичним Health Check.

---

### Варіант 3: Розгортання на Google Cloud Run в один клік

Натисніть кнопку розгортання вгорі цього файлу або виконайте команду у Google Cloud Shell:

```bash
gcloud run deploy logforensic-ai \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 3000
```

---

## ⌨️ Гарячі клавіші

- `Esc` — миттєво закрити модальне вікно налаштування ключів BYOK.
- `Ctrl/Cmd + P` — викликати оптимізований друк / експорт SRE Post-Mortem звіту.

---

## 🏷️ GitHub Repository Metadata

- **Repository Description (About):**
  > Zero-Shot Distributed System Forensic & SRE Incident Post-Mortem Platform powered by Gemini 3.8 Flash (2M+ Context). Correlates multi-service logs, localizes code culprits & generates production SRE reports.

- **Website / Demo URL:**
  > `https://logforensic-ai.run.app` (або посилання вашого сервісу на Cloud Run)

- **GitHub Topics / Tags:**
  ```text
  gemini-api, sre, distributed-systems, post-mortem, incident-response, log-analysis, observability, devops, react19, typescript, tailwindcss, cloud-run, root-cause-analysis, zero-shot
  ```

---

## 📄 Ліцензія

Цей проект розповсюджується під ліцензією [MIT](LICENSE). Вільний для комерційного та некомерційного використання.

---

## 🌐 Promotional Content & Social Media Copy (English)

### 💼 LinkedIn Announcement Post
```text
🚨 Tired of digging through millions of log lines during 3 AM production outages?

Traditional APM tools (Datadog, Dynatrace, CloudWatch) alert you when HTTP 500 rates spike, but they don't read your source code, and they can't pinpoint why a deadlock occurred at millisecond T-0.

I'm excited to release LogForensic AI — an open-source, Zero-Shot Distributed System Forensic & SRE Incident Post-Mortem Platform powered by Gemini 3.8 Flash (2M+ context window).

Key Features:
🔍 Ingests massive multi-service logs (Nginx, Kubernetes, Node, PostgreSQL, Redis) simultaneously.
⏱️ Reconstructs the exact millisecond-precision Causation Chain from initial trigger to cascading collapse.
🎯 Code Culprit Localization: identifies suspect lines of code responsible for connection pool deadlocks, memory leaks, and distributed race conditions.
📋 Generates enterprise-grade Google SRE Post-Mortem reports (Executive Summary, Trigger, Lessons Learned, Action Items P0/P1) with one-click clean PDF export.
🛡️ Auto-Cascade Quota Guard: graceful degradation (Gemini 3.8 Flash ➔ Flash Latest ➔ 3.1 Flash-Lite ➔ Offline Heuristic) ensuring 100% uptime with 200 OK responses.
🔒 Privacy-first BYOK (Bring Your Own Key) stored in local storage only.

Try the interactive sandbox with 3 real-world SEV-1 failure scenarios out of the box!

🔗 GitHub: https://github.com/TerehovDV/LogForensicAI
🚀 Live Demo: https://logforensic-ai.run.app

#SRE #DevOps #Observability #GeminiAPI #IncidentResponse #DistributedSystems #OpenSource #React #TypeScript
```

### 🐦 X (Twitter) Thread / Post
```text
Troubleshooting distributed system crashes doesn't have to take hours.

Introducing LogForensic AI 🛡️
Zero-Shot System Forensic & SRE Post-Mortem platform with Gemini 3.8 Flash.

Dump raw logs + code ➔ Get root cause, causation timeline, culprit code & SRE report in seconds.

⚡ Features:
- 2M+ context window for full multi-service log dumps
- Millisecond-precision incident timeline & anomaly histogram
- Code culprit diff & mitigation infra patches
- Quota Guard: 3-tier cascade fallback (never breaks or returns 500)
- 100% free interactive sandbox (0 author tokens spent)

Live demo & open-source on GitHub 👇
🔗 https://github.com/TerehovDV/LogForensicAI

#DevOps #SRE #AIStudio #BuildWithGemini
```

### 👽 Reddit / r/devops / r/sre / Hacker News
```text
Title: Show HN: LogForensic AI – Zero-Shot Distributed System Forensics and SRE Post-Mortems using Gemini 3.8 Flash

Hey everyone!
During major SEV-1 incidents, correlating disparate logs across Kubernetes pods, ingress gateways, and database slow-query logs while trying to inspect recent git commits is stressful and slow.

I built LogForensic AI to automate the entire forensic analysis loop:
1. Ingest multi-service logs alongside suspect repository code.
2. Leverage the 2M+ context window of Gemini 3.8 Flash to pinpoint the exact root cause (not just surface symptoms).
3. Generate a structured Google SRE Post-Mortem with timeline, lessons learned, action items, and mitigation patches.
4. Export clean white PDF reports directly for stakeholders.

It also includes an Auto-Cascade Quota Guard that falls back gracefully across model tiers and down to client-side heuristics if rate limits are reached, so the UI is always responsive.

Code is MIT-licensed and available on GitHub: https://github.com/TerehovDV/LogForensicAI
Feedback and PRs are welcome!
```
