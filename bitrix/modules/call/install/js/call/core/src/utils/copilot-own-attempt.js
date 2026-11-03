import { getCopilotAttemptDirection } from './copilot-attempt-direction';

/**
 * The mark of an own CoPilot toggle: this client asked for a state on this call, and which way it
 * asked. Commands to the recorder are not sent by the controller alone (the engine pauses the
 * recording itself when a one-to-one connection leaves the media server), so a status arriving
 * without a mark belongs to somebody else.
 *
 * The mark is keyed by the call it was raised on: it outlives the call in the controller slot, and
 * no controller event reliably coincides with that change.
 */
export class CopilotOwnAttempt
{
	#direction = null;
	#callIdentifier = null;

	/**
	 * A call that cannot be named raises no mark: there would be nothing to match the status against.
	 *
	 * @param {number} requestedRecorderState the state handed to the media server, one of RecorderStatus
	 * @param {?string|?number} callIdentifier Util.getCallIdentifier of the call being toggled
	 */
	mark(requestedRecorderState, callIdentifier)
	{
		if (isCallIdentifierEmpty(callIdentifier))
		{
			this.reset();

			return;
		}

		this.#direction = getCopilotAttemptDirection(requestedRecorderState);
		this.#callIdentifier = callIdentifier;
	}

	/**
	 * Reads the mark and drops it. The drop happens whatever the answer is: being taken by the very
	 * first status is part of the rule, not a side effect of the failure branch.
	 *
	 * @param {?string|?number} callIdentifier Util.getCallIdentifier of the call the status came from
	 * @returns {?string} CopilotAttemptDirection, or null when there was no own attempt on this call
	 */
	consume(callIdentifier)
	{
		const isOwnAttempt = !isCallIdentifierEmpty(callIdentifier) && this.#callIdentifier === callIdentifier;
		const direction = isOwnAttempt ? this.#direction : null;
		this.reset();

		return direction;
	}

	reset()
	{
		this.#direction = null;
		this.#callIdentifier = null;
	}
}

/**
 * Util.getCallIdentifier answers null when the controller holds no call, and the identifier of a
 * call is never an empty string, so an empty value names no call at all.
 */
function isCallIdentifierEmpty(callIdentifier)
{
	return callIdentifier === null || callIdentifier === undefined || callIdentifier === '';
}
