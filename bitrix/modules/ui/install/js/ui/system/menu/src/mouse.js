import { Event } from 'main.core';

type MousePosition = {
	top: number,
	left: number,
};

class Mouse
{
	#needTo: WeakSet = new WeakSet();
	#needCount: number = 0;

	#delta: MousePosition = {
		top: 0,
		left: 0,
	};

	#position: MousePosition = {
		top: 0,
		left: 0,
	};

	need(needTo: Object): void
	{
		if (this.#needTo.has(needTo))
		{
			return;
		}

		this.#needTo.add(needTo);
		this.#needCount++;

		Event.bind(window, 'mousemove', this.#update);
	}

	notNeed(needTo: Object): void
	{
		if (!this.#needTo.has(needTo))
		{
			return;
		}

		this.#needTo.delete(needTo);
		this.#needCount--;

		if (this.#needCount === 0)
		{
			Event.unbind(window, 'mousemove', this.#update);
		}
	}

	getPosition(): MousePosition
	{
		return this.#position;
	}

	getDelta(): MousePosition
	{
		return this.#delta;
	}

	#update = (event: MouseEvent): void => {
		const position = {
			top: event.clientY + window.scrollY,
			left: event.clientX + window.scrollX,
		};

		this.#delta = {
			top: position.top - this.#position.top,
			left: position.left - this.#position.left,
		};

		this.#position = position;
	};
}

export const mouse = new Mouse();
