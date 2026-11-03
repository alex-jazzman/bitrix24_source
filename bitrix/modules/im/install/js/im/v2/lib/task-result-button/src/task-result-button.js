import { EventEmitter, type BaseEvent } from 'main.core.events';

import { TaskResultButton, type BeforeSendResult } from 'tasks.v2.application.task-result-button';

import { BeforeSendMessageAction } from 'im.v2.component.textarea';
import { EventType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

export type TaskResultButtonContext = {
	taskId: number,
	dialogId: string,
};

export class TaskResultButtonController
{
	#context: ?TaskResultButtonContext = null;
	#button: ?TaskResultButton = null;
	#subscribed: boolean = false;

	mount(container: ?HTMLElement, context: TaskResultButtonContext): void
	{
		this.#context = context;

		if (!FeatureManager.isFeatureAvailable(Feature.isTaskResultButtonAvailable))
		{
			return;
		}

		if (!this.#subscribed)
		{
			EventEmitter.subscribe(EventType.textarea.onBeforeSendMessage, this.#onBeforeSend);
			this.#subscribed = true;
		}

		this.#button?.unmounted();
		this.#button = new TaskResultButton();
		void this.#button.mounted(container, { taskId: context.taskId });
	}

	destroy(): void
	{
		if (this.#subscribed)
		{
			EventEmitter.unsubscribe(EventType.textarea.onBeforeSendMessage, this.#onBeforeSend);
			this.#subscribed = false;
		}

		this.#button?.unmounted();
		this.#button = null;
	}

	#onBeforeSend = async (event: BaseEvent<{ dialogId: string, text: string }>): Promise<string> => {
		const { dialogId, text } = event.getData();
		if (!this.#context || dialogId !== this.#context.dialogId || !this.#button)
		{
			return BeforeSendMessageAction.proceed;
		}

		const { handled, keepText }: BeforeSendResult = await this.#button.handleBeforeSend(text);
		if (!handled)
		{
			return BeforeSendMessageAction.proceed;
		}

		return keepText ? BeforeSendMessageAction.cancelKeepText : BeforeSendMessageAction.cancel;
	};
}
