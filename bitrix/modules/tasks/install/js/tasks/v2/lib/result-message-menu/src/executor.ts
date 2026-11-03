import { Runtime, Text } from 'main.core';

import { Analytics } from 'tasks.v2.const';

import { LightTransport } from './transport/light-transport';
import { StoreTransport } from './transport/store-transport';
import { type MessageContext, type ResultMessageMenuAnalytics, type ResultMessageTransport } from './types';

type AnalyticsParams = {
	context: string,
	additionalContext: string,
	element: string,
};

type AnalyticsOptions = {
	isSuccess: boolean,
	cardType: string,
	taskId: number,
	element: string,
	subSection: string,
};

type AnalyticsExtension = {
	analytics: {
		sendStatusSummaryAdd: (params: AnalyticsParams, options: AnalyticsOptions) => void,
	},
};

class Executor
{
	#transport: ResultMessageTransport;
	#operations: Set<string> = new Set();

	constructor(transport: ResultMessageTransport)
	{
		this.#transport = transport;
	}

	async addFromMessage(
		taskId: number,
		messageContext: MessageContext,
		analyticsContext: ResultMessageMenuAnalytics | null = null,
	): Promise<boolean>
	{
		const operationKey = this.#getOperationKey(taskId, messageContext.id);
		if (this.#operations.has(operationKey))
		{
			return false;
		}

		this.#operations.add(operationKey);

		let isSuccess = false;
		try
		{
			isSuccess = await this.#transport.add(taskId, messageContext);
		}
		catch (error)
		{
			console.error('ResultMessageMenu.Executor.addFromMessage error', error);
		}
		finally
		{
			this.#operations.delete(operationKey);
		}

		this.#sendAnalytics(taskId, isSuccess, analyticsContext);

		return isSuccess;
	}

	async removeFromMessage(taskId: number, messageId: number, resultId: number): Promise<boolean>
	{
		const operationKey = this.#getOperationKey(taskId, messageId);
		if (this.#operations.has(operationKey))
		{
			return false;
		}

		this.#operations.add(operationKey);

		let isSuccess = false;
		try
		{
			await this.#transport.remove(taskId, messageId, resultId);
			isSuccess = true;
		}
		catch (error)
		{
			console.error('ResultMessageMenu.Executor.removeFromMessage error', error);
		}
		finally
		{
			this.#operations.delete(operationKey);
		}

		return isSuccess;
	}

	#getOperationKey(taskId: number, messageId: number): string
	{
		return `${Text.toInteger(taskId)}:${Text.toInteger(messageId)}`;
	}

	#sendAnalytics(
		taskId: number,
		isSuccess: boolean,
		analyticsContext: ResultMessageMenuAnalytics | null,
	): void
	{
		if (!analyticsContext?.cardType)
		{
			return;
		}

		const { cardType, context, additionalContext } = analyticsContext;
		Runtime.loadExtension('tasks.v2.lib.analytics')
			.then((extension: unknown) => {
				const { analytics } = extension as AnalyticsExtension;
				analytics.sendStatusSummaryAdd(
					{
						context: context ?? '',
						additionalContext: additionalContext ?? '',
						element: Analytics.Element.ChatContextMenu,
					},
					{
						isSuccess,
						cardType,
						taskId,
						element: Analytics.Element.ChatContextMenu,
						subSection: Analytics.SubSection.Chat,
					},
				);
			})
			.catch((error: unknown) => {
				console.error('ResultMessageMenu.Executor.sendAnalytics error', error);
			});
	}
}

export const executor = new Executor(new LightTransport());
export const storeExecutor = new Executor(new StoreTransport());
