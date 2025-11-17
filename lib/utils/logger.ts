/**
 * Production-grade logging utility
 * Provides structured logging with different levels
 */

type LogLevel = "info" | "warn" | "error" | "debug";

// Dynamic import for Sentry to avoid build-time resolution
async function captureExceptionSentry(error: Error, context?: Record<string, any>) {
  try {
    const { captureException } = await import("./sentry");
    await captureException(error, context);
  } catch {
    // Sentry not available, ignore
  }
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext | Error | unknown): void {
    if (context instanceof Error) {
      console.warn(this.formatMessage("warn", message, { error: context.message }));
    } else if (context && typeof context === 'object') {
      console.warn(this.formatMessage("warn", message, context as LogContext));
    } else {
      console.warn(this.formatMessage("warn", message));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        name: error.name,
      } : String(error),
    };
    console.error(this.formatMessage("error", message, errorContext));
    
    // Send to Sentry in production
    if (this.isProduction && error instanceof Error) {
      captureExceptionSentry(error, context).catch(() => {
        // Silently fail if Sentry is not configured
      });
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
}

export const logger = new Logger();

/**
 * Retry utility for external API calls
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      if (onRetry && error instanceof Error) {
        onRetry(error, attempt + 1);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Safe async execution with error handling
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(
      `Safe execute failed${context ? `: ${context}` : ""}`,
      error
    );
    return fallback;
  }
}

