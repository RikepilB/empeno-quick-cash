type LogLevel = "error" | "warn" | "info" | "debug";

const LEVELS: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const THRESHOLD: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] <= LEVELS[THRESHOLD];
}

function formatMsg(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;
  const entry = {
    level,
    ts: new Date().toISOString(),
    msg,
    ...(meta ?? {}),
  };
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export const log = {
  error: (msg: string, meta?: Record<string, unknown>) => formatMsg("error", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => formatMsg("warn", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => formatMsg("info", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => formatMsg("debug", msg, meta),
};

export function sanitizeError(err: unknown, userMessage: string): Error {
  if (err instanceof Error) {
    log.error(err.message, { stack: err.stack?.slice(0, 500) });
  } else {
    log.error(String(err));
  }
  return new Error(userMessage);
}
