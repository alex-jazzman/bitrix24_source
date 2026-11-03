import type { LogDetails, LoggerPort } from 'call.engine.transport';

/** The three severities of the port, named after the methods that write them. */
export type LogSeverity = 'log' | 'warn' | 'error';

/**
 * One recorded entry, kept whole: the severity it was written with, the fixed text and the structured
 * data beside it. `details` stays `undefined` in the record when it was omitted, so the shape of an
 * entry never depends on the arguments - and a test asserting on a redacting adapter reads the field
 * it cares about instead of matching a formatted string.
 */
export type LogEntry = {
	severity: LogSeverity,
	message: string,
	details?: LogDetails,
};

/**
 * Collecting logger. It writes nowhere and only keeps what it was given, in order, which is what lets
 * a test assert on the severity, on the text and on a single field of `details` at once.
 */
export class FakeLoggerPort implements LoggerPort
{
	#entries: LogEntry[] = [];

	log(message: string, details?: LogDetails): void
	{
		this.#entries.push({ severity: 'log', message, details });
	}

	warn(message: string, details?: LogDetails): void
	{
		this.#entries.push({ severity: 'warn', message, details });
	}

	error(message: string, details?: LogDetails): void
	{
		this.#entries.push({ severity: 'error', message, details });
	}

	/**
	 * Every entry in order, or only those of one severity. Always a copy: mutating the result leaves
	 * the record alone.
	 */
	getEntries(severity?: LogSeverity): LogEntry[]
	{
		if (severity === undefined)
		{
			return [...this.#entries];
		}

		return this.#entries.filter((entry) => entry.severity === severity);
	}
}
