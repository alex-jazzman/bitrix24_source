import { type BitrixGrid } from '../type/grid';

export type BaseActionType = {
	grid: BitrixGrid | null | undefined;
};

export abstract class BaseAction
{
	grid: BitrixGrid | null | undefined;

	static getActionId(): string
	{
		throw new Error('not implemented');
	}

	constructor(params: BaseActionType)
	{
		this.grid = params.grid;
	}

	setActionParams(_params: Record<string, unknown>): void
	{}

	abstract execute(): Promise<void>;
}
