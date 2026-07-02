import { Type } from 'main.core';
import { BaseEvent } from 'main.core.events';

export class PositionEvent extends BaseEvent
{
	#left: number;
	#top: number;

	get left(): number
	{
		return this.#left;
	}

	set left(value: number)
	{
		if (Type.isNumber(value))
		{
			this.#left = value;
		}
	}

	get top(): number
	{
		return this.#top;
	}

	set top(value: number): void
	{
		if (Type.isNumber(value))
		{
			this.#top = value;
		}
	}
}
