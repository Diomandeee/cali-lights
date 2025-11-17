/**
 * Sentry Integration for Error Tracking
 * 
 * This file provides Sentry integration helpers.
 * Install Sentry: npm install @sentry/nextjs
 * Then run: npx @sentry/wizard@latest -i nextjs
 */

let Sentry: any = null;
let loggerInstance: any = null;

// Lazy load logger to avoid circular dependency
function getLogger() {
  if (!loggerInstance) {
    try {
      loggerInstance = require("./logger").logger;
    } catch {
      loggerInstance = {
        warn: console.warn,
        error: console.error,
        info: console.log,
      };
    }
  }
  return loggerInstance;
}

// Lazy load Sentry only if DSN is configured
async function getSentry() {
  if (!process.env.SENTRY_DSN) {
    return null;
  }

  if (!Sentry) {
    try {
      // Use string-based import to avoid webpack static analysis
      const sentryModule = "@sentry/nextjs";
      Sentry = await import(sentryModule);
    } catch (error) {
      getLogger().warn("Sentry not installed", error);
      return null;
    }
  }

  return Sentry;
}

export async function captureException(error: Error, context?: Record<string, any>) {
  const sentry = await getSentry();
  if (sentry) {
    sentry.captureException(error, {
      extra: context,
    });
  }
  // Always log to console
  getLogger().error("Exception captured", error, context);
}

export async function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: Record<string, any>) {
  const sentry = await getSentry();
  if (sentry) {
    sentry.captureMessage(message, {
      level: level === "info" ? "info" : level === "warning" ? "warning" : "error",
      extra: context,
    });
  }
  // Always log to console
  const logger = getLogger();
  if (level === "error") {
    logger.error(message, undefined, context);
  } else if (level === "warning") {
    logger.warn(message, context);
  } else {
    logger.info(message, context);
  }
}

export async function setUser(userId: string, email?: string, name?: string) {
  const sentry = await getSentry();
  if (sentry) {
    sentry.setUser({
      id: userId,
      email,
      username: name,
    });
  }
}

export async function addBreadcrumb(message: string, category: string, level: "info" | "warning" | "error" = "info", data?: Record<string, any>) {
  const sentry = await getSentry();
  if (sentry) {
    sentry.addBreadcrumb({
      message,
      category,
      level: level === "error" ? "error" : level === "warning" ? "warning" : "info",
      data,
    });
  }
}

