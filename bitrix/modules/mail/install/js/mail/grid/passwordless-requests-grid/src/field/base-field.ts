import { Dom } from 'main.core';
import { type BitrixGrid } from '../type/grid';

export class BaseField
{
	private readonly fieldId: string;
	private readonly gridId: string | null | undefined;

	constructor(params: { fieldId: string; gridId: string })
	{
		this.fieldId = params.fieldId;
		this.gridId = params.gridId ?? null;
	}

	getGridId(): string | null | undefined
	{
		return this.gridId;
	}

	getFieldId(): string
	{
		return this.fieldId;
	}

	getGrid(): BitrixGrid | null
	{
		let grid = null;

		if (this.gridId)
		{
			grid = BX.Main.gridManager.getById(this.gridId);
		}

		return grid?.instance ?? null;
	}

	getFieldNode(): HTMLElement | null
	{
		return document.getElementById(this.getFieldId());
	}

	appendToFieldNode(element: HTMLElement): void
	{
		Dom.append(element, this.getFieldNode());
	}
}
