import { Text } from 'main.core';

import { Core } from 'tasks.v2.core';
import {
	type BaseMenuConstructor,
	type MenuExecutor,
	type MenuFactoryDependencies,
	type MenuStateController,
	type MessageContext,
	type ResultMessageMenuAnalytics,
	type StateStatusValue,
} from 'tasks.v2.lib.result-message-menu';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { resultService } from 'tasks.v2.provider.service.result-service';
import { taskService } from 'tasks.v2.provider.service.task-service';

type ResultMessageMenuFactory = (
	baseMenu: BaseMenuConstructor,
	dependencies: MenuFactoryDependencies,
) => BaseMenuConstructor;

type TaskFullCardMessageMenuDependencies = {
	ResultMessageMenu: ResultMessageMenuFactory,
	executor: MenuExecutor,
	getTaskId: () => number,
	getAnalytics?: () => ?ResultMessageMenuAnalytics,
};

export const fullCardStateController: MenuStateController = {
	getStatus(): StateStatusValue
	{
		// a StateStatus value import would make the lazily loaded extension a static dependency
		return 'loaded';
	},

	getMessageResultId(taskId: number, messageId: number): number
	{
		const task = getTask(taskId);
		if (!task)
		{
			return 0;
		}

		const normalizedMessageId = Text.toInteger(messageId);
		const map = task.resultsMessageMap || {};

		for (const [resultId, boundMessageId] of Object.entries(map))
		{
			if (Text.toInteger(boundMessageId) !== normalizedMessageId)
			{
				continue;
			}

			const messageResult = resultService.getStoreResult(Text.toInteger(resultId));
			if (messageResult && Text.toInteger(messageResult.author?.id) === getCurrentUserId())
			{
				return Text.toInteger(messageResult.id);
			}
		}

		return 0;
	},
};

export const TaskFullCardMessageMenu = (
	baseMenu: BaseMenuConstructor,
	dependencies: TaskFullCardMessageMenuDependencies,
): BaseMenuConstructor => {
	const menuClass = dependencies.ResultMessageMenu(baseMenu, {
		getTaskId: dependencies.getTaskId,
		getAnalytics: dependencies.getAnalytics,
		stateController: fullCardStateController,
		executor: createFullCardExecutor(dependencies.executor),
	});

	return class extends menuClass
	{
		getSelectItem()
		{
			return null;
		}

		getAddResultItem()
		{
			if (!getTask(dependencies.getTaskId()))
			{
				return null;
			}

			return super.getAddResultItem();
		}

		getRemoveResultItem()
		{
			if (!getTask(dependencies.getTaskId()))
			{
				return null;
			}

			return super.getRemoveResultItem();
		}
	};
};

function createFullCardExecutor(executor: MenuExecutor): MenuExecutor
{
	return {
		addFromMessage(
			taskId: number,
			messageContext: MessageContext,
			analytics?: ?ResultMessageMenuAnalytics,
		): Promise<boolean>
		{
			return executor.addFromMessage(
				taskId,
				{
					...messageContext,
					authorId: getCurrentUserId(),
				},
				analytics,
			);
		},

		removeFromMessage(
			taskId: number,
			messageId: number,
			resultId: number,
			analytics?: ?ResultMessageMenuAnalytics,
		): Promise<boolean>
		{
			return executor.removeFromMessage(taskId, messageId, resultId, analytics);
		},
	};
}

function getTask(taskId: number): ?TaskModel
{
	return taskService.getStoreTask(Text.toInteger(taskId));
}

function getCurrentUserId(): number
{
	return Text.toInteger(Core.getParams().currentUser.id);
}
