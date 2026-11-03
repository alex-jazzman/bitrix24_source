import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventName, ChatAction } from 'tasks.v2.const';
import { deadlineRules } from 'tasks.v2.lib.deadline-rules';

import { type ActionPayload } from '../type/action-payload.js';
import { BaseAction } from './base-action.js';
import { announce } from '../announcer';
import { chatHint } from '../chat-hint';
import { ExtensionLoader } from '../extension-loader';

const pickerHostExtension = 'tasks.v2.lib.deadline-picker-host';

export class ChangeDeadlineAction extends BaseAction
{
	// the calendar stack is pulled in on the first click, not on the chat load
	#pickerHostLoader: ExtensionLoader = new ExtensionLoader(pickerHostExtension, 'deadlinePickerHost');

	getName(): string
	{
		return ChatAction.ChangeDeadline;
	}

	get needsTaskData(): boolean
	{
		return true;
	}

	requiresCard(payload: ActionPayload): boolean
	{
		return false;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		if (payload.isCardMounted)
		{
			this.#emitOpenDeadlinePickerEvent(payload);

			return;
		}

		if (payload.isTaskDataReady === false)
		{
			await this.#showTaskUnavailableHint(payload);

			return;
		}

		if (!deadlineRules.canChange(payload.taskId))
		{
			await this.showRestrictionHint(payload);

			return;
		}

		const pickerHost = await this.#pickerHostLoader.load();

		if (!pickerHost)
		{
			await this.#showTaskUnavailableHint(payload);

			return;
		}

		const { deadlinePickerHost, DeadlinePickerOpenStatus } = pickerHost;

		const openStatus = await deadlinePickerHost.open(payload);

		if (
			openStatus !== DeadlinePickerOpenStatus.Opened
			&& openStatus !== DeadlinePickerOpenStatus.Superseded
		)
		{
			await this.#showTaskUnavailableHint(payload);
		}
	}

	showRestrictionHint(payload: ActionPayload): Promise<void>
	{
		const messageId = deadlineRules.isChangeCountExceeded(payload.taskId)
			? 'TASKS_V2_CHAT_ACTION_CHANGE_DEADLINE_EXCEEDED'
			: 'TASKS_V2_CHAT_ACTION_CHANGE_DEADLINE_NO_PERMISSION'
		;

		return this.#showHint(Loc.getMessage(messageId), payload);
	}

	#showTaskUnavailableHint(payload: ActionPayload): Promise<void>
	{
		return this.#showHint(Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_LOAD_FAILED'), payload);
	}

	#showHint(text: string, payload: ActionPayload): Promise<void>
	{
		void chatHint.show(text, payload);

		return announce(text, 'assertive');
	}

	#emitOpenDeadlinePickerEvent(payload: ActionPayload): void
	{
		EventEmitter.emit(
			EventName.OpenDeadlinePicker,
			{
				taskId: payload.taskId,
				bindElement: payload.bindElement,
				coordinates: payload.coordinates,
			},
		);
	}
}

export const changeDeadlineAction = new ChangeDeadlineAction();
