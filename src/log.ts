import { appendFileSync, writeFileSync } from 'node:fs';

interface LoggerConfig {
  logFile?: string;
  console?: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = {}) {
    this.config = { console: true, ...config };
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level}: ${message}`;
  }

  log(message: string): void {
    const formatted = this.formatMessage('INFO', message);

    if (this.config.console) {
      console.log(message);
    }

    if (this.config.logFile) {
      appendFileSync(this.config.logFile, `${formatted}\n`);
    }
  }

  error(message: string): void {
    const formatted = this.formatMessage('ERROR', message);

    if (this.config.console) {
      console.error(message);
    }

    if (this.config.logFile) {
      appendFileSync(this.config.logFile, `${formatted}\n`);
    }
  }

  clearLogFile(): void {
    if (this.config.logFile) {
      writeFileSync(this.config.logFile, '');
    }
  }

  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Default logger instance for console-only logging
export const defaultLogger = new Logger();

// Factory function to create configured loggers
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

// Type exports
export type { LoggerConfig };
export { Logger };
