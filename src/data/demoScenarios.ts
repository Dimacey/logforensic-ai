/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IncidentScenario } from '../types/forensic';

export const DEMO_SCENARIOS: IncidentScenario[] = [
  {
    id: 'black-friday-db-deadlock',
    title: 'Каскадний дедлок пулу PostgreSQL у «Чорну Пʼятницю»',
    subtitle: 'Блокування рядка замовлення зовнішнім викликом платіжного шлюзу всередині незакритої транзакції',
    severity: 'SEV-1',
    duration: '22 хвилини',
    affectedUsers: '~42,000 покупців (fail rate 89%)',
    financialImpact: '$184,000 втраченого GMV',
    services: [
      {
        id: 'nginx-ingress',
        name: 'Ingress Controller (Nginx)',
        type: 'nginx',
        color: '#10b981',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
        badgeText: 'text-emerald-400',
        description: 'Крайовий балансувальник HTTP трафіку та SSL termination'
      },
      {
        id: 'checkout-service',
        name: 'Checkout API (Node.js/Express)',
        type: 'node',
        color: '#6366f1',
        badgeBg: 'bg-indigo-500/10 border-indigo-500/30',
        badgeText: 'text-indigo-400',
        description: 'Мікросервіс оформлення кошика та взаємодії з еквайрингом'
      },
      {
        id: 'postgres-primary',
        name: 'PostgreSQL 16 Primary',
        type: 'postgres',
        color: '#06b6d4',
        badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
        badgeText: 'text-cyan-400',
        description: 'Основний OLTP кластер бази даних замовлень'
      },
      {
        id: 'payment-worker',
        name: 'Payment Worker (Go)',
        type: 'go',
        color: '#f59e0b',
        badgeBg: 'bg-amber-500/10 border-amber-500/30',
        badgeText: 'text-amber-400',
        description: 'Асинхронний процесор підтвердження 3D-Secure платежів'
      }
    ],
    logStreams: [
      {
        serviceId: 'nginx-ingress',
        serviceName: 'Ingress Controller (Nginx)',
        rawLogs: `2026-11-27T10:14:02.114Z [INFO] 192.168.1.104 POST /api/v1/checkout HTTP/1.1 200 412ms [trace_bf901] upstream: 10.244.2.14:3000
2026-11-27T10:14:08.450Z [INFO] 192.168.1.109 POST /api/v1/checkout HTTP/1.1 200 488ms [trace_bf902] upstream: 10.244.2.14:3000
2026-11-27T10:14:15.890Z [WARN] 192.168.1.121 POST /api/v1/checkout HTTP/1.1 200 3210ms [trace_bf903] upstream: 10.244.2.14:3000 slow_upstream
2026-11-27T10:14:24.012Z [WARN] 192.168.1.144 POST /api/v1/checkout HTTP/1.1 200 7840ms [trace_bf904] upstream: 10.244.2.14:3000 slow_upstream
2026-11-27T10:14:32.610Z [ERROR] 192.168.1.155 POST /api/v1/checkout HTTP/1.1 504 15002ms [trace_bf910] upstream timed out (110: Connection timed out) while reading response header from upstream
2026-11-27T10:14:33.104Z [ERROR] 192.168.1.162 POST /api/v1/checkout HTTP/1.1 504 15001ms [trace_bf911] upstream timed out
2026-11-27T10:14:34.882Z [ERROR] 192.168.1.170 POST /api/v1/checkout HTTP/1.1 502 8ms [trace_bf912] connect() failed (111: Connection refused) while connecting to upstream: 10.244.2.14:3000`
      },
      {
        serviceId: 'checkout-service',
        serviceName: 'Checkout API (Node.js/Express)',
        rawLogs: `2026-11-27T10:14:01.890Z [INFO] [trace_bf901] Received checkout request for cart_88421. Acquiring DB client...
2026-11-27T10:14:01.912Z [INFO] [trace_bf901] DB transaction started. Reserved inventory for 3 items. Calling Stripe Gateway...
2026-11-27T10:14:02.105Z [INFO] [trace_bf901] Stripe responded 200. Transaction committed.
2026-11-27T10:14:12.301Z [INFO] [trace_bf903] Received checkout for cart_88440. DB transaction started (tx_id: 99104).
2026-11-27T10:14:12.308Z [WARN] [trace_bf903] Calling external payment provider https://api.stripe.com/v1/charges inside active SQL transaction...
2026-11-27T10:14:15.510Z [WARN] [trace_bf903] External payment gateway latency spiked: 3202ms!
2026-11-27T10:14:22.010Z [WARN] [pool] Active connections in pool: 94/100. Pending connection queue size: 38
2026-11-27T10:14:25.100Z [WARN] [pool] Active connections in pool: 100/100. Pending connection queue size: 142
2026-11-27T10:14:28.411Z [ERROR] [trace_bf909] Connection pool timeout! Failed to acquire client within 5000ms.
2026-11-27T10:14:31.902Z [FATAL] [express] Unhandled Rejection: TimeoutError: Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) or forgetting to commit/rollback?
2026-11-27T10:14:33.800Z [PANIC] [node:health] Health check failed: GET /healthz timeout after 5000ms. Node process event loop lag: 1480ms`
      },
      {
        serviceId: 'postgres-primary',
        serviceName: 'PostgreSQL 16 Primary',
        rawLogs: `2026-11-27T10:14:00.002Z [INFO] LOG: checkpoints starting: time
2026-11-27T10:14:12.310Z [DEBUG] LOG: process 4120 acquired RowShareLock on relation "orders"
2026-11-27T10:14:16.892Z [WARN] LOG: duration: 4582.112 ms statement: UPDATE inventory SET quantity = quantity - 1 WHERE sku_id = 'SKU-BLACK-MACBOOK' RETURNING *;
2026-11-27T10:14:23.400Z [WARN] LOG: process 4182 still waiting for ExclusiveLock on tuple (48, 12) of relation "inventory" after 1000.124 ms
2026-11-27T10:14:24.405Z [WARN] LOG: process 4189 still waiting for ExclusiveLock on tuple (48, 12) of relation "inventory" after 1000.088 ms
2026-11-27T10:14:26.900Z [ERROR] LOG: remaining connection slots are reserved for roles with SUPERUSER attribute
2026-11-27T10:14:27.104Z [ERROR] FATAL: sorry, too many clients already (current: 100, max: 100)
2026-11-27T10:14:29.800Z [ERROR] LOG: deadlock detected between process 4182 and process 4189 waiting for transaction 99104`
      },
      {
        serviceId: 'payment-worker',
        serviceName: 'Payment Worker (Go)',
        rawLogs: `2026-11-27T10:14:15.000Z [INFO] worker-02: processing webhook evt_3M001 for order_88440
2026-11-27T10:14:27.200Z [ERROR] worker-02: sql: database is closed (failed to update order_status to 'CONFIRMED')
2026-11-27T10:14:27.202Z [ERROR] worker-02: pq: remaining connection slots are reserved for roles with SUPERUSER attribute
2026-11-27T10:14:30.100Z [WARN] worker-02: retrying webhook evt_3M001 with exponential backoff (attempt 2/5)`
      }
    ],
    sourceCode: {
      filename: 'src/controllers/checkoutController.ts',
      language: 'typescript',
      culpritStartLine: 24,
      culpritEndLine: 34,
      problemExplanation: 'Критична анти-патерн помилка: мережевий HTTP-виклик платіжного шлюзу (Stripe) поміщено всередину відкритої SQL-транзакції knex.transaction. Коли шлюз затримав відповідь на 3.2 сек, зʼєднання з базою висіло заблокованим з RowLock на рядок товару. За напливу покупців пул на 100 зʼєднань вичерпався за 12 секунд.',
      code: `export async function processCheckout(req: Request, res: Response) {
  const { cartId, paymentMethodId, idempotencyKey } = req.body;
  const db = getDbPool();

  // Вразливий блок: початок транзакції
  await db.transaction(async (trx) => {
    // 1. Блокуємо рядок товару на складі
    const cart = await trx('carts').where({ id: cartId }).first();
    const inventory = await trx('inventory')
      .where({ sku_id: cart.skuId })
      .forUpdate() // Тримає ExclusiveLock на рядок!
      .first();

    if (inventory.quantity < cart.itemCount) {
      throw new Error('Недостатньо залишку на складі');
    }

    await trx('inventory')
      .where({ sku_id: cart.skuId })
      .decrement('quantity', cart.itemCount);

    // ❌ КРИТИЧНИЙ АНТИ-ПАТЕРН: Зовнішній мережевий I/O всередині транзакції БД!
    // Під час затримок платіжного шлюзу з'єднання пулу PostgreSQL утримується
    // та блокує інші 100 паралельних запитів до того самого товару.
    const paymentResult = await stripeClient.charges.create({
      amount: cart.totalCents,
      currency: 'usd',
      source: paymentMethodId,
      idempotency_key: idempotencyKey,
    });

    if (paymentResult.status !== 'succeeded') {
      throw new Error('Платіж відхилено еквайрингом');
    }

    const [order] = await trx('orders').insert({
      cart_id: cartId,
      charge_id: paymentResult.id,
      status: 'PAID',
    }).returning('*');

    return res.status(200).json({ success: true, orderId: order.id });
  });
}`,
      fixedCode: `export async function processCheckout(req: Request, res: Response) {
  const { cartId, paymentMethodId, idempotencyKey } = req.body;
  const db = getDbPool();

  // ✅ ПРАВИЛЬНЕ РІШЕННЯ: Двоетапний патерн (Reservation Token -> External Call -> Finalize)
  // 1. Коротка ізольована транзакція резервації (триває < 4 мілісекунд)
  const reservationToken = await db.transaction(async (trx) => {
    const cart = await trx('carts').where({ id: cartId }).first();
    const updated = await trx('inventory')
      .where({ sku_id: cart.skuId })
      .andWhere('quantity', '>=', cart.itemCount)
      .decrement('quantity', cart.itemCount);

    if (updated === 0) throw new Error('Недостатньо залишку на складі');
    return { cart, skuId: cart.skuId, count: cart.itemCount };
  });

  // 2. Зовнішній мережевий виклик платіжної системи поза межами транзакції БД!
  let paymentResult;
  try {
    paymentResult = await stripeClient.charges.create({
      amount: reservationToken.cart.totalCents,
      currency: 'usd',
      source: paymentMethodId,
      idempotency_key: idempotencyKey,
    });
  } catch (paymentErr) {
    // Компенсуюча транзакція повернення залишку у разі збою оплати
    await db('inventory')
      .where({ sku_id: reservationToken.skuId })
      .increment('quantity', reservationToken.count);
    throw paymentErr;
  }

  // 3. Фінальна швидка транзакція запису успішного замовлення (< 3 мс)
  const [order] = await db('orders').insert({
    cart_id: cartId,
    charge_id: paymentResult.id,
    status: 'PAID',
  }).returning('*');

  return res.status(200).json({ success: true, orderId: order.id });
}`
    },
    precomputedAnalysis: {
      summary: 'Каскадна відмова системи оформлення замовлень внаслідок вичерпання пулу зʼєднань PostgreSQL (100/100 connection pool exhaustion), спровокованого затримками зовнішнього платіжного шлюзу всередині відкритої SQL-транзакції.',
      rootCause: 'Тривале утримання SQL-транзакції та рядкового блокування (ExclusiveLock на таблицю inventory) під час синхронного очікування відповіді зовнішнього Stripe API у checkoutController.ts:24.',
      culpritService: 'checkout-service (Checkout API)',
      triggerEvent: 'Підвищення часу відповіді Stripe API з 120мс до 3200мс о 10:14:15.890Z під піковим трафіком 350 req/sec.',
      blastRadius: 'Повна недоступність Checkout API, каскадне падіння Ingress з помилками HTTP 504/502, відмова Payment Worker.',
      causationChain: [
        {
          step: 1,
          time: '10:14:12.308Z',
          service: 'checkout-service',
          event: 'Початок транзакції tx_id: 99104 із блокуванням inventory.forUpdate() та викликом Stripe',
          severity: 'info',
          logSnippet: 'Calling external payment provider inside active SQL transaction...',
          technicalImpact: 'Зʼєднання пулу закріплено за запитом на невизначений термін мережевої затримки.'
        },
        {
          step: 2,
          time: '10:14:15.890Z',
          service: 'nginx-ingress',
          event: 'Перші затримки обробки клієнтських запитів понад 3200мс',
          severity: 'warn',
          logSnippet: 'POST /api/v1/checkout HTTP/1.1 200 3210ms slow_upstream',
          technicalImpact: 'Накопичення черги очікування в Nginx Ingress.'
        },
        {
          step: 3,
          time: '10:14:24.405Z',
          service: 'postgres-primary',
          event: 'Черга з 100+ процесів застрягла у дедлок-блокуванні рядка SKU-BLACK-MACBOOK',
          severity: 'critical',
          logSnippet: 'LOG: process 4189 still waiting for ExclusiveLock on tuple (48, 12)',
          technicalImpact: 'Усі 100 доступних слотів PostgreSQL заблоковані очікуванням транзакції 99104.'
        },
        {
          step: 4,
          time: '10:14:27.104Z',
          service: 'postgres-primary',
          event: 'Повна відмова прийому нових клієнтських підключень до БД',
          severity: 'critical',
          logSnippet: 'FATAL: sorry, too many clients already (current: 100, max: 100)',
          technicalImpact: 'БД відхиляє будь-які нові запити від усіх мікросервісів кластера.'
        },
        {
          step: 5,
          time: '10:14:32.610Z',
          service: 'nginx-ingress',
          event: 'Масовий викид 504 Gateway Timeout та 502 Connection Refused',
          severity: 'critical',
          logSnippet: 'POST /api/v1/checkout HTTP/1.1 504 15002ms upstream timed out',
          technicalImpact: 'Повна втрата можливості оформлення покупок у 89% користувачів.'
        }
      ],
      anomalies: [
        {
          id: 'anom_1',
          service: 'checkout-service',
          type: 'Resource Starvation',
          description: 'Зростання черги очікування пулу Knex з 0 до 142 за 6.3 секунди',
          timestamp: '10:14:25.100Z',
          confidence: 0.99
        },
        {
          id: 'anom_2',
          service: 'postgres-primary',
          type: 'Lock Contention & Deadlock',
          description: 'ExclusiveLock тривалістю >1000мс на гарячому рядку інвентарю',
          timestamp: '10:14:24.405Z',
          confidence: 0.96
        },
        {
          id: 'anom_3',
          service: 'nginx-ingress',
          type: 'Upstream Timeout Cascading',
          description: 'Стрибок частки помилок 504 Timeout з 0.01% до 88.4%',
          timestamp: '10:14:32.610Z',
          confidence: 0.98
        }
      ],
      culpritCode: {
        filename: 'src/controllers/checkoutController.ts',
        culpritLines: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
        problemExplanation: 'Виклик stripeClient.charges.create розміщено всередині db.transaction(trx). Зовнішній API-виклик тримав транзакцію відкритою 3.2+ секунди разом з ексклюзивним блокуванням рядка.',
        proposedDiff: `- await db.transaction(async (trx) => {
-   const inventory = await trx('inventory').forUpdate().first();
-   await stripeClient.charges.create({...}); // ❌ Мережевий I/O всередині транзакції
- });
+ // ✅ Винести виклик еквайрингу за межі SQL-транзакції:
+ const reservation = await reserveInventoryShortTx(cartId);
+ const charge = await stripeClient.charges.create({...});
+ await finalizeOrderTx(reservation, charge.id);`
      },
      srePostMortem: {
        title: 'Post-Mortem: Каскадна відмова Checkout API через вичерпання пулу PostgreSQL',
        severity: 'SEV-1',
        date: '2026-11-27',
        leadInvestigator: 'Gemini SRE Forensic Engine & Senior Platform Lead',
        impactSummary: 'Протягом 22 хвилин користувачі не могли завершити оплату. Відмовлено 42,000 спробам чекауту. Втрачений оборот оцінюється у $184,000.',
        downtimeDuration: '22 хвилини (10:14:15 - 10:36:15 UTC)',
        detectionTime: '2 хвилини 17 секунд після початку інциденту',
        rootCauseAnalysis: 'Анти-патерн коду: синхронний виклик стороннього платіжного шлюзу Stripe знаходився всередині відкритої SQL-транзакції Knex з forUpdate() блокуванням рядка. При затримках на стороні Stripe пул з 100 зʼєднань PostgreSQL був повністю зайнятий за 12 секунд.',
        triggerEvent: 'Стрибок мережевої латентності API еквайрингу до 3.2 сек під час пікового навантаження 350 req/s.',
        blastRadius: 'Nginx Ingress (504/502), Checkout Service (Crashloop), PostgreSQL Primary (Connection Exhaustion), Payment Worker (SQL Deadlock).',
        lessonsLearned: {
          whatWentWell: [
            'Система моніторингу зафіксувала стрибок HTTP 504 та надіслала PagerDuty алерт інженерам за 137 секунд.',
            'База даних самостійно захистила системні процеси superuser_reserved_connections.',
            'Швидке ручне масштабування подів дозволило зменшити навантаження після перезавантаження.'
          ],
          whatWentWrong: [
            'У коді був відсутній жорсткий timeout на SQL-транзакції (statement_timeout та idle_in_transaction_session_timeout).',
            'Зовнішній виклик стороннього API знаходився всередині транзакції БД.',
            'Connection pool size (100) був однаковим як для важких фонових воркерів, так і для легких читань.'
          ],
          whereWeGotLucky: [
            'Репліка PostgreSQL Read-Replica залишилася неушкодженою і продовжувала обслуговувати перегляд каталогу товарів.',
            'Жодне подвійне списання коштів з банківських карток клієнтів не відбулося завдяки Idempotency-Key.'
          ]
        },
        actionItems: [
          {
            id: 'ACT-01',
            task: 'Винести виклик Stripe API за межі SQL-транзакції (двоетапний патерн резервації)',
            type: 'Preventative',
            owner: 'Backend Core Team',
            priority: 'P0',
            status: 'To Do'
          },
          {
            id: 'ACT-02',
            task: 'Налаштувати idle_in_transaction_session_timeout = 2500ms у postgresql.conf',
            type: 'Mitigation',
            owner: 'Database Reliability Team',
            priority: 'P0',
            status: 'In Progress'
          },
          {
            id: 'ACT-03',
            task: 'Впровадити PgBouncer перед primary кластером PostgreSQL з лімітом пулу транзакцій 250',
            type: 'Mitigation',
            owner: 'Infra DevOps Lead',
            priority: 'P1',
            status: 'To Do'
          },
          {
            id: 'ACT-04',
            task: 'Додати лінтер-правило (eslint-plugin-sql) проти async external fetch всередині db.transaction()',
            type: 'Monitoring',
            owner: 'QA & Platform Eng',
            priority: 'P1',
            status: 'To Do'
          }
        ]
      },
      mitigationConfigPatch: {
        filename: 'postgresql/conf.d/incident-mitigation.conf',
        language: 'ini',
        explanation: 'Налаштування жорстких таймаутів транзакцій у PostgreSQL для автоматичного розриву зʼєднань, які зависли через повільні зовнішні сервіси.',
        content: `# Запобігання вичерпанню пулу з'єднань через завислі зовнішні виклики
# Додати у postgresql.conf:

# Максимальний час очікування відповіді на SQL-запит (5 секунд)
statement_timeout = 5000

# Якщо транзакція відкрита, але не виконує операцій > 3 секунд - примусово розривати
idle_in_transaction_session_timeout = 3000

# Автоматичне виявлення дедлоків за 500мс
deadlock_timeout = 500

# Збільшення пулу з'єднань через зовнішній PgBouncer
max_connections = 250
superuser_reserved_connections = 10`
      },
      metricsSummary: {
        totalLogsParsed: 28,
        errorCount: 8,
        warnCount: 6,
        criticalSpikeTime: '10:14:26.900Z',
        confidenceScore: 0.98
      }
    }
  },
  {
    id: 'websocket-memory-leak-oom',
    title: 'Тихий витік памʼяті WebSocket-кластера та шторм OOMKilled',
    subtitle: 'Невидалений EventListener при реконнекті призвів до переповнення V8 Heap і SIGKILL (137)',
    severity: 'SEV-2',
    duration: '45 хвилин',
    affectedUsers: '18,500 активних стрімерів та чат-глядачів',
    financialImpact: '$42,000 компенсацій та відтоку активної аудиторії',
    services: [
      {
        id: 'ws-cluster',
        name: 'WebSocket Hub (Node.js/ws)',
        type: 'node',
        color: '#8b5cf6',
        badgeBg: 'bg-purple-500/10 border-purple-500/30',
        badgeText: 'text-purple-400',
        description: 'Сервіс обміну миттєвими повідомленнями та live-реакціями'
      },
      {
        id: 'k8s-kubelet',
        name: 'Kubernetes Kubelet / Cgroups v2',
        type: 'k8s',
        color: '#3b82f6',
        badgeBg: 'bg-blue-500/10 border-blue-500/30',
        badgeText: 'text-blue-400',
        description: 'Оркестрація контейнерів та моніторинг лімітів памʼяті pod-ів'
      },
      {
        id: 'redis-pubsub',
        name: 'Redis Cluster Pub/Sub',
        type: 'redis',
        color: '#ef4444',
        badgeBg: 'bg-rose-500/10 border-rose-500/30',
        badgeText: 'text-rose-400',
        description: 'Шина розсилки повідомлень між інстансами WebSocket'
      }
    ],
    logStreams: [
      {
        serviceId: 'ws-cluster',
        serviceName: 'WebSocket Hub (Node.js/ws)',
        rawLogs: `2026-11-20T14:02:10.012Z [INFO] [ws-pod-4] Client connected: usr_9941 (total active clients: 4,120)
2026-11-20T14:15:33.400Z [WARN] [v8:metrics] Process memory: rss=840MB, heapUsed=620MB, heapTotal=910MB, external=42MB
2026-11-20T14:22:45.100Z [WARN] [net:glitch] Network blip detected in region us-central1: 850 sockets closed abruptly
2026-11-20T14:23:01.890Z [INFO] [ws-pod-4] Reconnection storm: 1,200 incoming connections in 5 seconds
2026-11-20T14:28:12.780Z [WARN] [v8:metrics] GC pause duration spiked to 320ms (Scavenge + Mark-Sweep)
2026-11-20T14:32:40.114Z [WARN] [v8:warning] MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 1001 message listeners added to [RedisSubscriber]. Use emitter.setMaxListeners() to increase limit
2026-11-20T14:38:05.900Z [ERROR] [v8:metrics] Process memory critical: heapUsed=1910MB / 2048MB (93.2% of hard cgroup limit)
2026-11-20T14:40:12.000Z [FATAL] [ws-pod-4] Terminated abruptly by OS signal`
      },
      {
        serviceId: 'k8s-kubelet',
        serviceName: 'Kubernetes Kubelet / Cgroups v2',
        rawLogs: `2026-11-20T14:39:58.200Z [WARN] kubelet: Pod ws-hub-deployment-78d4cb954f-kz29x memory usage 2038Mi exceeds requested limit 2048Mi
2026-11-20T14:40:12.005Z [FATAL] kernel: [48912.441] Memory cgroup out of memory: Killed process 38442 (node) total-vm:3145728kB, anon-rss:2097152kB, file-rss:0kB
2026-11-20T14:40:12.112Z [ERROR] kubelet: Pod ws-hub-deployment-78d4cb954f-kz29x container ws-container was OOMKilled (Exit Code: 137)
2026-11-20T14:40:14.300Z [INFO] kubelet: Created container ws-container (restart count: 1)
2026-11-20T14:40:15.890Z [WARN] kubelet: Cascading reconnect load on sibling pod ws-hub-deployment-78d4cb954f-qq92b memory jumped +600MiB`
      },
      {
        serviceId: 'redis-pubsub',
        serviceName: 'Redis Cluster Pub/Sub',
        rawLogs: `2026-11-20T14:22:45.200Z [INFO] Pub/sub broadcast: channel live_reactions sent 14,200 msg/sec
2026-11-20T14:32:40.100Z [WARN] Client id=449191 addr=10.244.1.84:58291 name=ws-pod-4 pubsub channels count=18492 (unusual high subscriber count)
2026-11-20T14:40:12.010Z [INFO] Client disconnected: id=449191 (connection reset by peer)`
      }
    ],
    sourceCode: {
      filename: 'src/services/websocketHub.ts',
      language: 'typescript',
      culpritStartLine: 18,
      culpritEndLine: 26,
      problemExplanation: 'У коді socket.on("close") відсутнє відписування від глобального Redis Pub/Sub emitter. Коли користувачі перепідключаються, стара замикаюча функція залишається в памʼяті разом з усім обʼєктом сокету (socket + buffer), що призводить до витоку V8 heap памʼяті зі швидкістю ~15MB за кожну 1000 реконнектів.',
      code: `export class WebSocketHub {
  private redisSubscriber: Redis;

  constructor(redisSub: Redis) {
    this.redisSubscriber = redisSub;
  }

  public handleConnection(socket: WebSocket, userId: string) {
    const channelName = \`user:\${userId}:stream\`;

    // Слухач подій із шини Redis
    const onRedisMessage = (channel: string, msg: string) => {
      if (channel === channelName && socket.readyState === WebSocket.OPEN) {
        socket.send(msg);
      }
    };

    // ❌ КРИТИЧНИЙ ВИПЛИВ ПАМ'ЯТІ:
    // Підписуємося на глобальний EventEmitter, але НЕ видаляємо слухач при socket.on('close')!
    this.redisSubscriber.on('message', onRedisMessage);

    socket.on('message', (data: string) => {
      this.handleClientMessage(socket, data);
    });

    socket.on('close', () => {
      console.log(\`Socket closed for user \${userId}\`);
      // ❌ Помилка: забули викликати this.redisSubscriber.off('message', onRedisMessage)
      // В результаті кожен реконнект залишає в пам'яті замикання з посиланням на socket!
    });
  }
}`,
      fixedCode: `export class WebSocketHub {
  private redisSubscriber: Redis;

  constructor(redisSub: Redis) {
    this.redisSubscriber = redisSub;
  }

  public handleConnection(socket: WebSocket, userId: string) {
    const channelName = \`user:\${userId}:stream\`;

    const onRedisMessage = (channel: string, msg: string) => {
      if (channel === channelName && socket.readyState === WebSocket.OPEN) {
        socket.send(msg);
      }
    };

    // ✅ Підписка на повідомлення
    this.redisSubscriber.on('message', onRedisMessage);

    socket.on('message', (data: string) => {
      this.handleClientMessage(socket, data);
    });

    // ✅ ПРАВИЛЬНЕ ЗВІЛЬНЕННЯ РЕСУРСІВ:
    // При закритті сокета гарантовано відписуємо слухач, щоб GC очистив пам'ять
    const cleanup = () => {
      this.redisSubscriber.removeListener('message', onRedisMessage);
      socket.removeAllListeners();
    };

    socket.once('close', cleanup);
    socket.once('error', cleanup);
  }
}`
    },
    precomputedAnalysis: {
      summary: 'Аварійне завершення роботи pod-ів WebSocket-кластера сигналом SIGKILL (Exit Code 137, OOMKilled) через прогресуючий витік V8 Heap памʼяті від накопичення слухачів Redis EventEmitter.',
      rootCause: 'Відсутність cleanup-виклику removeListener("message", onRedisMessage) при обробці події закриття сокету в websocketHub.ts:24.',
      culpritService: 'ws-cluster (WebSocket Hub)',
      triggerEvent: 'Мережевий збій о 14:22:45 UTC, який спровокував шторм із 1200 реконнектів, кожен з яких залишив у купі V8 незвільнений обʼєкт сокета.',
      blastRadius: 'Відключення 18,500 користувачів, перезавантаження 4 pod-ів у k8s, лавиноподібне перевантаження сусідніх pod-ів.',
      causationChain: [
        {
          step: 1,
          time: '14:22:45.100Z',
          service: 'ws-cluster',
          event: 'Мережевий мікрозбій розірвав 850 сокетів одночасно',
          severity: 'warn',
          logSnippet: '850 sockets closed abruptly',
          technicalImpact: 'Клієнтські додатки почали негайний масовий реконнект.'
        },
        {
          step: 2,
          time: '14:32:40.114Z',
          service: 'ws-cluster',
          event: 'Перевищення ліміту EventEmitter (MaxListenersExceededWarning)',
          severity: 'warn',
          logSnippet: '1001 message listeners added to [RedisSubscriber]',
          technicalImpact: 'Купа V8 Heap перестала очищатися збирачем сміття (GC).'
        },
        {
          step: 3,
          time: '14:38:05.900Z',
          service: 'ws-cluster',
          event: 'Розмір Heap сягнув 1910MB з 2048MB cgroup hard limit',
          severity: 'critical',
          logSnippet: 'Process memory critical: heapUsed=1910MB / 2048MB',
          technicalImpact: 'V8 перейшов у режим постійного Full GC (паузи >320мс).'
        },
        {
          step: 4,
          time: '14:40:12.005Z',
          service: 'k8s-kubelet',
          event: 'Linux OOM Killer надіслав SIGKILL процесу Node.js',
          severity: 'critical',
          logSnippet: 'container was OOMKilled (Exit Code: 137)',
          technicalImpact: 'Pod раптово завершив роботу без graceful shutdown.'
        }
      ],
      anomalies: [
        {
          id: 'anom_ws_1',
          service: 'ws-cluster',
          type: 'Memory Leak Spike',
          description: 'Лінійне зростання Heap на 80MB/хв без зниження після відключення клієнтів',
          timestamp: '14:38:05.900Z',
          confidence: 0.99
        },
        {
          id: 'anom_ws_2',
          service: 'k8s-kubelet',
          type: 'OOM Event (Exit 137)',
          description: 'Знищення контейнера ядром Linux через досягнення cgroup limit 2048Mi',
          timestamp: '14:40:12.005Z',
          confidence: 1.0
        }
      ],
      culpritCode: {
        filename: 'src/services/websocketHub.ts',
        culpritLines: [18, 19, 20, 21, 22, 23, 24, 25, 26],
        problemExplanation: 'Підписка redisSubscriber.on("message", onRedisMessage) не скасовувалася у socket.on("close"). Кожен реконнект замикав посилання на WebSocket інстанс, блокуючи GC.',
        proposedDiff: `- socket.on('close', () => {
-   console.log('Socket closed');
- });
+ const cleanup = () => {
+   this.redisSubscriber.removeListener('message', onRedisMessage);
+   socket.removeAllListeners();
+ };
+ socket.once('close', cleanup);`
      },
      srePostMortem: {
        title: 'Post-Mortem: OOMKilled перезавантаження WebSocket кластера через витік EventListener',
        severity: 'SEV-2',
        date: '2026-11-20',
        leadInvestigator: 'Gemini SRE Forensic Platform',
        impactSummary: 'Усі підключені стрімери та глядачі чату отримали розрив зʼєднання. Час повного відновлення роботи сервісу склав 45 хвилин через ефект каскадного реконнекту.',
        downtimeDuration: '45 хвилин',
        detectionTime: '8 хвилин до першого падіння (проігноровано алерт Heap)',
        rootCauseAnalysis: 'Витік памʼяті в Node.js процесі через незнятий слухач подій EventEmitter. За напливу реконнектів незвільнені замикання переповнили ліміт памʼяті cgroups 2048MB, викликавши спрацювання Linux OOM Killer.',
        triggerEvent: 'Мережеве коливання в датацентрі us-central1 та шторм реконнектів.',
        blastRadius: '4 поди ws-hub, черга повідомлень Redis Pub/Sub, клієнтські веб-додатки.',
        lessonsLearned: {
          whatWentWell: [
            'Kubernetes автоматично перезапустив контейнер за 2.3 секунди.',
            'Redis Pub/Sub безперебійно витримав піковий потік повідомлень.'
          ],
          whatWentWrong: [
            'Відсутній автоматичний heap dump перед OOMKilled.',
            'Клієнти намагалися перепідключатися без експоненційного джитера (jitter).'
          ],
          whereWeGotLucky: [
            'База даних не постраждала, оскільки сокети не мали прямого підключення до SQL.'
          ]
        },
        actionItems: [
          {
            id: 'ACT-WS-1',
            task: 'Додати очищення removeListener у websocketHub.ts',
            type: 'Preventative',
            owner: 'Realtime Team',
            priority: 'P0',
            status: 'To Do'
          },
          {
            id: 'ACT-WS-2',
            task: 'Налаштувати прапорець node --max-old-space-size=1800 для graceful termination',
            type: 'Mitigation',
            owner: 'DevOps Lead',
            priority: 'P1',
            status: 'To Do'
          }
        ]
      },
      mitigationConfigPatch: {
        filename: 'k8s/websocket-deployment.yaml',
        language: 'yaml',
        explanation: 'Конфігурація graceful shutdown та додавання експоненційного backoff jitter для запобігання шторму реконнектів.',
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ws-hub-deployment
spec:
  replicas: 6
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
      - name: ws-container
        image: app/ws-hub:v2.4.1
        env:
        - name: NODE_OPTIONS
          value: "--max-old-space-size=1750"
        resources:
          requests:
            memory: "1500Mi"
            cpu: "1000m"
          limits:
            memory: "2048Mi"
            cpu: "2000m"`
      },
      metricsSummary: {
        totalLogsParsed: 18,
        errorCount: 4,
        warnCount: 7,
        criticalSpikeTime: '14:40:12.005Z',
        confidenceScore: 0.99
      }
    }
  },
  {
    id: 'double-spend-race-condition',
    title: 'Розподілений стан перегонів (Race Condition) у платіжному Ledger',
    subtitle: 'Повторні паралельні вебхуки призвели до подвійного зарахування балансу через неатомарний Redis Lock',
    severity: 'SEV-1',
    duration: '1 година 15 хвилин',
    affectedUsers: '820 акаунтів з аномальним балансом',
    financialImpact: '$34,200 помилково зарахованих бонусів',
    services: [
      {
        id: 'webhook-consumer',
        name: 'Payment Webhook Consumer (Python/FastAPI)',
        type: 'python',
        color: '#eab308',
        badgeBg: 'bg-yellow-500/10 border-yellow-500/30',
        badgeText: 'text-yellow-400',
        description: 'Обробка вхідних callback-сповіщень від банківських шлюзів'
      },
      {
        id: 'redis-lock',
        name: 'Redis Distributed Lock',
        type: 'redis',
        color: '#f97316',
        badgeBg: 'bg-orange-500/10 border-orange-500/30',
        badgeText: 'text-orange-400',
        description: 'Координатор розподілених локів між інстансами'
      },
      {
        id: 'ledger-db',
        name: 'Account Ledger DB (PostgreSQL)',
        type: 'postgres',
        color: '#06b6d4',
        badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
        badgeText: 'text-cyan-400',
        description: 'Фінансовий гросбух подвійного запису (Double-Entry Ledger)'
      }
    ],
    logStreams: [
      {
        serviceId: 'webhook-consumer',
        serviceName: 'Payment Webhook Consumer (Python/FastAPI)',
        rawLogs: `2026-11-15T09:30:00.100Z [INFO] Received webhook evt_pay_9941a for account_7721 (amount: $500.00) on worker-1
2026-11-15T09:30:00.104Z [INFO] Received duplicate webhook retry evt_pay_9941a for account_7721 on worker-2 (delay: 4ms)
2026-11-15T09:30:00.108Z [INFO] worker-1: checking lock 'lock:account_7721' in Redis -> returned false (lock available)
2026-11-15T09:30:00.109Z [INFO] worker-2: checking lock 'lock:account_7721' in Redis -> returned false (lock available)
2026-11-15T09:30:00.115Z [WARN] worker-1: set lock 'lock:account_7721'
2026-11-15T09:30:00.116Z [WARN] worker-2: set lock 'lock:account_7721' (overwritten due to non-atomic check-then-set)
2026-11-15T09:30:00.130Z [INFO] worker-1: read current balance = $1,200.00
2026-11-15T09:30:00.131Z [INFO] worker-2: read current balance = $1,200.00
2026-11-15T09:30:00.180Z [ERROR] worker-1: updated balance to $1,700.00 (tx_id: ledger_4401)
2026-11-15T09:30:00.182Z [ERROR] worker-2: updated balance to $2,200.00 (tx_id: ledger_4402 - DOUBLE CREDIT DETECTED!)`
      },
      {
        serviceId: 'redis-lock',
        serviceName: 'Redis Distributed Lock',
        rawLogs: `2026-11-15T09:30:00.108Z [DEBUG] "GET" "lock:account_7721" -> (nil)
2026-11-15T09:30:00.109Z [DEBUG] "GET" "lock:account_7721" -> (nil)
2026-11-15T09:30:00.115Z [DEBUG] "SET" "lock:account_7721" "worker-1" -> OK
2026-11-15T09:30:00.116Z [WARN] "SET" "lock:account_7721" "worker-2" -> OK (WITHOUT NX/PX ATOMICITY!)`
      },
      {
        serviceId: 'ledger-db',
        serviceName: 'Account Ledger DB (PostgreSQL)',
        rawLogs: `2026-11-15T09:30:00.130Z [INFO] SELECT balance FROM accounts WHERE id = 7721; (plain select without FOR UPDATE)
2026-11-15T09:30:00.131Z [INFO] SELECT balance FROM accounts WHERE id = 7721; (plain select without FOR UPDATE)
2026-11-15T09:30:00.180Z [INFO] INSERT INTO ledger_entries (account_id, amount, balance_after) VALUES (7721, 500.00, 1700.00);
2026-11-15T09:30:00.182Z [WARN] INSERT INTO ledger_entries (account_id, amount, balance_after) VALUES (7721, 500.00, 2200.00);
2026-11-15T09:30:00.185Z [ERROR] Audit trigger violation: account 7721 credited twice for payment evt_pay_9941a`
      }
    ],
    sourceCode: {
      filename: 'services/webhook_processor.py',
      language: 'python',
      culpritStartLine: 12,
      culpritEndLine: 24,
      problemExplanation: 'Розподілений лок у Redis реалізовано через анти-патерн "Check-Then-Set" (get + set замість атомарного set(nx=True, px=5000)). Додатково в базі даних був звичайний SELECT замість SELECT FOR UPDATE, що дозволило паралельним воркерам одночасно прочитати старий баланс і двічі зарахувати кошти.',
      code: `async def process_payment_webhook(event_id: str, account_id: str, amount: float):
    redis = get_redis_client()
    lock_key = f"lock:{account_id}"

    # ❌ КРИТИЧНИЙ АНТИ-ПАТЕРН: Check-then-set не є атомарним!
    # Між redis.get та redis.set проходить 6 мілісекунд, за які інший воркер
    # також бачить lock як доступний.
    existing_lock = await redis.get(lock_key)
    if existing_lock:
        raise HTTPException(status_code=429, detail="Account locked")

    await redis.set(lock_key, "worker-id")  # Помилка: немає NX=True та TTL!

    try:
        async with db.transaction():
            # ❌ Помилка: звичайний SELECT без FOR UPDATE дозволяє Phantom Read
            account = await db.fetch_one(
                "SELECT balance FROM accounts WHERE id = :id", {"id": account_id}
            )
            new_balance = account["balance"] + amount

            await db.execute(
                "UPDATE accounts SET balance = :balance WHERE id = :id",
                {"balance": new_balance, "id": account_id}
            )
    finally:
        await redis.delete(lock_key)`,
      fixedCode: `async def process_payment_webhook(event_id: str, account_id: str, amount: float):
    redis = get_redis_client()
    lock_key = f"lock:{account_id}"

    # ✅ Атомарне захоплення локу через SET NX PX (Redlock стандарт)
    acquired = await redis.set(lock_key, "worker-id", nx=True, px=5000)
    if not acquired:
        # Безпечно повертаємо 429 для повтору вебхука через 1 секунду
        raise HTTPException(status_code=429, detail="Concurrent update in progress")

    try:
        async with db.transaction():
            # ✅ Захист на рівні БД: унікальний індекс по event_id для ідемпотентності
            # + SELECT FOR UPDATE для блокування рядка балансу
            account = await db.fetch_one(
                "SELECT balance FROM accounts WHERE id = :id FOR UPDATE", {"id": account_id}
            )
            # Перевірка наявності запису в ідемпотентному журналі
            existing = await db.fetch_one(
                "SELECT id FROM processed_events WHERE event_id = :evt", {"evt": event_id}
            )
            if existing:
                return {"status": "already_processed"}

            new_balance = account["balance"] + amount
            await db.execute(
                "UPDATE accounts SET balance = :balance WHERE id = :id",
                {"balance": new_balance, "id": account_id}
            )
            await db.execute(
                "INSERT INTO processed_events (event_id, account_id) VALUES (:evt, :id)",
                {"evt": event_id, "id": account_id}
            )
    finally:
        # Звільнення локу через Lua script (перевірка володіння)
        await release_redis_lock(redis, lock_key, "worker-id")`
    },
    precomputedAnalysis: {
      summary: 'Фінансовий інцидент подвійного нарахування балансу (Double Credit / Race Condition) внаслідок неатомарного блокування в Redis та відсутності ідемпотентності записів у PostgreSQL.',
      rootCause: 'Використання роздільних операцій GET і SET у Redis без прапорця NX та відсутність блокування SELECT FOR UPDATE в базі даних у webhook_processor.py:16.',
      culpritService: 'webhook-consumer (Payment Webhook Consumer)',
      triggerEvent: 'Повторна відправка платіжним шлюзом ідентичного вебхука evt_pay_9941a з різницею у 4 мілісекунди.',
      blastRadius: '820 акаунтів користувачів, спотворення бухгалтерського балансу на $34,200.',
      causationChain: [
        {
          step: 1,
          time: '09:30:00.104Z',
          service: 'webhook-consumer',
          event: 'Надходження дубліката вебхука на інший worker pod',
          severity: 'info',
          logSnippet: 'Received duplicate webhook retry on worker-2 (delay: 4ms)',
          technicalImpact: 'Два незалежні потоки одночасно почали обробку одного й того ж платежу.'
        },
        {
          step: 2,
          time: '09:30:00.109Z',
          service: 'redis-lock',
          event: 'Обидва воркери отримали (nil) на GET lock:account_7721',
          severity: 'warn',
          logSnippet: '"GET" "lock:account_7721" -> (nil)',
          technicalImpact: 'Лок не захистив критичну секцію через відсутність атомарного SET NX.'
        },
        {
          step: 3,
          time: '09:30:00.131Z',
          service: 'ledger-db',
          event: 'Паралельний SELECT прочитав однаковий початковий баланс $1,200',
          severity: 'critical',
          logSnippet: 'SELECT balance FROM accounts WHERE id = 7721',
          technicalImpact: 'Стан перегонів (Race Condition) призвів до подвійного додавання $500.'
        },
        {
          step: 4,
          time: '09:30:00.185Z',
          service: 'ledger-db',
          event: 'Спрацювання аудиторського тригера подвійного нарахування',
          severity: 'critical',
          logSnippet: 'Audit trigger violation: account credited twice',
          technicalImpact: 'Зафіксовано фінансову розбіжність у гросбусі.'
        }
      ],
      anomalies: [
        {
          id: 'anom_race_1',
          service: 'webhook-consumer',
          type: 'Race Condition (Check-Then-Set)',
          description: 'Паралельне виконання однієї транзакції з дельтою 1 мілісекунда',
          timestamp: '09:30:00.116Z',
          confidence: 0.99
        }
      ],
      culpritCode: {
        filename: 'services/webhook_processor.py',
        culpritLines: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        problemExplanation: 'Неатомарний Redis lock та відсутність SELECT FOR UPDATE в базі даних дозволили паралельним процесам одночасно збільшити баланс.',
        proposedDiff: `- existing_lock = await redis.get(lock_key)
- await redis.set(lock_key, "worker-id")
+ acquired = await redis.set(lock_key, "worker-id", nx=True, px=5000)
+ # + SELECT ... FOR UPDATE у транзакції`
      },
      srePostMortem: {
        title: 'Post-Mortem: Подвійне нарахування коштів через стан перегонів у платіжному вебхуку',
        severity: 'SEV-1',
        date: '2026-11-15',
        leadInvestigator: 'Gemini SRE Forensic Platform',
        impactSummary: 'Через стан перегонів 820 акаунтів отримали подвійне зарахування балансу на загальну суму $34,200. Фінансові операції було тимчасово призупинено.',
        downtimeDuration: '1 година 15 хвилин',
        detectionTime: '4 хвилини через бухгалтерський тригер балансу',
        rootCauseAnalysis: 'Неатомарна перевірка блокування в Redis (Check-then-set) і відсутність унікального обмеження на рівні бази даних для event_id платежу.',
        triggerEvent: 'Мережевий ретрай від банку-еквайєра через мілісекундну затримку відповіді першого воркера.',
        blastRadius: 'Платіжний Ledger, модуль виплат, баланси користувачів.',
        lessonsLearned: {
          whatWentWell: ['Внутрішній аудиторський тригер виявив проблему за лічені хвилини.'],
          whatWentWrong: ['Відсутній унікальний індекс на event_id у таблиці транзакцій.'],
          whereWeGotLucky: ['Кошти не встигли вивести через автоматичний 24-годинний холдинг.']
        },
        actionItems: [
          {
            id: 'ACT-FIN-1',
            task: 'Додати UNIQUE CONSTRAINT (event_id) у таблицю транзакцій',
            type: 'Preventative',
            owner: 'Database Eng',
            priority: 'P0',
            status: 'To Do'
          },
          {
            id: 'ACT-FIN-2',
            task: 'Переписати Redis Lock на Redlock / SET NX PX',
            type: 'Mitigation',
            owner: 'Backend Lead',
            priority: 'P0',
            status: 'To Do'
          }
        ]
      },
      mitigationConfigPatch: {
        filename: 'migrations/20261115_add_idempotency_table.sql',
        language: 'sql',
        explanation: 'SQL міграція для забезпечення ідемпотентності на рівні бази даних: унікальний ключ гарантує, що жодна транзакція не виконається двічі.',
        content: `-- Забезпечення ідемпотентності фінансових операцій на рівні БД
CREATE TABLE IF NOT EXISTS processed_payment_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL,
    account_id BIGINT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_payment_event UNIQUE (event_id)
);

CREATE INDEX idx_payment_events_account ON processed_payment_events(account_id);`
      },
      metricsSummary: {
        totalLogsParsed: 16,
        errorCount: 3,
        warnCount: 4,
        criticalSpikeTime: '09:30:00.182Z',
        confidenceScore: 0.99
      }
    }
  }
];
