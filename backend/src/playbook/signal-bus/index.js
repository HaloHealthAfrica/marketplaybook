/**
 * Signal Bus - inter-engine communication layer.
 * Uses Redis Pub/Sub for real-time signals and BullMQ for durable async jobs.
 * Engines must NOT call each other directly.
 */
const Redis = require('ioredis');
const { Queue, Worker } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const SIGNAL_TYPES = require('./types');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let _connection = null;

function getConnection() {
  if (!_connection) {
    _connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });
  }
  return _connection;
}

const CHANNEL_PREFIX = 'playbook:signal:';
const QUEUE_OPTIONS = {
  connection: { url: REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
  },
};

/**
 * Create a signal payload
 */
function createSignal(type, payload) {
  return {
    id: uuidv4(),
    type,
    timestamp: Date.now(),
    payload,
  };
}

/**
 * Publish a real-time signal (fire-and-forget)
 */
async function publish(type, payload) {
  const signal = createSignal(type, payload);
  try {
    const conn = getConnection();
    const channel = `${CHANNEL_PREFIX}${type}`;
    await conn.publish(channel, JSON.stringify(signal));
  } catch (err) {
    console.warn('[SignalBus] Publish failed:', err.message);
  }
  return signal;
}

/**
 * Subscribe to a signal type
 */
function subscribe(type, handler) {
  const channel = `${CHANNEL_PREFIX}${type}`;
  const subscriber = getConnection().duplicate();
  subscriber.subscribe(channel, (err, count) => {
    if (err) throw err;
  });
  subscriber.on('message', (ch, message) => {
    try {
      const signal = JSON.parse(message);
      handler(signal);
    } catch (e) {
      console.error('[SignalBus] Failed to parse signal:', e);
    }
  });
  return () => subscriber.quit();
}

/**
 * Enqueue a job for durable processing
 */
function getQueue(name) {
  return new Queue(name, QUEUE_OPTIONS);
}

/**
 * Add job to queue
 */
async function enqueue(queueName, jobName, data) {
  const queue = getQueue(queueName);
  return queue.add(jobName, data);
}

/**
 * Create a worker for a queue
 */
function createWorker(queueName, processor) {
  return new Worker(queueName, processor, {
    connection: { url: REDIS_URL },
    concurrency: 5,
  });
}

module.exports = {
  get connection() { return getConnection(); },
  publish,
  subscribe,
  getQueue,
  enqueue,
  createWorker,
  createSignal,
  SIGNAL_TYPES,
  QUEUE_NAMES: {
    marketContext: 'playbook:market-context',
    regimeDetection: 'playbook:regime-detection',
    planEvaluation: 'playbook:plan-evaluation',
    probabilityCalculation: 'playbook:probability-calculation',
    decisionGeneration: 'playbook:decision-generation',
    portfolioCheck: 'playbook:portfolio-check',
    paperTrade: 'playbook:paper-trade',
    metaLearning: 'playbook:meta-learning',
  },
};
