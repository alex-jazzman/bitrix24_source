/**
 * Slot policy: decides what to do with the call currently occupying the controller slot
 * when the user addresses another call (or creates a new one).
 *
 * The controller owns a single slot (`currentCall`). A ringing incoming call takes that slot
 * before the user answers it, so "slot is taken" and "call is answered" are different questions:
 *
 *  - slot is taken      -> `currentCall` exists                  -> `slot.hasCall`
 *  - call is answered   -> the call window exists (`viewPort`)   -> `slot.isAnswered`
 *  - same call as target-> identifier comparison                 -> `slot.callKey` vs `target.callKey`
 *
 * This module is intentionally dependency-free: no engine, no DOM, no `BX.*`. That is what makes it
 * importable in Node and coverable by unit tests, unlike the controller itself.
 */

/**
 * @typedef {object} SlotSnapshot
 * @property {boolean} hasCall — the slot is taken by a call
 * @property {boolean} isAnswered — the call in the slot has been answered (its window exists)
 * @property {?(string|number)} callKey — identifier of the call in the slot, see Util.getCallIdentifier()
 */

/**
 * @typedef {object} SlotTarget
 * @property {?(string|number)} callKey — identifier of the addressed call, null when a new call is created
 * @property {?(string|number)} [dialogId] — dialog the call belongs to, informational for the caller
 */

/**
 * Decisions the controller must be able to execute. Names are normative.
 * @readonly
 */
export const SlotDecision = Object.freeze({
	/** Slot is free: enter the addressed call right away. */
	Enter: 'enter',
	/** The addressed call is the answered one already in the slot: just show its window. */
	Unfold: 'unfold',
	/** The addressed call is the ringing one already in the slot: answer it, no slot release. */
	AnswerRinging: 'answerRinging',
	/** Another call is addressed while a ringing invitation holds the slot: decline it, then enter. */
	ReleaseRingingAndEnter: 'releaseRingingAndEnter',
	/** Another call is addressed while an answered call holds the slot: leave it, then enter. */
	LeaveAnsweredAndEnter: 'leaveAnsweredAndEnter',
});

/**
 * Decides what to do with the slot in order to enter the addressed target.
 *
 * Pure function: same input — same output, no side effects, no external state.
 *
 * @param {SlotSnapshot} slot
 * @param {SlotTarget} target
 * @return {string} one of SlotDecision
 */
export function decideSlotAction(slot, target)
{
	if (!slot || !slot.hasCall)
	{
		return SlotDecision.Enter;
	}

	// A target without a call key is a new call being created: it never matches the slot.
	const targetKey = target ? target.callKey : null;
	const isSameCall = targetKey !== null && targetKey !== undefined && targetKey === slot.callKey;

	if (isSameCall)
	{
		return slot.isAnswered ? SlotDecision.Unfold : SlotDecision.AnswerRinging;
	}

	return slot.isAnswered ? SlotDecision.LeaveAnsweredAndEnter : SlotDecision.ReleaseRingingAndEnter;
}
