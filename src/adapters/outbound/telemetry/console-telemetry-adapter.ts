import { v4 as uuidv4 } from 'uuid';
import type { SpanContext, TelemetryPort } from '../../../application/ports/outbound/telemetry.port.js';

export class ConsoleTelemetryAdapter implements TelemetryPort {
  startSpan(name: string, attributes?: Record<string, string>): SpanContext {
    const ctx: SpanContext = {
      traceId: uuidv4(),
      spanId: uuidv4(),
    };
    console.info(`[span:start] ${name}`, { ...ctx, ...attributes });
    return ctx;
  }

  endSpan(ctx: SpanContext, error?: Error): void {
    if (error) {
      console.error(`[span:end:error] ${ctx.spanId}`, { error: error.message });
    } else {
      console.info(`[span:end] ${ctx.spanId}`);
    }
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    console.info(`[metric] ${name}=${value}`, tags);
  }

  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>,
  ): void {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
    fn(`[${level}] ${message}`, data ?? '');
  }
}
