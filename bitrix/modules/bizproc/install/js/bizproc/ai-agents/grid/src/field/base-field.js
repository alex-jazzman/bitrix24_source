import { Dom } from 'main.core';

export class BaseField
{
	#fieldId: ?string;
	#gridId: ?string;
	#fieldNode: ?HTMLElement;

	constructor(params: {
		fieldId: string,
		gridId: string,
		fieldNode: HTMLElement,
	}) {
		this.#fieldId = params?.fieldId;
		this.#gridId = params?.gridId;
		this.#fieldNode = params?.fieldNode;
	}

	setFieldNode(node: ?HTMLElement): void
	{
		this.#fieldNode = node;
	}

	getGridId(): string
	{
		return this.#gridId;
	}

	getFieldId(): string
	{
		return this.#fieldId;
	}

	getGrid(): BX.Main.grid | null
	{
		let grid = null;

		if (this.#gridId)
		{
			grid = BX.Main.gridManager.getById(this.#gridId);
		}

		return grid?.instance;
	}

	getFieldNode(): HTMLElement
	{
		if (!this.#fieldNode)
		{
			this.#fieldNode = document.getElementById(this.getFieldId());
		}

		return this.#fieldNode;
	}

	appendToFieldNode(element: HTMLElement): void
	{
		Dom.append(element, this.getFieldNode());
	}
}
