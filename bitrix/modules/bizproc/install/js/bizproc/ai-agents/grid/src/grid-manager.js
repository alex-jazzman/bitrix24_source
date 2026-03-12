import { Extension, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';

import { ActionFactory } from './action/action-factory';
import { TEMPLATE_SETUP_EVENT_NAME } from './constants';
import { TariffLimit } from './handler/error/tariff-limit';
import { TemplateSetupHandler } from './handler/template-setup-handler';
import type { ExtensionSettings, runActionConfig, SetFilterType, SetSortType } from './types';

export class GridManager
{
	static instances: Array<GridManager> = [];
	#settings: ExtensionSettings | null = null;
	#grid: BX.Main.grid;

	constructor(gridId: string)
	{
		this.#grid = BX.Main.gridManager.getById(gridId)?.instance;
		this.#settings = Extension.getSettings('bizproc.ai-agents.grid');

		this.#subscribeToEvents();
	}

	static getInstance(gridId: string): GridManager
	{
		if (!this.instances[gridId])
		{
			this.instances[gridId] = new GridManager(gridId);
		}

		return this.instances[gridId];
	}

	static setSort(options: SetSortType): void
	{
		const grid = BX.Main.gridManager.getById(options.gridId)?.instance;

		if (Type.isObject(grid))
		{
			grid.tableFade();
			grid.getUserOptions().setSort(options.sortBy, options.order, () => {
				grid.reload();
			});
		}
	}

	static setFilter(options: SetFilterType): void
	{
		const grid = BX.Main.gridManager.getById(options.gridId)?.instance;
		const filter = BX.Main.filterManager.getById(options.gridId);

		if (Type.isObject(grid) && Type.isObject(filter))
		{
			filter.getApi().extendFilter(options.filter);
		}
	}

	getGrid(): BX.Main.grid
	{
		return this.#grid;
	}

	runAction(actionConfig: runActionConfig): void
	{
		if (!this.validateAiAgentsAvailableByTariff())
		{
			return;
		}

		const action = actionConfig.isGroupAction ?? false
			? ActionFactory.createGroupAction(actionConfig.actionId)
			: ActionFactory.create(actionConfig.actionId)
		;

		if (action)
		{
			action.setGrid(this.#grid);
			action.setActionParams(actionConfig.params);
			action.execute();
		}
	}

	reload()
	{
		this.#grid?.reload();
	}

	#subscribeToEvents()
	{
		EventEmitter.subscribe(
			TEMPLATE_SETUP_EVENT_NAME.SUCCESS,
			(event: BaseEvent) => new TemplateSetupHandler(this.#grid).handle(event),
		);
	}

	validateAiAgentsAvailableByTariff(): boolean
	{
		const tariffInfo = this.#settings?.tariffInfo;
		if (!tariffInfo?.isAiAgentsAvailable)
		{
			TariffLimit.showFeatureSlider(tariffInfo?.aiAgentsTariffSliderCode);

			return false;
		}

		return true;
	}
}
