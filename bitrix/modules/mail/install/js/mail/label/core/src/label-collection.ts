import { type LabelCounters, type LabelDto } from './types';

export class LabelCollection
{
	#labels: Map<number, LabelDto> = new Map();

	constructor(labels: LabelDto[] = [])
	{
		this.setAll(labels);
	}

	setAll(labels: LabelDto[]): void
	{
		this.#labels = new Map(labels.map((label) => [label.id, { ...label }]));
	}

	getAll(): LabelDto[]
	{
		return [...this.#labels.values()].sort((first, second) => {
			if (first.sort !== second.sort)
			{
				return first.sort - second.sort;
			}

			return first.id - second.id;
		});
	}

	getById(id: number): LabelDto | null
	{
		const label = this.#labels.get(id);

		return label ? { ...label } : null;
	}

	upsert(label: LabelDto): void
	{
		this.#labels.set(label.id, { ...label });
	}

	remove(id: number): void
	{
		this.#labels.delete(id);
	}

	updateCounters(counters: LabelCounters): void
	{
		for (const [id, unread] of Object.entries(counters))
		{
			const label = this.#labels.get(Number(id));
			if (label)
			{
				label.unread = unread;
			}
		}
	}

	isEmpty(): boolean
	{
		return this.#labels.size === 0;
	}
}
