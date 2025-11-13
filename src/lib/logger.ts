/**
 * Production-safe logger
 * Only logs in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  
  error: (...args: any[]) => {
    // Always log errors, but prefix them
    console.error('[ERROR]', ...args);
  },
  
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  },
};
