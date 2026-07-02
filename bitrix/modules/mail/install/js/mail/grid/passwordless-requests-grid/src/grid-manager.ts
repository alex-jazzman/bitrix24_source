import { ActionFactory } from './action/action-factory';
import type { BitrixGrid } from './type/grid';

type RunActionConfig = {
	actionId: string;
	options?: Record<string, unknown>;
	params?: Record<string, unknown>;
};

export class GridManager
{
	static instances: Record<string, GridManager> = {};
	private readonly grid: BitrixGrid | undefined;

	constructor(gridId: string)
	{
		this.grid = BX.Main.gridManager.getById(gridId)?.instance;
	}

	static getInstance(gridId: string): GridManager
	{
		if (!this.instances[gridId])
		{
			this.instances[gridId] = new GridManager(gridId);
		}

		return this.instances[gridId];
	}

	getGrid(): BitrixGrid | undefined
	{
		return this.grid;
	}

	runAction(config: RunActionConfig): void
	{
		const actionId = config.actionId;
		const action = ActionFactory.create(actionId, { grid: this.grid });
		if (action)
		{
			const params = config.params ?? {};
			action.setActionParams(params);
			action.execute();
		}
	}
}
