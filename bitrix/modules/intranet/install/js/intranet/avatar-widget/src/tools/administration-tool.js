import { BaseSecondaryTool } from './base-secondary-tool';

export class AdministrationTool extends BaseSecondaryTool
{
	getIconClass(): string
	{
		return '--o-filter-2-lines';
	}

	getHref(): string
	{
		return this.options.path;
	}

	getTarget(): string
	{
		return '_blank';
	}

	getId(): string
	{
		return 'administration';
	}
}
