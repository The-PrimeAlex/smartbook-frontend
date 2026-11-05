import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  log(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
  }
}

/**
 * Convenience function to get a logger instance with a namespace prefix.
 * Usage: const log = createLogger('MyComponent');
 *        log.error('something failed', err);
 */
export function createLogger(namespace: string) {
  const logger = inject(LoggerService);
  return {
    error: (message: string, ...args: unknown[]) =>
      logger.error(`[${namespace}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) =>
      logger.warn(`[${namespace}] ${message}`, ...args),
    log: (message: string, ...args: unknown[]) =>
      logger.log(`[${namespace}] ${message}`, ...args),
  };
}
