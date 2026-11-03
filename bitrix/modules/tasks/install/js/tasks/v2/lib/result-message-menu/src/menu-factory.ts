import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { StateStatus, type BaseMenuConstructor, type MenuFactoryDependencies, type ResultMenuItem } from './types';

export const ResultMessageMenu = (
	baseMenu: BaseMenuConstructor,
	dependencies: MenuFactoryDependencies,
): BaseMenuConstructor => class extends baseMenu
{
	getAddResultItem(): ResultMenuItem | null
	{
		if (this.#shouldHideResultItem())
		{
			return null;
		}

		const taskId = dependencies.getTaskId();
		if (this.#isMapUnavailable(taskId))
		{
			return null;
		}

		const resultId = dependencies.stateController.getMessageResultId(taskId, this.context.id);
		if (resultId > 0)
		{
			return null;
		}

		return {
			title: Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_ADD_RESULT') ?? '',
			icon: Outline.FLAG,
			onClick: (): void => {
				void dependencies.executor.addFromMessage(
					taskId,
					this.context,
					dependencies.getAnalytics?.() ?? null,
				);
				this.close();
			},
		};
	}

	getRemoveResultItem(): ResultMenuItem | null
	{
		if (this.#shouldHideResultItem())
		{
			return null;
		}

		const taskId = dependencies.getTaskId();
		if (this.#isMapUnavailable(taskId))
		{
			return null;
		}

		const resultId = dependencies.stateController.getMessageResultId(taskId, this.context.id);
		if (resultId <= 0)
		{
			return null;
		}

		return {
			title: Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_DELETE_RESULT') ?? '',
			icon: Outline.FLAG_WITH_CROSS,
			onClick: (): void => {
				void dependencies.executor.removeFromMessage(
					taskId,
					this.context.id,
					resultId,
					dependencies.getAnalytics?.() ?? null,
				);
				this.close();
			},
		};
	}

	#shouldHideResultItem(): boolean
	{
		return this.isDeletedMessage() || this.context.authorId === 0;
	}

	#isMapUnavailable(taskId: number): boolean
	{
		const status = dependencies.stateController.getStatus(taskId);
		if (status === StateStatus.Error || status === StateStatus.Idle)
		{
			// retry once per menu opening: the second item getter already sees Loading
			void dependencies.stateController.hydrate?.(taskId);

			return true;
		}

		return status === StateStatus.Loading;
	}
};
