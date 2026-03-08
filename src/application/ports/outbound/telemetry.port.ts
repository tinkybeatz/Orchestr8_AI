export interface SpanContext {
  readonly traceId: string;
  readonly spanId: string;
}

export interface TelemetryPort {
  startSpan(name: string, attributes?: Record<string, string>): SpanContext;
  endSpan(ctx: SpanContext, error?: Error): void;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void;
}
