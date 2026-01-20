import { Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';

import { ActionFactory } from './action/action-factory';
import { TEMPLATE_SETUP_EVENT_NAME } from './constants';
import { TemplateSetupHandler } from './handler/template-setup-handler';
import type { runActionConfig, SetFilterType, SetSortType } from './types';

export class GridManager
{
	static instances: Array<GridManager> = [];
	#grid: BX.Main.grid;

	constructor(gridId: string)
	{
		this.#grid = BX.Main.gridManager.getById(gridId)?.instance;

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

	runAction(config: runActionConfig): void
	{
		const actionId = config.actionId;
		const options = config.options;
		options.grid = this.#grid;

		const action = ActionFactory.create(actionId, options);
		if (action)
		{
			action.setActionParams({ ...config.params });
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
}
