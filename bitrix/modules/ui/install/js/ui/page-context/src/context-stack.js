import { type ContextLayer } from './types';

export class ContextStack
{
	#layers: ContextLayer[] = [new Map()];

	push(): void
	{
		this.#layers.push(new Map());
	}

	pop(): void
	{
		if (this.#layers.length > 1)
		{
			this.#layers.pop();
		}
	}

	current(): ContextLayer
	{
		return this.#layers[this.#layers.length - 1];
	}

	get depth(): number
	{
		return this.#layers.length;
	}
}
