import { Type } from 'main.core';
import { BuilderModel, type GetterTree, type ActionTree, type MutationTree, type Store } from 'ui.vue3.vuex';

import { type AiTaskStatusValue } from 'im.v2.const';

export type AiTaskOperation = {
	status: AiTaskStatusValue | null,
	anchorMessageId: number,
	messageIds: number[],
	// the part of the composition drawn with the indication
	indicatedMessageIds: number[],
	// the newest indicated message, which carries the caption; `null` when nothing is indicated
	captionMessageId: number | null,
	isPartial: boolean,
	// visibility of the caption message, not of the anchor
	anchorVisible: boolean,
};

/**
 * A status that reached the client before the operation it belongs to. The first status of an
 * operation is sent by the very request that answers its start
 * (`MultipleMessagesCreator::sendAiQuery()` sends `Search` and keeps working afterwards), so it can
 * arrive through the pull channel while the answer - and with it `aiTask/start` - is still on its
 * way. One slot is enough: a start raises exactly one operation, and only the newest such status
 * can still be waiting for a start of its own.
 */
type AiTaskEarlyStatus = {
	anchorMessageId: number,
	status: AiTaskStatusValue,
	arrivedAt: number,
};

/**
 * How long a status may wait for its own start. Deliberately shorter than the windows the pull
 * handler and the service give an operation: this one covers the race between the answer of the
 * start request and the pull channel, which is settled in seconds, and a longer wait would let the
 * status of a finished operation reach the next one started on the same message.
 */
const EARLY_STATUS_LIFETIME = 30_000;

/**
 * The web tracks exactly ONE AI-task operation per chat (keyed by chatId): the indication is
 * shown on the source message, and a chat cannot have two of them at once. A second `start`
 * in the same chat overwrites the previous operation (its anchorMessageId), and from then on
 * pull events of the overwritten operation are dropped by the anchor check in `applyStatus`.
 * This is intentional (SDD: indication on the source message). The backend may run several
 * operations for one chat independently (e.g. voice/video), but the web does not track those -
 * only the last started one.
 */
type AiTaskModelState = {
	collection: {
		[chatId: number]: AiTaskOperation,
	},
	earlyStatus: AiTaskEarlyStatus | null,
};

function createOperation(
	anchorMessageId: number,
	messageIds: ?number[],
	indicatedMessageIds: ?number[],
): AiTaskOperation
{
	// Copied, not referenced: the composition must not change while the operation runs (EVENT-02).
	// The anchor belongs to the set by construction (`Math.max(...messageIds)`), so it is the fallback
	// for a single source.
	const composition: number[] = Type.isArrayFilled(messageIds) ? [...messageIds] : [anchorMessageId];
	const indicated: number[] = Type.isArray(indicatedMessageIds)
		? composition.filter((messageId) => indicatedMessageIds.includes(messageId))
		: [...composition];

	return {
		status: null,
		anchorMessageId,
		messageIds: composition,
		indicatedMessageIds: indicated,
		captionMessageId: indicated.length > 0 ? Math.max(...indicated) : null,
		isPartial: false,
		anchorVisible: false,
	};
}

/**
 * Hands the operation just started the status that overtook it, if the waiting one is its own. The
 * anchor decides, exactly as it does in `applyStatus`; the slot is freed either way, since a status
 * addressed to this anchor has no other start left to wait for.
 */
function applyEarlyStatus(store: Store, chatId: number, anchorMessageId: number)
{
	const early: ?AiTaskEarlyStatus = store.state.earlyStatus;
	if (!early || early.anchorMessageId !== anchorMessageId)
	{
		return;
	}

	store.commit('deleteEarlyStatus');

	// Past its lifetime the status describes a stage this operation has not reached, so the frame
	// starts where every start starts - on the entry stage, guarded by the start watchdog.
	if (Date.now() - early.arrivedAt > EARLY_STATUS_LIFETIME)
	{
		return;
	}

	store.commit('set', {
		chatId,
		operation: { ...store.state.collection[chatId], status: early.status },
	});
}

/* eslint-disable no-param-reassign */
export class AiTaskModel extends BuilderModel
{
	getName(): string
	{
		return 'aiTask';
	}

