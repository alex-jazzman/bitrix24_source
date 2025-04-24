import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';

import type { ImModelChat } from 'im.v2.model';

export const InputAction = {
	writing: 'writing',
	recordingVoice: 'recordingVoice',
	sendingFile: 'sendingFile',
};

export type InputActionType = $Values<typeof InputAction>;

type ActionPayload = {
	type: InputActionType,
	dialogId: string,
	userId: number,
	userName?: string,
};

const DEFAULT_ACTION_DURATION = 25000;
const ActionDurationMap = {
	[InputAction.writing]: {
		[ChatType.copilot]: 180_000,
		default: DEFAULT_ACTION_DURATION,
	},
	[InputAction.recordingVoice]: {
		default: DEFAULT_ACTION_DURATION,
	},
	[InputAction.sendingFile]: {
		default: DEFAULT_ACTION_DURATION,
	},
};

export class InputActionListener
{
	static #instance: InputActionListener;

	#actionTimers: {[timerId: string]: number} = {};

	static getInstance(): InputActionListener
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	startAction(actionPayload: ActionPayload)
	{
		const timerId = this.#buildTimerId(actionPayload);

		if (this.#isAlreadyActive(actionPayload))
		{
			this.#clearTimer(timerId);
			this.#actionTimers[timerId] = this.#setTimer(actionPayload);

			return;
		}

		Core.getStore().dispatch('chats/inputActions/start', actionPayload);

		this.#actionTimers[timerId] = this.#setTimer(actionPayload);
	}

	stopAction(actionPayload: ActionPayload)
	{
		if (!this.#isAlreadyActive(actionPayload))
		{
			return;
		}

		Core.getStore().dispatch('chats/inputActions/stop', actionPayload);
	}

	stopUserActionsInChat(payload: { userId: number, dialogId: string })
	{
		Core.getStore().dispatch('chats/inputActions/stopUserActionsInChat', payload);
	}

	clear()
	{
		Object.values(this.#actionTimers).forEach((timerId) => {
			clearTimeout(timerId);
		});
		this.#actionTimers = {};
	}

	#isAlreadyActive(payload: ActionPayload): boolean
	{
		const { type, dialogId, userId } = payload;

		return Core.getStore().getters['chats/inputActions/isActionActive']({
			type,
			dialogId,
			userId,
		});
	}

	#buildTimerId(payload: ActionPayload): string
	{
		const { type, dialogId, userId } = payload;

		return `${type}|${dialogId}|${userId}`;
	}

	#setTimer(payload: ActionPayload): number
	{
		const { type, dialogId } = payload;
		const actionDuration = this.#getActionDuration(type, dialogId);

		return setTimeout(() => {
			this.stopAction(payload);
		}, actionDuration);
	}

	#clearTimer(timerId: string): void
	{
		clearTimeout(this.#actionTimers[timerId]);
		delete this.#actionTimers[timerId];
	}

	#getActionDuration(type: InputActionType, dialogId: string): number
	{
		const typeDurationMap = ActionDurationMap[type];
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		return typeDurationMap[chat.type] ?? typeDurationMap.default;
	}
}
