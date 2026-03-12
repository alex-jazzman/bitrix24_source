import { Dom } from 'main.core';
import { GridManager } from 'bizproc.ai-agents.grid';

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

	getGridManager(): ?GridManager
	{
		if (!this.#gridId)
		{
			return null;
		}

		return GridManager.getInstance(this.#gridId);
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
