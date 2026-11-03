import { err, isOk, ok } from '../error/result';
import type { Err, Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import type { ClockPort } from '../port/clock-port';
import type { EnvironmentPort } from '../port/environment-port';
import type { LoggerPort } from '../port/logger-port';
import type { MediaTransportListener } from './media-transport';

/**
 * Refusals of the controller itself rather than of a connection: they answer about the state the cycle
 * is in, and no attempt was taken for either of them.
 */
export const ReconnectContractCode: {
	readonly AlreadyRunning: 'reconnect.already_running',
	readonly Closed: 'reconnect.closed',
} = Object.freeze({
	AlreadyRunning: 'reconnect.already_running',
	Closed: 'reconnect.closed',
});

export type ReconnectContractCode = typeof ReconnectContractCode[keyof typeof ReconnectContractCode];

const CYCLE_STARTED = 'reconnect: a cycle of recovery started';
const ATTEMPT_FAILED = 'reconnect: an attempt of recovery failed, another one follows';
const RECONNECTED = 'reconnect: the connection is back';
const RECOVERY_LOST = 'reconnect: recovery is over and the connection is not back';
const ATTEMPT_THREW = 'reconnect: an attempt of recovery threw instead of answering';

/**
 * The kinds a repeated attempt can still turn into a connection. Everything else would come back the
 * same - a refused right, a cancellation, a contract the server answered with - and a kind this model
 * gains later counts as fatal until it is stated otherwise, which is the safe direction: a cycle that
 * cannot succeed ends instead of spending the budget.
 */
const RETRYABLE_KINDS: readonly TransportError['kind'][] = ['network', 'timeout'];

/**
 * How many attempts the cycle may take and how long it waits between them. Both come from above as
 * configuration - the product values of recovery are settled by the layers that know the call, and this
 * is only the shape they arrive in.
 */
export type ReconnectBudget = {
	/** Attempts in total, the first one included; the cycle always takes at least one. */
	maxAttempts: number,
	/**
	 * The pause before the next attempt, asked for by the number of attempts already spent (`1` after
	 * the first failure). Absent, zero or non-positive means no pause at all: a mesh recovers by a fixed
	 * limit of attempts with nothing to wait for, while an SFU spreads them out. Growth of the delay is
	 * whatever this function does - the controller neither multiplies nor caps it.
	 */
	backoffMs?: (attempt: number) => number,
};

/**
 * One attempt of recovery, injected by the transport that owns the cycle: an ICE restart of a mesh
 * connection, a rejoin of an SFU one. It answers a `Result` rather than throwing, so an attempt that
 * failed is part of the loop instead of an exception in it.
 */
export type ReconnectAttempt = () => Promise<Result<void, TransportError>>;

/**
 * The three events of recovery, taken from the media contract instead of restated: the vocabulary of a
 * reconnect exists once, and a transport hands its own listener over as it is.
 */
export type ReconnectListener = Pick<MediaTransportListener, 'onReconnecting' | 'onReconnected' | 'onFailure'>;

export type ReconnectControllerOptions = {
	clock: ClockPort,
	/** Signals of the environment; a network that came back is one of the triggers of the cycle. */
	environment: EnvironmentPort,
	budget: ReconnectBudget,
	attempt: ReconnectAttempt,
	listener: ReconnectListener,
	logger: LoggerPort,
};

function refused(code: ReconnectContractCode): Err<TransportError>
{
	const error: TransportError = { kind: 'contract', code };

	return err(error);
}

/** The cycle was stopped by `close` rather than by its own outcome: the same variant an abort answers. */
function cancelled(): Err<TransportError>
{
	const error: TransportError = { kind: 'cancelled' };

	return err(error);
}

/** Whether repeating the attempt could change anything; the error itself is the only thing read. */
function isFatal(error: TransportError): boolean
{
	return !RETRYABLE_KINDS.includes(error.kind);
}

/**
 * The cycle of recovery, one for a mesh connection and an SFU one alike: it runs the attempts, spends
 * the injected budget and decides when there is nothing left to try. It is an internal component of a
 * transport - semantically the cycle belongs to the `MediaTransport` that composes it - and not an
 * abstraction any layer above the transport addresses.
 *
 * What an attempt actually is stays outside: an ICE restart, a rejoin of a session, a fresh offer with
 * `iceRestart` - all of it arrives as the injected `attempt`. That is what makes the cycle the same code
 * for both planes, and what lets a plane state through the error it answers with whether repeating is
 * worth anything at all.
 *
 * One cycle runs at a time: a `run` that finds one in flight refuses instead of starting a second, so no
 * two attempts of recovery overlap. A cycle that ended - reconnected or failed - leaves the controller
 * ready to run again, because a connection that broke twice is two cycles and not one.
 *
 * Triggers are plural on purpose. A network that came back is one of them and lives here: the controller
 * subscribes to it and starts the cycle when the environment reports online after having been offline. A
 * connection lost on a live network is the other one, and it belongs to the transport - it observes its
 * own ICE state and calls `run()` itself.
 *
 * `close` is idempotent and terminal: the environment subscription is let go, a pause in flight is
 * cancelled and the loop it held is woken so that it stops at once. No event reaches the listener after
 * it, and no attempt is taken.
 */
export class ReconnectController
{
	#clock: ClockPort;
	#budget: ReconnectBudget;
	#attempt: ReconnectAttempt;
	#listener: ReconnectListener;
	#logger: LoggerPort;
	#unsubscribeOnlineChange: () => void;
	#wasOnline: boolean;
	#running: boolean = false;
	#closed: boolean = false;
	#cancelPause: (() => void) | undefined = undefined;
	#wake: (() => void) | undefined = undefined;

	constructor(options: ReconnectControllerOptions)
	{
		this.#clock = options.clock;
		this.#budget = options.budget;
		this.#attempt = options.attempt;
		this.#listener = options.listener;
		this.#logger = options.logger;
		this.#wasOnline = options.environment.isOnline();
		this.#unsubscribeOnlineChange = options.environment.subscribeOnlineChange(
			(isOnline) => this.#onOnlineChange(isOnline),
		);
	}

	/**
	 * Runs the cycle: `reconnecting` at the start, then attempt after attempt until one succeeds
	 * (`reconnected`) or the budget is spent, or an error the plane cannot recover from arrives - both of
	 * which end in the terminal `failure`. The answer repeats the outcome for whoever started the cycle
	 * and waits for it; a trigger that does not wait reads the events instead.
	 *
	 * A cycle already in flight and a closed controller both refuse without touching the listener.
	 *
	 * Everything the cycle does stands under the `finally` that clears the mark of a running cycle,
	 * announcement included: a consumer that breaks out of `reconnecting` ends this cycle rather than
	 * leaving the controller unable to start another one ever again.
	 */
	async run(): Promise<Result<void, TransportError>>
	{
		if (this.#closed)
		{
			return refused(ReconnectContractCode.Closed);
		}

		if (this.#running)
		{
			return refused(ReconnectContractCode.AlreadyRunning);
		}

		this.#running = true;

		try
		{
			this.#listener.onReconnecting();
			this.#logger.log(CYCLE_STARTED, { maxAttempts: this.#budget.maxAttempts });

			return await this.#runAttempts();
		}
		finally
		{
			this.#running = false;
		}
	}

	/**
	 * Idempotent. Stops the cycle where it stands: the pause it was waiting out is cancelled, the loop
	 * wakes to find the controller closed and answers `Cancelled` without an event, and the environment
	 * is no longer listened to - so nothing starts a cycle afterwards either.
	 */
	close(): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#closed = true;
		this.#unsubscribeOnlineChange();
		this.#cancelPause?.();
		this.#endPause();
	}

	async #runAttempts(): Promise<Result<void, TransportError>>
	{
		let attempts = 0;

		for (;;)
		{
			// a listener that closed the call from inside `reconnecting` leaves nothing to recover: no
			// attempt is taken against a connection already being torn down
			if (this.#closed)
			{
				return cancelled();
			}

			const result = await this.#attempt();

			attempts += 1;

			if (this.#closed)
			{
				return cancelled();
			}

			if (isOk(result))
			{
				this.#listener.onReconnected();
				this.#logger.log(RECONNECTED, { attempts });

				return ok(undefined);
			}

			if (isFatal(result.error) || attempts >= this.#budget.maxAttempts)
			{
				this.#listener.onFailure(result.error);
				this.#logger.error(RECOVERY_LOST, { attempts, kind: result.error.kind });

				return err(result.error);
			}

			const delayMs = this.#pauseAfter(attempts);

			this.#logger.warn(ATTEMPT_FAILED, { attempt: attempts, kind: result.error.kind, delayMs });

			await this.#pause(delayMs);

			if (this.#closed)
			{
				return cancelled();
			}
		}
	}

	/** The configured pause, normalized: anything that is not a positive number is no pause at all. */
	#pauseAfter(attempts: number): number
	{
		const delayMs = this.#budget.backoffMs?.(attempts) ?? 0;

		return Number.isFinite(delayMs) && delayMs > 0 ? delayMs : 0;
	}

	/** Waits through the backoff on the clock of the port, so a test advances it instead of sitting it out. */
	#pause(delayMs: number): Promise<void>
	{
		if (delayMs === 0)
		{
			return Promise.resolve();
		}

		return new Promise((resolve) => {
			this.#wake = resolve;
			this.#cancelPause = this.#clock.scheduleOnce(() => this.#endPause(), delayMs);
		});
	}

	/** Ends the pause once, whether the timer brought it or `close` did. */
	#endPause(): void
	{
		const wake = this.#wake;

		this.#cancelPause = undefined;
		this.#wake = undefined;
		wake?.();
	}

	/**
	 * A network that came back starts a cycle; a network that went away does not, and neither does a
	 * repeated report of a network that never left. Nobody waits for a cycle started this way - it is the
	 * listener that tells the transport how it went, so the answer is dropped and only an attempt that
	 * threw is written down.
	 */
	#onOnlineChange(isOnline: boolean): void
	{
		const cameBack = isOnline && !this.#wasOnline;

		this.#wasOnline = isOnline;

		if (!cameBack)
		{
			return;
		}

		this.run().catch(() => this.#logger.error(ATTEMPT_THREW));
	}
}
