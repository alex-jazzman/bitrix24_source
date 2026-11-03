import { Runtime, Text } from 'main.core';

import { stateController } from '../state-controller';
import { type MessageContext } from '../types';

type ResultMessageService = {
	add: (taskId: number, messageId: number) => Promise<unknown>,
	delete: (taskId: number, resultId: number) => Promise<void>,
};

type ResultMessageServiceExtension = {
	resultMessageService: ResultMessageService,
};

export class LightTransport
{
	async add(taskId: number, messageContext: MessageContext): Promise<boolean>
	{
		const service = await this.#getService();
		const response = await service.add(taskId, messageContext.id);
		this.#applyAddedResult(taskId, messageContext.id, response);

		return true;
	}

	async remove(taskId: number, messageId: number, resultId: number): Promise<void>
	{
		stateController.removeResultId(taskId, resultId);

		try
		{
			const service = await this.#getService();
			await service.delete(taskId, resultId);
		}
		catch (error)
		{
			stateController.setMessageResultId(taskId, messageId, resultId);

			throw error;
		}
	}

	async #getService(): Promise<ResultMessageService>
	{
		const extension = (
			await Runtime.loadExtension('tasks.v2.provider.service.result-message-service')
		) as unknown as ResultMessageServiceExtension;

		return extension.resultMessageService;
	}

	#applyAddedResult(taskId: number, messageId: number, response: unknown): void
	{
		const resultId = Text.toInteger((response as { id?: number | string } | null)?.id);
		if (resultId > 0)
		{
			stateController.setMessageResultId(taskId, messageId, resultId);
		}
	}
}
