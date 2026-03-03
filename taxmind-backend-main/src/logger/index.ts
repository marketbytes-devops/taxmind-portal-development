// import loglevel from "loglevel";
// const logger = loglevel.getLogger("logger");
// logger.setLevel("info"); // levels: https://github.com/pimterry/loglevel#documentation
// export default logger;
// ========================================================================
import type { TransformableInfo } from 'logform';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { createLogger, format, transports } = winston;

const isLocal = process.env.NODE_ENV === 'local';

// Pretty, colorized console format for local dev
const localConsoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf((info: TransformableInfo & { stack?: string; timestamp?: string }) => {
    const { level, stack } = info;
    const timestamp = info.timestamp ?? '';
    const message = String(info.message);
    const meta: Record<string, unknown> = { ...(info as Record<string, unknown>) };
    delete (meta as Record<string, unknown>).level;
    delete (meta as Record<string, unknown>).message;
    delete (meta as Record<string, unknown>).timestamp;
    delete (meta as Record<string, unknown>).stack;
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    if (stack) return `${timestamp} ${level}: ${message}\n${stack}${metaStr}`;
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Readable file format (kept simple for log rotation)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf((info: TransformableInfo & { stack?: string; timestamp?: string }) => {
    const timestamp = info.timestamp ?? '';
    const level = info.level;
    const message = String(info.message);
    const stack = info.stack;
    return `${timestamp} ${level}: ${message}${stack ? `\n${stack}` : ''}`;
  })
);

// Rotating file transport
const rotateFileTransport = new transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

const consoleTransport = new transports.Console({
  level: isLocal ? 'debug' : 'info',
  format: isLocal
    ? localConsoleFormat
    : format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
});

const logger = createLogger({
  level: isLocal ? 'debug' : 'info',
  transports: [consoleTransport, rotateFileTransport],
});

export default logger;
