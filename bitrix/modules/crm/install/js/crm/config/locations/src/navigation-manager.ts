import { Type } from 'main.core';

type FilterApi = {
	setFields: (fields: Record<string, unknown>) => void,
	apply: () => void,
};

type Filter = {
	getApi: () => FilterApi,
	getFilterFieldsValues: () => Record<string, unknown>,
};

export class NavigationManager
{
	#filterId: string;
	#filter: Filter | null = null;

	constructor(filterId: string)
	{
		this.#filterId = filterId;
	}

	init(): void
	{
		this.#filter = BX.Main.filterManager.getById(this.#filterId) ?? null;
	}

	showChildren(parentId: number): void
	{
		const filter = this.#getFilter();
		const fields = {
			...filter.getFilterFieldsValues(),
			PARENT_ID_numsel: 'exact',
			PARENT_ID_from: String(this.#normalizeParentId(parentId) || ''),
			PARENT_ID_to: '',
		};

		filter.getApi().setFields(fields);
		filter.getApi().apply();
	}

	getParentId(): number
	{
		const fields = this.#getFilter().getFilterFieldsValues();
		const parentId = fields.PARENT_ID_from;
		if (
			fields.PARENT_ID_numsel !== 'exact'
			|| !Type.isString(parentId)
			|| !/^[1-9]\d*$/.test(parentId)
		)
		{
			return 0;
		}

		return Number(parentId);
	}

	#getFilter(): Filter
	{
		this.#filter ??= BX.Main.filterManager.getById(this.#filterId) ?? null;
		if (this.#filter === null)
		{
			throw new Error(`Filter "${this.#filterId}" is not initialized.`);
		}

		return this.#filter;
	}

	#normalizeParentId(value: unknown): number
	{
		const parentId = Number(value);

		return Number.isInteger(parentId) && parentId > 0 ? parentId : 0;
	}
}
