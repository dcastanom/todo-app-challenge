import { pino } from 'pino';
import { env, isProduction, isTest } from './env.js';

// Pretty transport spawns a worker thread — only worth it for local dev.
const usePretty = !isProduction && !isTest;

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  ...(usePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

export type Logger = typeof logger;
