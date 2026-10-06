/**
 * @module call/calls/controller/call-id-analytics-param
 */
jn.define('call/calls/controller/call-id-analytics-param', (require, exports, module) => {
	// The shapes a missing identifier takes on its way here: an event that failed before the call
	// existed, a call object without id/uuid, an absent field of the join payload. None of them is
	// a call of its own, and `callId_0` / `callId_null` on the dashboard links the event to nothing.
	const MISSING_IDENTIFIERS = new Set([null, undefined, '', 0]);

	/**
	 * Value of the `p5` field of a call analytics event, or `null` when there is no identifier.
	 *
	 * `null` is what "do not send the field" looks like for AnalyticsEvent: it drops every nil
	 * field when it builds the request, while an empty string or a placeholder would be sent.
	 * Mirrors the web rule (call.lib.analytics `buildCallIdParam`), so both halves of the same
	 * dashboard count the same calls.
	 *
	 * Pure (no globals, no requires) so the rule stays unit-testable.
	 *
	 * @param {string|number|null} [callId] call id (legacy) or room uuid
	 * @return {string|null} `callId_<id>`, or null when the identifier is missing
	 */
	function buildCallIdParam(callId)
	{
		return MISSING_IDENTIFIERS.has(callId) ? null : `callId_${callId}`;
	}

	module.exports = { buildCallIdParam };
});
