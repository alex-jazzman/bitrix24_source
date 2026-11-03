/**
 * Decides how a 1-1 Plain call peer should react to WebRTC state changes while it is
 * still on the direct (P2P) path. Terminal ICE failures escalate to the media server (SFU);
 * a transient `disconnected` is given a grace window to self-heal first.
 *
 * Pure logic, no side effects — the connection engine wires the returned action to timers
 * and `setUseMediaServer`.
 */

export const IceEscalationAction = {
	None: 'none',
	EscalateNow: 'escalate_now', // terminal failure: switch to the media server immediately (latch)
	StartGrace: 'start_grace', // disconnected: start the grace timer before escalating
	ClearGrace: 'clear_grace', // recovered: cancel a pending grace timer
};

/**
 * Reaction to an `RTCPeerConnection.connectionState` change.
 *
 * @param {string} connectionState
 * @returns {string} IceEscalationAction
 */
export function decideConnectionStateAction(connectionState)
{
	return connectionState === 'failed' ? IceEscalationAction.EscalateNow : IceEscalationAction.None;
}

/**
 * Reaction to an `RTCPeerConnection.iceConnectionState` change.
 *
 * @param {string} iceConnectionState
 * @returns {string} IceEscalationAction
 */
export function decideIceConnectionStateAction(iceConnectionState)
{
	if (iceConnectionState === 'disconnected')
	{
		return IceEscalationAction.StartGrace;
	}

	if (iceConnectionState === 'connected' || iceConnectionState === 'completed')
	{
		return IceEscalationAction.ClearGrace;
	}

	return IceEscalationAction.None;
}
