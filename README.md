# 🛡️ LogForensic AI
### Zero-Shot Distributed System Forensic & SRE Incident Post-Mortem Platform
> **Глибинний реверс-аналіз системних інцидентів, мікросервісних логів та коду на базі наддовгого 2M+ контексту Gemini 3.8 Flash**

[![Ліцензія: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-blue.svg)](https://tailwindcss.com)
[![Gemini API](https://img.shields.io/badge/Gemini-3.8_Flash_2M-purple.svg)](https://aistudio.google.com)
[![Google Cloud Run](https://img.shields.io/badge/Deploy-Cloud_Run-4285F4.svg)](https://cloud.google.com/run)

---

### 🚀 Розгортання в один клік (1-Click Deployment)

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/Dimacey/logforensic-ai.git)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new?template=https://github.com/Dimacey/logforensic-ai)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Dimacey/logforensic-ai)

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
   git clone https://github.com/Dimacey/logforensic-ai.git
   cd logforensic-ai
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
  > `https://logforensic-ai.ai.studio`

- **GitHub Topics / Tags:**
  ```text
  gemini-api, sre, distributed-systems, post-mortem, incident-response, log-analysis, observability, devops, react19, typescript, tailwindcss, cloud-run, root-cause-analysis, zero-shot
  ```

---

## 📄 Ліцензія

Цей проект розповсюджується під ліцензією [MIT](LICENSE). Вільний для комерційного та некомерційного використання.
