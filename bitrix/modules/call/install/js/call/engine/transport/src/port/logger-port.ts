/**
 * Structured data of a log entry. It travels beside the message instead of inside it so that a
 * sensitive field can be found by its name: that is what gives an adapter redacting tokens and keys
 * something to look at, while a value already interpolated into a string could only be guessed at.
 */
export type LogDetails = {
	[field: string]: unknown,
};

/**
 * Logging behind one seam, narrow on purpose: three severities and nothing else - no formatters, no
 * sinks, no level of its own to configure, because the transport needs none of it. Redaction is not
 * part of the contract; the adapter adds it, and splitting `message` from `details` is what makes it
 * possible at all.
 */
export interface LoggerPort
{
	/**
	 * A key event of the transport: a reconnect started, an escalation committed. `message` stays a
	 * fixed text with no value interpolated into it - everything variable belongs in `details`, or
	 * redaction has nothing to work with.
	 */
	log(message: string, details?: LogDetails): void;

	/** Something went wrong and the operation carries on: a fallback taken, an attempt repeated. */
	warn(message: string, details?: LogDetails): void;

	/** The operation failed: access refused, reconnect budget exhausted, escalation lost. */
	error(message: string, details?: LogDetails): void;
}
