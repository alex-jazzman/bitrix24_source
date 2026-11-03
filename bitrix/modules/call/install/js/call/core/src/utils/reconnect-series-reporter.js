import { Analytics } from 'call.lib.analytics';
import { buildSeriesKey, ReconnectTarget } from 'call.lib.reconnect-history';

import { getUnknownErrorType } from './get-unknown-error-type';

/**
 * The named outcomes the event can carry in `status`. The literals live in the analytics markup
 * next to the other statuses and repeat the outcomes of the library, so one string addresses both.
 * A refusal of the media server is the only other outcome, and it is built below.
 */
const SeriesStatus = {
	success: 'success',
	notConnected: 'not_connected',
	notRecovered: 'not_recovered',
	escalated: 'escalated',
};

const MAX_ERROR_CODE_LENGTH = 100;
const CLIENT_UNCLASSIFIED_ERROR_CODE = 'CLIENT_UNCLASSIFIED';

/**
 * Two analytics events per reconnect series: one when it opens, one when it ends. The controller
 * decides both, because the engines limit reconnect events differently: some raise one event per
 * series, others one on every attempt.
 *
 * The series itself belongs to the reconnect history of the call object; kept here is a snapshot
 * of the series this controller saw start. Without it a recovery cannot be told from an ordinary
 * join, since the engines raise the same event for both, and an outcome could leave under the
 * identifier of the next call.
 *
 * Snapshots are addressed the way the library addresses series: by the target and, for an
 * interlocutor, by the user id, so that the series of two interlocutors never share one.
 */
export class ReconnectSeriesReporter
{
	#getCall;
	#getCallId;
	#getCallType;
	#isVpnActive;

	#snapshots = new Map();

	/**
	 * @param {Object} options
	 * @param {Function} options.getCall the call the controller holds right now, or null
	 * @param {Function} options.getCallId the analytics identifier of that call
	 * @param {Function} options.getCallType the analytics type of that call
	 * @param {Function} options.isVpnActive whether the desktop app reports a VPN
	 */
	constructor({ getCall, getCallId, getCallType, isVpnActive })
	{
		this.#getCall = getCall;
		this.#getCallId = getCallId;
		this.#getCallType = getCallType;
		this.#isVpnActive = isVpnActive;
	}

	/**
	 * A reconnect attempt reached the controller. The event goes out on the first attempt of the
	 * series only, and the series is remembered so its outcome can be reported later.
	 *
	 * @param {Object} event payload of CallEvent.onReconnecting
	 */
	reportSeriesStarted(event)
	{
		const key = readSeriesKey(event);
		const series = this.#getSeries(key);

		// An engine that keeps no history limits the event by itself: VoximplantCall raises it once
		// per series through its own reconnectionEventCount setter.
		if (!series)
		{
			this.#sendInitiation(event);

			return;
		}

		if (!this.#isSeriesCounted(key.target))
		{
			return;
		}

		this.#snapshots.set(buildSeriesKey(key), {
			...key,
			callId: this.#getCallId(),
			reason: series.reason,
			attempts: series.attempts,
			// Only a peer event carries the flag; the media server path leaves it false whatever
			// the state of the connection, so it is kept out of the media server snapshot.
			hasEverConnected: key.target === ReconnectTarget.Peer && Boolean(event?.hasEverConnected),
		});

