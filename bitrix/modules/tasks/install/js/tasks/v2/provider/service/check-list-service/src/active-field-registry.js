class ActiveFieldRegistry
{
	#registry = new Map();

	#key(itemId, field)
	{
		return `${itemId}:${field}`;
	}

	register(itemId, field)
	{
		const k = this.#key(itemId, field);
		this.#registry.set(k, (this.#registry.get(k) ?? 0) + 1);
	}

	release(itemId, field)
	{
		const k = this.#key(itemId, field);
		const count = this.#registry.get(k) ?? 0;
		if (count <= 1)
		{
			this.#registry.delete(k);
		}
		else
		{
			this.#registry.set(k, count - 1);
		}
	}

	isActive(itemId, field)
	{
		return this.#registry.has(this.#key(itemId, field));
	}
}

export const activeFieldRegistry = new ActiveFieldRegistry();
