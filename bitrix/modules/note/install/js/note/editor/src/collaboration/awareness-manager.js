import { Type } from 'main.core';
import { DocumentService } from '../application/document-service';
import {
	HEARTBEAT_INTERVAL_MS,
	STALE_CHECK_INTERVAL_MS,
	STALE_TIMEOUT_S,
	CURSOR_THROTTLE_MS,
	SYNTHETIC_CLIENT_ID_OFFSET,
} from '../const';

export class AwarenessManager
{
	#awareness: Object;
	#documentId: number;
	#userId: number;
	#userName: string;
	#userColor: string;
	#userAvatar: string | null;
	#getMode: () => string;
	#onParticipantsChange: (participants: Array) => void;
	#hasPendingUpdates: () => boolean;

	#heartbeatTimer: number | null;
	#staleCheckTimer: number | null;
	#cursorThrottleTimer: number | null;
	#pendingCursorUpdate: Object | null;
	#lastSentCursor: string | null;
	#remoteUsers: Map<number, number>;
	#awarenessUpdateHandler: Function | null;
	#isDestroyed: boolean;

	constructor({
		awareness,
		documentId,
		userId,
		userName,
		userColor,
		userAvatar = null,
		getMode = () => 'view',
		onParticipantsChange = () => {},
		hasPendingUpdates = () => false,
	}: {
		awareness: Object,
		documentId: number,
		userId: number,
		userName: string,
		userColor: string,
		userAvatar?: string | null,
		getMode?: () => string,
		onParticipantsChange?: (participants: Array) => void,
		hasPendingUpdates?: () => boolean,
	})
	{
		this.#awareness = awareness;
		this.#documentId = documentId;
		this.#userId = userId;
		this.#userName = userName;
		this.#userColor = userColor;
		this.#userAvatar = userAvatar;
		this.#getMode = getMode;
		this.#onParticipantsChange = onParticipantsChange;
		this.#hasPendingUpdates = hasPendingUpdates;

		this.#heartbeatTimer = null;
		this.#staleCheckTimer = null;
		this.#cursorThrottleTimer = null;
		this.#pendingCursorUpdate = null;
		this.#lastSentCursor = null;
		this.#remoteUsers = new Map();
		this.#awarenessUpdateHandler = null;
		this.#isDestroyed = false;
	}

