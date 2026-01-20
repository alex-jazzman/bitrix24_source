import { Event, Type } from 'main.core';
import { View } from './views/view';

export class Navigation
{
	#views: [View] = [];
	#current: number = 0;
	#show: function;

	constructor(options)
	{
		if (Type.isArray(options.views))
		{
			this.#views = options.views.filter((view) => view instanceof View);
		}
		this.#current = Type.isInteger(options.start) ? options.start : 0;
	}

	get(index: number): ?View
	{
		return this.#views[index];
	}

	next(): void
	{
		this.move(this.#current + 1);
	}

	position(offset: number = 0): View
	{
		return this.get(this.#current + offset);
	}

	current(): View
	{
		return this.get(this.#current);
	}

	previous(): ?View
	{
		this.move(this.#current - 1);
	}

	move(index: number): void
	{
		const view = this.get(index);
		if (!view)
		{
			return;
		}

		this.#current = index;
	}

	offset(i: number): void
	{
		this.#current += i;
	}

	index(): number
	{
		return this.#current;
	}
}
