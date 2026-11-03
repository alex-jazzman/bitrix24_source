/**
 * @module call/calls/layout/src/view-mode
 */
jn.define('src/view-mode', (require, exports, module) => {
	/**
	 * Canonical layout-mode derive (ALG-01). Single source of truth for whether a
	 * spotlight source exists, which source wins, and which view is rendered.
	 *
	 * Two axes:
	 * - `spotlightSource` ('none' | 'pin' | 'screenshare'): what the featured slot shows
	 *   under the hood; screenshare wins over pin.
	 * - `effectiveView` ('grid' | 'featured'): what is rendered / shown on the toggle.
	 *
	 * Presence is decided purely by the fact of a screenshare stream or a pin, never
	 * by `activeScreenId` (which goes stale on the native GridView - no onLayout resets it).
	 *
	 * Pure function: no `this`, no side effects - unit-testable in isolation.
	 *
	 * @param {object} input
	 * @param {number} input.screenshareCount count of active screenshare streams (`screenshareStreams.size`)
	 * @param {number} input.pinnedUserId pinned user id, 0 when nothing is pinned
	 * @param {boolean} input.manualGrid manual "force grid" flag (P2); forces grid even when a source is active
	 * @returns {{ hasSource: boolean, spotlightSource: ('none'|'pin'|'screenshare'), effectiveView: ('grid'|'featured') }}
	 */
	const deriveLayoutMode = ({ screenshareCount, pinnedUserId, manualGrid }) => {
		const hasSource = screenshareCount > 0 || pinnedUserId !== 0;

		// priority: screenshare > pin
		let spotlightSource;
		if (screenshareCount > 0)
		{
			spotlightSource = 'screenshare';
		}
		else if (pinnedUserId !== 0)
		{
			spotlightSource = 'pin';
		}
		else
		{
			spotlightSource = 'none';
		}

		// view: the manual flag can force grid, but is subordinate to the fact of a source
		const effectiveView = (!hasSource || manualGrid) ? 'grid' : 'featured';

		return { hasSource, spotlightSource, effectiveView };
	};

	/**
	 * Spotlight-period transition (ALG-02). Pure, edge-triggered companion to the layout
	 * derive (ALG-01): given the presence of a spotlight source at the previous settle
	 * point and now, plus the reconnect flag, it decides whether the manual "force grid"
	 * flag must be reset and what the next `prevHasSource` marker is. A "spotlight period"
	 * is the continuous interval while `hasSource` holds true.
	 *
	 * Edges:
	 * - 0 -> >=1 (period opens): reset manualGrid -> auto-featured.
	 * - >=1 -> 0 on a live connection: reset manualGrid -> auto-grid (button hides via hasSource).
	 * - >=1 -> 0 while reconnecting: transient zero - hold the period and manualGrid, so the
	 *   returning source is not mistaken for a new period (ERR-006).
	 *
	 * The marker latches: `prevHasSource` stays true across a reconnect that momentarily
	 * drops the source, which is why it is `hasSource || (prevHasSource && isReconnecting)`.
	 *
	 * Pure function: no `this`, no side effects - unit-testable in isolation.
	 *
	 * @param {object} input
	 * @param {boolean} input.prevHasSource presence at the previous settle point
	 * @param {boolean} input.hasSource current presence (ALG-01 `hasSource`)
	 * @param {boolean} input.isReconnecting media is reconnecting (`state.isReconnecting`)
	 * @returns {{ resetManualGrid: boolean, nextPrevHasSource: boolean }}
	 */
	const deriveSpotlightPeriod = ({ prevHasSource, hasSource, isReconnecting }) => {
		let resetManualGrid = false;

		if (!prevHasSource && hasSource)
		{
			// 0 -> >=1: a new spotlight period opens - auto-show featured
			resetManualGrid = true;
		}
		else if (prevHasSource && !hasSource && !isReconnecting)
		{
			// >=1 -> 0 on a live connection: period closed - auto-return to grid
			resetManualGrid = true;
		}
		// >=1 -> 0 while reconnecting: transient zero - hold period and manualGrid

		// prevHasSource stays latched while a reconnect momentarily drops the source
		const nextPrevHasSource = hasSource || (prevHasSource && isReconnecting);

		return { resetManualGrid, nextPrevHasSource };
	};

	/**
	 * User ids are positive integers, spelled either as a number or as a decimal string - those
	 * are the only two shapes the map keys and the snapshot payload ever legitimately carry.
	 * Everything else is "not an id" and must never reach a comparison set, because `Number()`
	 * happily invents ids out of values that are not ids at all:
	 * - `Number('')`, `Number(null)`, `Number([])`, `Number(false)` are all 0, so a blank id would
	 *   pass as the perfectly valid user 0 (the `> 0` bound alone catches these);
	 * - `Number(true)` is 1 and `Number([7])` is 7, which the numeric bound does NOT catch - a
	 *   boolean or a one-element array would silently confirm or condemn a real map entry.
	 * Hence the input is narrowed by type first, and only then by value.
	 *
	 * Whitespace around a numeric string (`'  7  '`) stays acceptable: it is still a spelling of
	 * the same id, not a foreign type.
	 *
	 * @param {*} rawId
	 * @returns {?number} normalized id, or null when the value is not an id
	 */
	const toUserId = (rawId) => {
		if (typeof rawId !== 'number' && typeof rawId !== 'string')
		{
			return null;
		}

		const userId = Number(rawId);

		return (Number.isInteger(userId) && userId > 0) ? userId : null;
	};

	/**
	 * The "no data at all" snapshot (ALG-03). A factory rather than a shared constant: the sets
	 * are handed to callers, and one shared mutable instance would be a footgun.
	 *
	 * @returns {{ hasSnapshot: boolean, participantCount: number, trackedCount: number, sharingUserIds: Set<number>, unknownUserIds: Set<number> }}
	 */
	const emptyReconnectSnapshot = () => ({
		hasSnapshot: false,
		participantCount: 0,
		trackedCount: 0,
		sharingUserIds: new Set(),
		unknownUserIds: new Set(),
	});

	/**
	 * Parse the participant snapshot delivered with a reconnect into the three-valued statement
	 * the reconciliation needs (ALG-03, step 1 of 2).
	 *
	 * The payload is external and only weakly shaped: the JWT providers publish
	 * `[Object.values(joinResponse.otherParticipants)]` - a single-element wrapper around the
	 * participant list - while providers that do not implement the snapshot publish nothing at
	 * all. Each participant may or may not carry `participantTracks`; a participant that is itself
	 * reconnecting at that instant is reported without them.
	 *
	 * Three-valued on purpose, because the snapshot's silence is not a denial:
	 * - `sharingUserIds` - the server listed a `screenTrackSource` track: definitely sharing.
	 * - `unknownUserIds` - the participant is present but carries no track info at all: the
	 *   snapshot says nothing about them and must not be used to tear their stream down.
	 * - everyone else, INCLUDING ids absent from the list entirely: definitely not sharing.
	 *   (Absence from the participant list is already read as "left the call" elsewhere in the
	 *   reconnect handler, which flips those users to `Idle`.)
	 *
	 * `hasSnapshot: false` means the payload carried no participant list at all (missing wrapper,
	 * or a wrapper that does not contain an array). A PRESENT but EMPTY list is a real statement
	 * ("everyone left, nobody shares") and yields `hasSnapshot: true` with both sets empty.
	 *
	 * `participantCount` / `trackedCount` carry no decision - they exist so the caller can log one
	 * compact summary of what the server actually said on this reconnect edge. That log is the only
	 * way to tell "the scenario did not reproduce" apart from "the snapshot never arrives, so the
	 * reconciliation is a permanent no-op" on a stand.
	 *
	 * Pure function: no `this`, no side effects - unit-testable in isolation.
	 *
	 * @param {object} [input]
	 * @param {*} [input.participantsSnapshot] raw `participantsSnapshot` from the onReconnected payload
	 * @param {?number} [input.screenTrackSource] track source that means "screen" (`MediaStreamKind.Screen`);
	 *   defaults to null, which no real `track.source` equals, so a missing constant can never be
	 *   read as "everyone is sharing"
	 * @returns {{ hasSnapshot: boolean, participantCount: number, trackedCount: number, sharingUserIds: Set<number>, unknownUserIds: Set<number> }}
	 */
	const deriveReconnectSnapshot = ({ participantsSnapshot, screenTrackSource = null } = {}) => {
		const participants = Array.isArray(participantsSnapshot) ? participantsSnapshot[0] : null;
		const sharingUserIds = new Set();
		const unknownUserIds = new Set();

		if (!Array.isArray(participants))
		{
			return emptyReconnectSnapshot();
		}

		let trackedCount = 0;

		participants.forEach((participant) => {
			const userId = toUserId(participant?.userId);
			if (userId === null)
			{
				// cannot be attributed to anyone - contributes no statement in either direction
				return;
			}

			const participantTracks = participant?.participantTracks;
			const tracks = (participantTracks && typeof participantTracks === 'object')
				? Object.values(participantTracks)
				: [];

			if (tracks.length === 0)
			{
				// present, but the server told us nothing about their tracks (an empty object is
				// `typeof 'object'` and truthy, so it has to be measured, not just type-checked)
				unknownUserIds.add(userId);

				return;
			}

			trackedCount++;

			if (tracks.some((track) => track?.source === screenTrackSource))
			{
				sharingUserIds.add(userId);
			}
		});

		return {
			hasSnapshot: true,
			participantCount: participants.length,
			trackedCount,
			sharingUserIds,
			unknownUserIds,
		};
	};

	/**
	 * Diff `screenshareStreams` against the parsed snapshot (ALG-03, step 2 of 2).
	 *
	 * Why this exists: `screenshareStreams` is only ever mutated from `setVideoStream`, and both
	 * channels that would call it when a screenshare STOPS are transient and die with the socket -
	 * the in-band `screenState: false` message is one-shot (never replayed) and the media
	 * track-removal event needs a live socket. A screenshare stopped during a media outage
	 * therefore leaves a phantom entry: the reconnect handshake re-publishes only what still
	 * exists (`Peer.setEndpoint` emits `onStreamReceived` only when there ARE remote streams -
	 * "it became empty" is never reported), so nothing ever clears the map. The phantom keeps
	 * ALG-01 `hasSource` true forever - the view toggle stays visible and the featured slot
	 * renders a dead stream. The only authoritative "who is sharing right now" is the participant
	 * snapshot delivered with the reconnect event, so the map is diffed against it on that edge.
	 *
	 * An entry is stale ONLY when the snapshot knows something definite about it: the id is absent
	 * from a present participant list, or it is present with track info that contains no screen
	 * track. No snapshot at all, or a participant reported without track info, leaves the entry in
	 * `keptKeys` - "no data" is not "nobody is sharing", and reading it that way would tear down a
	 * live screenshare that survived the outage (MT-19 steps 1-2).
	 *
	 * Key types are normalized for comparison only: `screenshareStreams` is keyed by whatever
	 * `setVideoStream` received (number from one provider path, string from another - both
	 * spellings are probed across the layout), while the snapshot carries `userId` as a string.
	 * The returned keys are the ORIGINAL map keys, so the caller can `delete` them directly.
	 *
	 * INVARIANT - the snapshot never speaks about the local user. It is built from
	 * `joinResponse.otherParticipants`, which by construction excludes self, so the rule
	 * "absent from the list -> stale" would condemn a local screenshare on every single
	 * reconnect. Today that is unreachable (callmobile cannot share its own screen: a
	 * `kind: 'sharing'` stream only ever arrives from a remote endpoint, so the local id is
	 * never a map key), and `localUserId` is the cheap insurance that keeps it unreachable
	 * the day self-sharing appears. Passing it is what pins the invariant down; omitting it
	 * silently restores the hazard.
	 *
	 * Pure function: no `this`, no side effects - unit-testable in isolation.
	 *
	 * @param {object} [input]
	 * @param {Array<number|string>} [input.screenshareKeys] current `screenshareStreams` keys
	 * @param {{ hasSnapshot: boolean, sharingUserIds: Set<number>, unknownUserIds: Set<number> }} [input.snapshot]
	 *   parsed snapshot from `deriveReconnectSnapshot`; a missing one means "no data", i.e. nothing
	 *   is reconciled away
	 * @param {number|string|null} [input.localUserId] id of the local user, never described by the
	 *   snapshot and therefore never stale
	 * @returns {{ staleKeys: Array<number|string>, keptKeys: Array<number|string> }} `staleKeys` are
	 *   to be removed from the map, `keptKeys` stay and keep `screenState: true`
	 */
	const deriveScreenshareReconciliation = ({
		screenshareKeys = [],
		snapshot = emptyReconnectSnapshot(),
		localUserId = null,
	} = {}) => {
		const { hasSnapshot, sharingUserIds, unknownUserIds } = snapshot;
		const ownUserId = toUserId(localUserId);
		const staleKeys = [];
		const keptKeys = [];

		screenshareKeys.forEach((key) => {
			const userId = toUserId(key);
			const isStale = hasSnapshot
				&& userId !== null
				&& userId !== ownUserId
				&& !sharingUserIds.has(userId)
				&& !unknownUserIds.has(userId);

			if (isStale)
			{
				staleKeys.push(key);
			}
			else
			{
				keptKeys.push(key);
			}
		});

		return { staleKeys, keptKeys };
	};

	/**
	 * One compact line describing what happened on a reconnect edge (ALG-03), for the permanent
	 * diagnostic the layout prints once per reconnect.
	 *
	 * It exists because the whole reconciliation hinges on the delivery ORDER of two independent
	 * native->JS bridges: the `joinResponse` that fills the snapshot, and the reconnect event that
	 * consumes it. If they ever arrive the other way round, the snapshot is empty on every
	 * reconnect and the fix degrades into a silent no-op - which on a stand is indistinguishable
	 * from "the scenario did not reproduce" unless something says so out loud.
	 *
	 * `payload` separates the two flavours of "no data" that the parsed snapshot cannot tell apart:
	 * - `undefined` - the provider does not publish the field at all;
	 * - `null` - the provider armed the snapshot, but no re-join response landed before the
	 *   reconnect resolved (the ordering hazard above);
	 * - `array` - the field arrived; `snapshot=no` then means the wrapper held no participant list.
	 *
	 * Counters and ids only - nothing from the payload itself is printed.
	 *
	 * Pure function: no `this`, no side effects - unit-testable in isolation.
	 *
	 * @param {object} [input]
	 * @param {*} [input.participantsSnapshot] raw payload as received
	 * @param {object} [input.snapshot] parsed snapshot from `deriveReconnectSnapshot`
	 * @param {Array<*>} [input.screenshareKeys] map keys before the pruning
	 * @param {Array<*>} [input.staleKeys] keys recognized as phantoms
	 * @returns {string}
	 */
	const describeScreenshareReconciliation = ({
		participantsSnapshot,
		snapshot = emptyReconnectSnapshot(),
		screenshareKeys = [],
		staleKeys = [],
	} = {}) => {
		let payload = typeof participantsSnapshot;
		if (participantsSnapshot === null)
		{
			payload = 'null';
		}
		else if (Array.isArray(participantsSnapshot))
		{
			payload = 'array';
		}

		return `[ALG-03] screenshare reconcile: payload=${payload}`
			+ `, snapshot=${snapshot.hasSnapshot ? 'yes' : 'no'}`
			+ `, participants=${snapshot.participantCount}`
			+ `, withTracks=${snapshot.trackedCount}`
			+ `, sharing=${snapshot.sharingUserIds.size}`
			+ `, map=${screenshareKeys.length}`
			+ `, stale=${staleKeys.length}`
			+ `, staleIds=[${staleKeys.join(', ')}]`;
	};

	module.exports = {
		deriveLayoutMode,
		deriveSpotlightPeriod,
		deriveReconnectSnapshot,
		deriveScreenshareReconciliation,
		describeScreenshareReconciliation,
	};
});
