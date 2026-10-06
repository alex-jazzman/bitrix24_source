import { Type } from 'main.core';

export class Chunk
{
	#data: Blob;
	#offset: number = 0;
	#retries: number[] = [];

	constructor(data: Blob, offset: number)
	{
		this.#data = data;
		this.#offset = offset;
	}

	getNextRetryDelay(): number | null
	{
		if (this.#retries.length === 0)
		{
			return null;
		}

		return this.#retries.shift() || null;
	}

	setRetries(retries: number[]): void
	{
		if (Type.isArray(retries))
		{
			this.#retries = retries;
		}
	}

	getData(): Blob
	{
		return this.#data;
	}

	getOffset(): number
	{
		return this.#offset;
	}

	getSize(): number
	{
		return this.getData().size;
	}
}
