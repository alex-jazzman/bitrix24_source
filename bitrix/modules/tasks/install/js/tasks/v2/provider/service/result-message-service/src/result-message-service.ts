import { EventEmitter } from 'main.core.events';

import { Endpoint, EventName } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';

// the server serializes an empty map as an array
export type ResultMessageMapDto = { [messageId: string]: number | string } | unknown[];

export class ResultMessageService
{
	async add(taskId: number, messageId: number): Promise<unknown>
	{
		const result = await apiClient.post(Endpoint.TaskResultMessageAdd, { message: { id: messageId } });

		EventEmitter.emit(EventName.ResultFromMessageAdded, { taskId });

		return result;
	}

	async delete(taskId: number, resultId: number): Promise<void>
	{
		await apiClient.post(Endpoint.TaskResultDelete, { result: { id: resultId } });

		EventEmitter.emit(EventName.ResultSuccessfulDeleted, { taskId });
	}

	getCurrentUserMap(taskId: number): Promise<ResultMessageMapDto>
	{
		return apiClient.post(Endpoint.TaskResultMessageGetCurrentUserMap, { taskId });
	}
}

export const resultMessageService = new ResultMessageService();
