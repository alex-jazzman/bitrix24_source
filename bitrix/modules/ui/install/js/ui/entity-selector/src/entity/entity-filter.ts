import { Type } from 'main.core';
import { type EntityFilterOptions } from './entity-filter-options';

export class EntityFilter
{
	id: string | null = null;
	options: { [key: string]: any } = {};

	constructor(filterOptions: EntityFilterOptions)
	{
		const options: Partial<EntityFilterOptions> = Type.isPlainObject(filterOptions) ? filterOptions : {};

		this.id = options.id as string;
		this.options = Type.isPlainObject(options.options) ? options.options : this.options;
	}

	getId(): string | null
	{
		return this.id;
	}

	getOptions(): { [key: string]: any }
	{
		return this.options;
	}

	toJSON()
	{
		return {
			id: this.getId(),
			options: this.getOptions(),
		};
	}
}
