type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
	[key: string]: unknown;
}

function formatLog(level: LogLevel, module: string, message: string, context?: LogContext): string {
	const entry = {
		ts: new Date().toISOString(),
		level,
		module,
		msg: message,
		...context
	};
	return JSON.stringify(entry);
}

function createLogger(module: string) {
	return {
		debug: (msg: string, ctx?: LogContext) => console.debug(formatLog('debug', module, msg, ctx)),
		info: (msg: string, ctx?: LogContext) => console.log(formatLog('info', module, msg, ctx)),
		warn: (msg: string, ctx?: LogContext) => console.warn(formatLog('warn', module, msg, ctx)),
		error: (msg: string, ctx?: LogContext) => console.error(formatLog('error', module, msg, ctx))
	};
}

export const log = {
	push: createLogger('push'),
	auth: createLogger('auth'),
	api: createLogger('api')
};