	start(): void
	{
		this.#stopHeartbeat();
		this.#stopStaleCheck();
		this.#stopCursorThrottle();
		this.#unsubscribeFromLocalAwareness();

		this.#sendAwarenessMessage({
			type: 'join',
			userId: this.#userId,
			name: this.#userName,
			color: this.#userColor,
			avatar: this.#userAvatar,
			mode: this.#getMode(),
		});

		this.#startHeartbeat();
		this.#startStaleCheck();
		this.#subscribeToLocalAwareness();
	}

	clearCursor(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#sendAwarenessMessage({
			type: 'cursor',
			userId: this.#userId,
			position: null,
		});
	}

	// Called when the local user toggles view/edit — re-broadcast so peers refresh the participant chip.
	broadcastMode(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#sendAwarenessMessage({
			type: 'heartbeat',
			userId: this.#userId,
			name: this.#userName,
			color: this.#userColor,
			avatar: this.#userAvatar,
			mode: this.#getMode(),
		});
	}

	getParticipants(): Array
	{
		const participants = [];
		for (const userId of this.#remoteUsers.keys())
		{
			const syntheticClientId = this.#getSyntheticClientId(userId);
			const state = this.#awareness?.states?.get(syntheticClientId);
			const user = state?.user;
			if (!user)
			{
				continue;
			}

			participants.push({
				id: userId,
				name: String(user.name || ''),
				color: String(user.color || '#999999'),
				avatar: typeof user.avatar === 'string' && user.avatar !== '' ? user.avatar : null,
				mode: user.mode === 'edit' ? 'edit' : 'view',
				hasCursor: Boolean(state?.cursor),
			});
		}

		return participants;
	}

	leave(): void
	{
		this.#unsubscribeFromLocalAwareness();
		this.#stopHeartbeat();
		this.#stopStaleCheck();
		this.#stopCursorThrottle();

		this.#sendAwarenessMessage({
			type: 'leave',
			userId: this.#userId,
		});
	}

	destroy(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isDestroyed = true;
		this.#unsubscribeFromLocalAwareness();
		this.#stopHeartbeat();
		this.#stopStaleCheck();
		this.#stopCursorThrottle();
		this.#removeAllRemoteUsers();
		this.#awareness = null;
	}

	refreshAllCursors(): void
	{
		if (this.#isDestroyed || !this.#awareness)
		{
			return;
		}

		const updated = [];
		for (const userId of this.#remoteUsers.keys())
		{
			const syntheticClientId = this.#getSyntheticClientId(userId);
			if (this.#awareness.states.has(syntheticClientId))
			{
				this.#refreshMeta(syntheticClientId);
				updated.push(syntheticClientId);
			}
		}

		if (updated.length > 0)
		{
			this.#emitAwarenessEvents({ added: [], updated, removed: [] });
		}
	}

	handleRemoteAwareness(params: Object): void
	{
		if (this.#isDestroyed || !this.#awareness)
		{
			return;
		}

		const remoteUserId = Number(params?.userId);
		if (!remoteUserId || remoteUserId === this.#userId)
		{
			return;
		}

		const name = String(params.name || '');
		const color = String(params.color || '#999999');
		const avatar = typeof params.avatar === 'string' && params.avatar !== '' ? params.avatar : null;
		const mode = params.mode === 'edit' ? 'edit' : 'view';

		switch (params?.type)
		{
			case 'join':
				this.#addOrRefreshRemoteUser(remoteUserId, name, color, avatar, mode);
				this.#sendPresenceResponse();
				break;
			case 'heartbeat':
				this.#addOrRefreshRemoteUser(remoteUserId, name, color, avatar, mode);
				break;

			case 'presence':
				this.#addOrRefreshRemoteUser(remoteUserId, name, color, avatar, mode);
				if (params.position !== null && params.position !== undefined)
				{
					this.#updateRemoteCursor(remoteUserId, params.position);
				}
				break;

			case 'cursor':
				this.#updateRemoteCursor(remoteUserId, params.position);
				break;

			case 'leave':
				this.#removeRemoteUser(remoteUserId);
				break;

			default:
				break;
		}
	}

	#addOrRefreshRemoteUser(userId: number, name: string, color: string, avatar: string | null = null, mode: string = 'view'): void
	{
		const syntheticClientId = this.#getSyntheticClientId(userId);
		const wasNew = !this.#remoteUsers.has(userId);

		this.#remoteUsers.set(userId, this.#nowSeconds());

		const existingState = this.#awareness.states.get(syntheticClientId) || {};
		const existingUser = existingState.user || {};
		const newState = {
			...existingState,
			// Cursor-only messages don't carry name/avatar — keep the last known values on refresh.
			user: {
				id: userId,
				name: name || existingUser.name || '',
				color: color || existingUser.color || '#999999',
				avatar: avatar ?? existingUser.avatar ?? null,
				mode,
			},
		};

		this.#awareness.states.set(syntheticClientId, newState);
		this.#refreshMeta(syntheticClientId);

		this.#emitAwarenessEvents({
			added: wasNew ? [syntheticClientId] : [],
			updated: wasNew ? [] : [syntheticClientId],
			removed: [],
		});
	}

	#updateRemoteCursor(userId: number, position: mixed): void
	{
		if (!this.#remoteUsers.has(userId))
		{
			return;
		}

		const syntheticClientId = this.#getSyntheticClientId(userId);
		const existingState = this.#awareness.states.get(syntheticClientId);
		if (!existingState)
		{
			return;
		}

		if (position === null || position === undefined)
		{
			const { cursor, ...stateWithoutCursor } = existingState;
			this.#awareness.states.set(syntheticClientId, stateWithoutCursor);
			this.#refreshMeta(syntheticClientId);
			this.#emitAwarenessEvents({ added: [], updated: [syntheticClientId], removed: [] });

			return;
		}

		const newState = {
			...existingState,
			cursor: position,
		};
		this.#awareness.states.set(syntheticClientId, newState);
		this.#refreshMeta(syntheticClientId);
		this.#remoteUsers.set(userId, this.#nowSeconds());

		this.#emitAwarenessEvents({
			added: [],
			updated: [syntheticClientId],
			removed: [],
		});
	}

	#removeRemoteUser(userId: number): void
	{
		if (!this.#remoteUsers.has(userId))
		{
			return;
		}

		const syntheticClientId = this.#getSyntheticClientId(userId);

		this.#awareness.states.delete(syntheticClientId);
		this.#awareness.meta.delete(syntheticClientId);
		this.#remoteUsers.delete(userId);

		this.#emitAwarenessEvents({
			added: [],
			updated: [],
			removed: [syntheticClientId],
		});
	}

	#removeAllRemoteUsers(): void
	{
		const removed = [];
		for (const userId of this.#remoteUsers.keys())
		{
			const syntheticClientId = this.#getSyntheticClientId(userId);
			this.#awareness.states.delete(syntheticClientId);
			this.#awareness.meta.delete(syntheticClientId);
			removed.push(syntheticClientId);
		}

		this.#remoteUsers.clear();

		if (removed.length > 0)
		{
			this.#emitAwarenessEvents({
				added: [],
				updated: [],
				removed,
			});
		}
	}

	#subscribeToLocalAwareness(): void
	{
		this.#awarenessUpdateHandler = ({ added, updated, removed }, origin) => {
			if (origin === 'remote' || this.#isDestroyed)
			{
				return;
			}

			const localClientId = this.#awareness.clientID;
			if (!updated.includes(localClientId))
			{
				return;
			}

			const localState = this.#awareness.getLocalState();
			if (!localState?.cursor)
			{
				return;
			}

			if (this.#hasPendingUpdates())
			{
				return;
			}

			const cursorJson = JSON.stringify(localState.cursor);
			if (cursorJson === this.#lastSentCursor)
			{
				return;
			}

			this.#scheduleCursorSend(localState.cursor);
		};

		this.#awareness.on('update', this.#awarenessUpdateHandler);
	}

	#unsubscribeFromLocalAwareness(): void
	{
		if (this.#awarenessUpdateHandler && this.#awareness)
		{
			this.#awareness.off('update', this.#awarenessUpdateHandler);
			this.#awarenessUpdateHandler = null;
		}
	}

	#scheduleCursorSend(cursor: Object): void
	{
		this.#pendingCursorUpdate = cursor;

		if (this.#cursorThrottleTimer !== null)
		{
			return;
		}

		this.#sendCursorNow();

		this.#cursorThrottleTimer = setTimeout(() => {
			this.#cursorThrottleTimer = null;

			if (this.#pendingCursorUpdate !== null)
			{
				this.#sendCursorNow();
			}
		}, CURSOR_THROTTLE_MS);
	}

	#sendCursorNow(): void
	{
		const cursor = this.#pendingCursorUpdate;
		this.#pendingCursorUpdate = null;

		if (!cursor)
		{
			return;
		}

		this.#lastSentCursor = JSON.stringify(cursor);

		this.#sendAwarenessMessage({
			type: 'cursor',
			userId: this.#userId,
			position: cursor,
			color: this.#userColor,
		});
	}

	#sendPresenceResponse(): void
	{
		if (!Type.isFunction(BX?.PULL?.sendMessage))
		{
			return;
		}

		const remoteUserIds = [...this.#remoteUsers.keys()];
		if (remoteUserIds.length === 0)
		{
			return;
		}

		BX.PULL.sendMessage(remoteUserIds, 'note', 'documentAwareness', {
			documentId: this.#documentId,
			type: 'presence',
			userId: this.#userId,
			name: this.#userName,
			color: this.#userColor,
			avatar: this.#userAvatar,
			mode: this.#getMode(),
			position: this.#awareness?.getLocalState()?.cursor ?? null,
		});
	}

	#startHeartbeat(): void
	{
		this.#stopHeartbeat();
		this.#heartbeatTimer = setInterval(() => {
			this.#sendAwarenessMessage({
				type: 'heartbeat',
				userId: this.#userId,
				name: this.#userName,
				color: this.#userColor,
				avatar: this.#userAvatar,
				mode: this.#getMode(),
			});
		}, HEARTBEAT_INTERVAL_MS);
	}

	#stopHeartbeat(): void
	{
		if (this.#heartbeatTimer !== null)
		{
			clearInterval(this.#heartbeatTimer);
			this.#heartbeatTimer = null;
		}
	}

	#startStaleCheck(): void
	{
		this.#stopStaleCheck();
		this.#staleCheckTimer = setInterval(() => {
			this.#checkStaleUsers();
		}, STALE_CHECK_INTERVAL_MS);
	}

	#stopStaleCheck(): void
	{
		if (this.#staleCheckTimer !== null)
		{
			clearInterval(this.#staleCheckTimer);
			this.#staleCheckTimer = null;
		}
	}

	#stopCursorThrottle(): void
	{
		if (this.#cursorThrottleTimer !== null)
		{
			clearTimeout(this.#cursorThrottleTimer);
			this.#cursorThrottleTimer = null;
		}

		this.#pendingCursorUpdate = null;
	}

	#checkStaleUsers(): void
	{
		const now = this.#nowSeconds();
		const staleUserIds = [];

		for (const [userId, lastSeen] of this.#remoteUsers)
		{
			if (now - lastSeen > STALE_TIMEOUT_S)
			{
				staleUserIds.push(userId);
			}
		}

		for (const userId of staleUserIds)
		{
			this.#removeRemoteUser(userId);
		}
	}

	#emitAwarenessEvents(change: { added: number[], updated: number[], removed: number[] }): void
	{
		const { added, updated, removed } = change;

		if (added.length > 0 || updated.length > 0 || removed.length > 0)
		{
			this.#awareness.emit('change', [{ added, updated, removed }, 'remote']);
		}

		if (added.length > 0 || updated.length > 0 || removed.length > 0)
		{
			this.#awareness.emit('update', [{ added, updated, removed }, 'remote']);
		}

		if (added.length > 0 || updated.length > 0 || removed.length > 0)
		{
			this.#notifyParticipants();
		}
	}

	#notifyParticipants(): void
	{
		if (typeof this.#onParticipantsChange === 'function')
		{
			this.#onParticipantsChange(this.getParticipants());
		}
	}

	#refreshMeta(syntheticClientId: number): void
	{
		const existingMeta = this.#awareness.meta.get(syntheticClientId) || { clock: 0 };
		this.#awareness.meta.set(syntheticClientId, {
			clock: existingMeta.clock + 1,
			lastUpdated: Date.now(),
		});
	}

	#sendAwarenessMessage(data: Object): void
	{
		const remoteUserIds = [...this.#remoteUsers.keys()];

		if (data.type === 'join')
		{
			DocumentService.sendAwareness({
				documentId: this.#documentId,
				data,
			}).catch(() => {});

			return;
		}

		if (remoteUserIds.length === 0)
		{
			return;
		}

		if (Type.isFunction(BX?.PULL?.sendMessage))
		{
			const params = { ...data, documentId: this.#documentId };
			BX.PULL.sendMessage(remoteUserIds, 'note', 'documentAwareness', params);
		}
		else
		{
			DocumentService.sendAwareness({
				documentId: this.#documentId,
				data,
			}).catch(() => {});
		}
	}

	#getSyntheticClientId(userId: number): number
	{
		return userId + SYNTHETIC_CLIENT_ID_OFFSET;
	}

	#nowSeconds(): number
	{
		return Math.floor(Date.now() / 1000);
	}
}
