import { EventEmitter } from 'main.core.events';

import { EventName, ChatAction } from 'tasks.v2.const';

import { type ActionPayload } from '../type/action-payload.js';
import { BaseAction } from './base-action.js';

class ChangeDeadlineAction extends BaseAction
{
	getName(): string
	{
		return ChatAction.ChangeDeadline;
	}

	async execute(payload: ActionPayload): Promise<void>
	{
		if (!this.isValid(payload))
		{
			throw new Error('Invalid payload');
		}

		this.#emitOpenDeadlinePickerEvent(payload);
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
