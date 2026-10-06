import { Type } from 'main.core';
import { type SearchFieldOptions } from './search-field-options';

export class SearchField
{
	name: string | null = null;
	type: string = 'string';
	searchable: boolean = true;
	system: boolean = false;
	sort: number | null = null;

	constructor(fieldOptions: SearchFieldOptions)
	{
		const options: Partial<SearchFieldOptions> = Type.isPlainObject(fieldOptions) ? fieldOptions : {};

		if (!Type.isStringFilled(options.name))
		{
			throw new Error('EntitySelector.SearchField: "name" parameter is required.');
		}

		this.name = options.name;
		this.setType(options.type);
		this.setSystem(options.system);
		this.setSort(options.sort);
		this.setSearchable(options.searchable);
	}

	getName(): string
	{
		return this.name!;
	}

	getType(): string
	{
		return this.type;
	}

	setType(type: string | undefined): void
	{
		if (Type.isStringFilled(type))
		{
			this.type = type;
		}
	}

	getSort(): number | null
	{
		return this.sort;
	}

	setSort(sort: number | null | undefined): void
	{
		if (Type.isNumber(sort) || sort === null)
		{
			this.sort = sort;
		}
	}

	setSearchable(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.searchable = flag;
		}
	}

	isSearchable(): boolean
	{
		return this.searchable;
	}

	setSystem(flag: boolean | undefined)
	{
		if (Type.isBoolean(flag))
		{
			this.system = flag;
		}
	}

	isCustom(): boolean
	{
		return !this.isSystem();
	}

	isSystem(): boolean
	{
		return this.system;
	}
}
