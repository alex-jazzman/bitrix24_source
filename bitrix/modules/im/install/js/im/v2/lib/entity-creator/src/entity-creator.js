import { Runtime } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import 'calendar.sliderloader';

import { runAction } from 'im.v2.lib.rest';
import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';

import type { RestClient } from 'rest.client';
import type { JsonObject } from 'main.core';

export type TaskV2Params = {
	groupId?: number,
	entityId?: number,
	subEntityId?: number,
	ta_sec: string,
	ta_el: string,
	description?: string,
	auditors?: string,
	UF_TASK_WEBDAV_FILES: string[],
};

export class EntityCreator
{
	#chatId: number = 0;
	#restClient: RestClient;

	#onCalendarEntrySaveHandler: ?Function;

	constructor(chatId: number)
	{
		this.#restClient = Core.getRestClient();
		this.#chatId = chatId;
	}

	openTaskCreationForm(): void
	{
		this.#openTaskV2Card();
	}

	createTaskForChat(): Promise
	{
		return this.#createTask();
	}

	createTaskForMessage(messageId: number): Promise
	{
		return this.#createTask(messageId);
	}

	createMeetingForChat(): Promise
	{
		return this.#createMeeting();
	}

	createMeetingForMessage(messageId: number): Promise
	{
		return this.#createMeeting(messageId);
	}

	#createMeeting(messageId?: number): Promise
	{
		const queryParams = { CHAT_ID: this.#chatId };
		if (messageId)
		{
			queryParams.MESSAGE_ID = messageId;
		}

		return this.#requestPreparedParams(RestMethod.imChatCalendarPrepare, queryParams).then((sliderParams) => {
			const { params } = sliderParams;

			const CALENDAR_ON_ENTRY_SAVE_EVENT = 'BX.Calendar:onEntrySave';

			this.#onCalendarEntrySaveHandler = this.#onCalendarEntrySave.bind(this, params.sliderId, messageId);
			EventEmitter.subscribeOnce(CALENDAR_ON_ENTRY_SAVE_EVENT, this.#onCalendarEntrySaveHandler);

			return this.#openCalendarSlider(params);
		});
	}

	#createTask(messageId?: number): Promise
	{
		const config = {
			data: { chatId: this.#chatId },
		};
		if (messageId)
		{
			config.data.messageId = messageId;
		}

		return runAction(RestMethod.imV2ChatTaskPrepare, config).then((taskParams) => {
			const { link, params } = taskParams;

			return params.is_tasks_v2
				? this.#openPrefilledTaskV2Card(params)
				: this.#openTaskSlider(link, params)
			;
		});
	}

	#requestPreparedParams(requestMethod: string, query: Object): Promise
	{
		return this.#restClient.callMethod(requestMethod, query).then((result) => {
			return result.data();
		}).catch((error) => {
			console.error(error);
		});
	}

	#openTaskSlider(sliderUri: string, sliderParams: Object)
	{
		BX.SidePanel.Instance.open(sliderUri, {
			requestMethod: 'post',
			requestParams: sliderParams,
			cacheable: false,
		});
	}

	async #openTaskV2Card(payload: JsonObject = {}): void
	{
		const { TaskCard } = await Runtime.loadExtension('tasks.v2.application.task-card');

		TaskCard.showCompactCard(payload);
	}

	#openPrefilledTaskV2Card(params: TaskV2Params)
	{
		const entityId = params.entityId ?? null;
		const subEntityId = params.subEntityId ?? null;
		const auditors = params.auditors
			? params.auditors.split(',').map((auditorId) => parseInt(auditorId.trim(), 10))
			: []
		;

		const payload = {
			groupId: params.groupId ?? null,
			description: params.description ?? null,
			auditorsIds: auditors,
			fileIds: params.UF_TASK_WEBDAV_FILES,
			analytics: {
				context: params.ta_sec,
				element: params.ta_el,
			},
			source: { type: 'chat', entityId, subEntityId },
		};

		void this.#openTaskV2Card(payload);
	}

	#openCalendarSlider(sliderParams: Object)
	{
		new (window.top.BX || window.BX).Calendar.SliderLoader(0, sliderParams).show();
	}

	#onCalendarEntrySave(sliderId: string, messageId: ?number, event: BaseEvent)
	{
		const eventData = event.getData();
		if (eventData.sliderId !== sliderId)
		{
			return;
		}

		const queryParams = {
			CALENDAR_ID: eventData.responseData.entryId,
			CHAT_ID: this.#chatId,
		};

		if (messageId)
		{
			queryParams.MESSAGE_ID = messageId;
		}

		return this.#restClient.callMethod(RestMethod.imChatCalendarAdd, queryParams).catch((error) => {
			console.error(error);
		});
	}
}