		if (series.attempts === 1)
		{
			this.#sendInitiation(event);
		}
	}

	/**
	 * The connection is back. The library is told first, so an ordinary join does not leave the series
	 * of a failed first join open for the next real reconnect to continue. Only a series this
	 * controller saw start is reported: the same event arrives on an ordinary join as well.
	 *
	 * @param {Object} event payload of CallEvent.onReconnected
	 */
	reportSeriesRecovered(event)
	{
		const key = readSeriesKey(event);

		// The result is no guard here: the engines record the success in the library before raising the
		// event, so on the regular path the series is already closed. A second outcome is stopped by
		// the snapshot being taken.
		this.#closeSeries(key, SeriesStatus.success);

		const snapshot = this.#takeSnapshot(key);
		if (snapshot)
		{
			this.#sendResult(snapshot, SeriesStatus.success);
		}
	}

	/**
	 * The engine reached a moment that ends the series of one interlocutor: the peer gave up after
	 * too many attempts, or the call moved to the media server. The engine picks the value there,
	 * where the state that decides it lives; left here is closing the series and sending the event.
	 * A moment that names a series this controller does not hold passes in silence: the limit of
	 * attempts lives for the whole call and fires again on every later attempt.
	 *
	 * @param {Object} event payload of CallEvent.onReconnectSeriesOutcome
	 */
	reportSeriesOutcome(event)
	{
		const status = toSeriesStatus(event?.reconnectionOutcome);
		if (!status)
		{
			return;
		}

		this.#reportOutcome(readSeriesKey(event), status);
	}

	/**
	 * The media server refused the room data. The code is already collected on the error object
	 * itself; here it goes through the second step the connect event uses.
	 *
	 * @param {Object} error payload of CallEvent.onReconnectingFailed
	 */
	reportSeriesFailed(error)
	{
		this.#reportOutcome({ target: ReconnectTarget.MediaServer, userId: null }, toServerErrorStatus(error));
	}

	/**
	 * The call is gone. Every series still open at this moment never got its connection back and
	 * will not get it. The media server has no limit of attempts to give up at, so this is the only
	 * moment its series learns its outcome; a peer series can also end here when neither the limit
	 * nor a move to the media server came first.
	 *
	 * The snapshots are the list, not the library: only a snapshot carries the identifier of the
	 * call the outcome belongs to.
	 */
	reportCallLost()
	{
		// Every entry is dropped by the report of its own outcome, which a map iterator tolerates.
		for (const snapshot of this.#snapshots.values())
		{
			const { target, userId } = snapshot;

			this.#reportOutcome({ target, userId }, toLostSeriesStatus(snapshot));
		}
	}

	#reportOutcome(key, status)
	{
		const snapshot = this.#takeSnapshot(key);
		if (!snapshot)
		{
			return;
		}

		// The library owns the outcome of a series and records it once. A series that already has one
		// keeps it, so a recovery this controller missed, or an outcome sent from an earlier point,
		// never produces a second event.
		if (!this.#closeSeries(key, status))
		{
			return;
		}

		this.#sendResult(snapshot, status);
	}

	/**
	 * Reconnecting to the media server before the call was ever established is a failed join, not a
	 * series: it is reported by the connect event and has no place here. A peer series has no such
	 * rule: a connection that never came up is an outcome of its own.
	 */
	#isSeriesCounted(target)
	{
		return target !== ReconnectTarget.MediaServer || Boolean(this.#getCall()?.CallApi?.wasConnected);
	}

	/**
	 * Reads the snapshot and drops it. Dropping guards against a second outcome of the same series
	 * while the call object is already dead and the library cannot be asked. A snapshot of a call
	 * the controller has already left is dropped silently: its identifier and context would be the
	 * next call's.
	 */
	#takeSnapshot(key)
	{
		const snapshotKey = buildSeriesKey(key);
		const snapshot = this.#snapshots.get(snapshotKey);
		if (!snapshot)
		{
			return null;
		}

		this.#snapshots.delete(snapshotKey);

		const callId = this.#getCallId();
		if (!callId || callId !== snapshot.callId)
		{
			return null;
		}

		// The counter lives in the library while the call object does; the snapshot keeps the last
		// known value for when it does not.
		const attempts = this.#getSeries(key)?.attempts;

		return attempts ? { ...snapshot, attempts } : snapshot;
	}

	#getSeries(key)
	{
		return this.#getCall()?.reconnectHistory?.getSeries(key) ?? null;
	}

	#closeSeries(key, status)
	{
		return Boolean(this.#getCall()?.reconnectHistory?.closeSeries({ ...key, outcome: status }));
	}

	#sendInitiation(event)
	{
		Analytics.getInstance().onReconnect({
			callId: this.#getCallId(),
			callType: this.#getCallType(),
			reconnectionReason: event?.reconnectionReason,
			reconnectionReasonInfo: event?.reconnectionReasonInfo,
			isVpnActive: this.#isVpnActive(),
		});
	}

	#sendResult(snapshot, status)
	{
		Analytics.getInstance().onReconnectResult({
			callId: snapshot.callId,
			callType: this.#getCallType(),
			status,
			reconnectionReason: snapshot.reason,
			attemptCount: snapshot.attempts,
			isVpnActive: this.#isVpnActive(),
		});
	}
}

/**
 * The key of the series the event is about. Only the plain engines name the target: on the bitrix
 * ones the event comes from the reconnectionEventCount setter, which carries nothing but the count,
 * and the media server is the only target they have. A user id belongs to a peer series alone, so
 * an id arriving on any other target is dropped rather than turned into a key of its own.
 */
function readSeriesKey(event)
{
	const target = event?.reconnectionTarget ?? ReconnectTarget.MediaServer;
	const userId = target === ReconnectTarget.Peer ? event?.userId ?? null : null;

	return { target, userId };
}

/**
 * The engine names the outcome in the vocabulary of the library, the event carries it in the
 * vocabulary of the analytics markup. The two repeat each other value for value, so a value the
 * markup does not know is a value that must not leave.
 */
function toSeriesStatus(outcome)
{
	return Object.values(SeriesStatus).includes(outcome) ? outcome : null;
}

/**
 * The outcome of a series the loss of the call ends. The media server has one; for an interlocutor
 * the connection that never came up is a different event from the one that came up and broke.
 */
function toLostSeriesStatus(snapshot)
{
	if (snapshot.target !== ReconnectTarget.Peer)
	{
		return SeriesStatus.notRecovered;
	}

	return snapshot.hasEverConnected ? SeriesStatus.notRecovered : SeriesStatus.notConnected;
}

/**
 * The refusal is turned into a code in two steps, the same two the connect event uses. The first one
 * runs on the error object itself, where it is still whole; the second refines an unknown code by
 * the text of the message.
 */
function toServerErrorStatus(error)
{
	const errorCode = error?.code;

	if (errorCode === CLIENT_UNCLASSIFIED_ERROR_CODE && error?.message)
	{
		return `error_${getUnknownErrorType(error.message)}`;
	}

	// The code comes from the server response and is not checked against a list, so bound it
	// the same way the markup bounds p3: cut the value, not the prefix.
	return `error_${String(errorCode).slice(0, MAX_ERROR_CODE_LENGTH)}`;
}
