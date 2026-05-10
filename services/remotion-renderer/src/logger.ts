export function logRenderer(event: string, fields: Record<string, unknown>, level: 'log' | 'warn' | 'error' = 'log'): void {
  if (process.env.RENDERER_LOG_LEVEL === 'silent') return;
  console[level](JSON.stringify({
    service: 'remotion-renderer',
    event,
    ...fields,
  }));
}