	getState(): AiTaskModelState
	{
		return {
			collection: {},
			earlyStatus: null,
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function aiTask/getForChat */
			getForChat: (state: AiTaskModelState) => (chatId: number): ?AiTaskOperation => {
				return state.collection[chatId] ?? null;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function aiTask/start */
			start: (
				store: Store,
				payload: {
					chatId: number,
					anchorMessageId: number,
					messageIds?: number[],
					indicatedMessageIds?: number[],
				},
			) => {
				const { chatId, anchorMessageId, messageIds, indicatedMessageIds } = payload;
				// `Type.isNumber` rejects NaN but passes Infinity (`typeof Infinity === 'number'`),
				// so require a finite anchor explicitly: an Infinity anchor would never match a pull
				// messageId and the indication would hang until the watchdog.
				if (!Type.isNumber(chatId) || !Number.isFinite(anchorMessageId))
				{
					return;
				}

				store.commit('set', {
					chatId,
					operation: createOperation(anchorMessageId, messageIds, indicatedMessageIds),
				});

				// A status of this operation may already be here: dropped instead of applied, it would
				// leave the operation with no status at all - the start watchdog of the service would
				// take the frame of a running operation down, and the terminal event of that operation
				// would then find nothing left in the store to report on.
				applyEarlyStatus(store, chatId, anchorMessageId);
			},
			/** @function aiTask/rememberEarlyStatus */
			rememberEarlyStatus: (
				store: Store,
				payload: { messageId: number, status: AiTaskStatusValue },
			) => {
				const { messageId, status } = payload;
				if (!Number.isFinite(messageId) || !Type.isStringFilled(status))
				{
					return;
				}

				store.commit('setEarlyStatus', {
					anchorMessageId: messageId,
					status,
					arrivedAt: Date.now(),
				});
			},
			/** @function aiTask/applyStatus */
			applyStatus: (
				store: Store,
				payload: {
					chatId: number,
					messageId: number,
					status: AiTaskStatusValue,
					isPartial?: boolean,
				},
			) => {
				const { chatId, messageId, status, isPartial } = payload;
				const operation: ?AiTaskOperation = store.state.collection[chatId];

				// Correlation by anchor: react only to the tracked operation.
				if (!operation || operation.anchorMessageId !== messageId)
				{
					return;
				}

				store.commit('set', {
					chatId,
					operation: {
						...operation,
						status,
						// The partial-result flag rides only on the terminal success (EVENT-01), so a status
						// that arrives without it resets the flag: a later operation of the same chat must not
						// inherit the partial result of the previous one.
						isPartial: isPartial === true,
					},
				});
			},
			/** @function aiTask/setAnchorVisibility */
			setAnchorVisibility: (
				store: Store,
				payload: { chatId: number, messageId: number, visible: boolean },
			) => {
				const { chatId, messageId, visible } = payload;
				const operation: ?AiTaskOperation = store.state.collection[chatId];

				// Correlated with the caption message, not with the anchor: the flag tells whether the
				// caption can be seen, and an operation without one has nothing to report.
				if (!operation || operation.captionMessageId !== messageId)
				{
					return;
				}

				const anchorVisible = visible === true;
				// Visibility is reported by an observer on every scroll pass: skip the no-op write, since
				// `set` replaces the whole operation and would otherwise re-render its readers for nothing.
				if (operation.anchorVisible === anchorVisible)
				{
					return;
				}

				store.commit('set', { chatId, operation: { ...operation, anchorVisible } });
			},
			/** @function aiTask/clear */
			clear: (store: Store, payload: { chatId: number }) => {
				const { chatId } = payload;
				if (!store.state.collection[chatId])
				{
					return;
				}

				store.commit('delete', { chatId });
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			set: (state: AiTaskModelState, payload: { chatId: number, operation: AiTaskOperation }) => {
				state.collection[payload.chatId] = payload.operation;
			},
			delete: (state: AiTaskModelState, payload: { chatId: number }) => {
				delete state.collection[payload.chatId];
			},
			setEarlyStatus: (state: AiTaskModelState, payload: AiTaskEarlyStatus) => {
				state.earlyStatus = payload;
			},
			deleteEarlyStatus: (state: AiTaskModelState) => {
				state.earlyStatus = null;
			},
		};
	}
}
