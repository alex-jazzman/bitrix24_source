export class CallPopupQueue
{
	#pending = [];
	#showing = false;

	add(place, callback)
	{
		this.#pending.push({ place, callback });
		this.#pending.sort((a, b) => a.place - b.place);

		if (!this.#showing)
		{
			this.#next();
		}
	}

	#next()
	{
		if (this.#pending.length === 0)
		{
			this.#showing = false;

			return;
		}

		this.#showing = true;
		const { callback } = this.#pending.shift();

		callback(() => this.#next());
	}

	destroy()
	{
		this.#pending = [];
		this.#showing = false;
	}
}
