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

## 🎯 Про проект (Engineering Overview)

Сучасний стек телеметрії та APM (Datadog, Dynatrace, AWS CloudWatch, Prometheus) оптимізований для сигналізування симптомів (High Error Rate, P99 Latency degradation), але позбавлений семантичного контексту кодової бази та не здатний автономно ізолювати першопричину міжсервісного дедлоку, тихого витоку пам'яті або розподіленого стану перегонів (Race Condition). Традиційні LLM-утиліти обмежені розміром контекстного вікна і здатні аналізувати лише окремі ізольовані стек-трейси.

**LogForensic AI** — це повнофункціональна інженерна платформа форензік-аналізу та розслідування системних інцидентів (Zero-Shot Incident Forensics). Система агрегує гетерогенні потоки телеметрії (Edge Ingress, Service Mesh, RPC/REST Gateways, Kubelet/OOM, Database Slow Logs) разом із фрагментами підозрілого вихідного коду та задіює наддовге контекстне вікно **Gemini 3.8 Flash (2M+ tokens)**:

1. 🔍 **Семантична ізоляція першопричини (Root Cause Analysis):** Диференціація наслідкових каскадних відмов (симптоматичних тайм-аутів 504 Gateway) від справжнього джерела збою (дедлок транзакцій, вичерпання пулу з'єднань, дефіцит heap-пам'яті).
2. ⏱️ **Реконструкція хронологічного графа причинності (Causation Graph & T-0):** Відтворення точного мілісекундного ланцюга подій від початкового тригера (помилка конфігурації, зовнішній спайк трафіку) через ескалацію до системного колапсу.
3. 🎯 **Прецизійна локалізація кодових дефектів (Code Culprit Localization):** Семантичне співставлення сигнатур системних помилок із конкретними рядками коду у репозиторії — виявлення антипатернів блокувань ресурсів, незакритих з'єднань та порушень розподіленої атомарності.
4. 📋 **Автоматична генерація звітів за стандартом Google SRE Post-Mortem:** Формування повноструктурного аналітичного звіту (Executive Summary, Timeline, Root Cause, Lessons Learned, Action Items P0/P1/P2) з експортом у Markdown та чистий PDF для стейкхолдерів.
5. 🛠️ **Синтез інфраструктурних конфіг-патчів (Remediation Patches):** Автоматична генерація виправлених конфігурацій ядра бази даних (`postgresql.conf`), маніфестів Kubernetes або кодових diff-патчів для негайної стабілізації продакшну.

---

## 💎 Архітектурна модель та надійність (Reliability & Cost Governance)

1. **Автономна клієнтська пісочниця (Zero-Latency / Zero-Cost Sandbox):**
   - Миттєвий інтерактивний доступ без обов'язкової реєстрації чи авторизації.
   - 3 репрезентативні сценарії розподілених збоїв високого рівня критичності (SEV-1/SEV-2):
     - 🛒 **Каскадний дедлок пулу підключень PostgreSQL у період пікового навантаження (SEV-1):** блокування рядків замовлення зовнішнім синхронним RPC-викликом еквайрингу всередині незакритої транзакції.
     - 💬 **Тихий витік пам'яті кластера WebSocket та масовий рестарт OOMKilled (SEV-2):** накопичення анонімних слухачів подій EventEmitter при перепідключенні клієнтів.
     - 💳 **Розподілений стан перегонів (Race Condition) у фінансовому реєстрі транзакцій (SEV-1):** неатомарне взяття блокувань у Redis під час паралельної обробки вебхуків.
   - **Нульова вартість інфраструктури (0 токенів автора):** Попередня токенізація, парсинг логів у мілісекундні бакети та локальна евристична оцінка виконуються на клієнті в браузері.

2. **Корпоративна безпека та приватність даних (Enterprise BYOK Architecture):**
   - Режим **Bring Your Own Key**: аналіз конфіденційних клієнтських логів та внутрішнього вихідного коду виконується за персональним ключем користувача.
   - Ключі зберігаються виключно в ізольованому клієнтському сховищі (`localStorage`) і передаються через криптографічно захищені заголовки `x-gemini-api-key`.
   - Вбудований механізм попередньої верифікації каналу (Ping Health Check) для діагностики валідності ключа перед надсиланням великих масивів даних.

3. **Багаторівневий каскадний захист від квот (Auto-Cascade Quota Guard):**
   - Відмовостійкий контур захисту для безперервної доступності (High Availability):
     `Gemini 3.8 Flash` ➔ `Gemini Flash Latest` ➔ `Gemini 3.1 Flash-Lite` ➔ `Автономний клієнтський евристичний аналізатор`.
   - При вичерпанні лімітів або сплесках 429 Rate Limit система прозоро перемикає шари виконання, гарантуючи успішну відповідь HTTP 200 OK без збоїв інтерфейсу.

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

## 🛡️ Безпека та ліцензія

- **Безпека ключа:** Бекенд повністю захищає API-ключ Gemini на сервері (`server.ts`). Підтримується режим **BYOK** (Bring Your Own Key).
- **Ліцензія:** [MIT License](LICENSE). Відкритий код для вільного використання розробниками, тестувальниками та бізнесом по всьому світу.
- **Автор:** [Dmytro Terekhov (Dimacey)](https://github.com/Dimacey).
