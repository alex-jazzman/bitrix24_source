import { BaseSecondaryTool } from './base-secondary-tool';

export class PerformanUserProfileTool extends BaseSecondaryTool
{
	getIconClass(): string
	{
		return '--o-achievement';
	}

	getHref(): string
	{
		return this.options.path || '/performan/';
	}

	getTarget(): string
	{
		return '_blank';
	}

	getId(): string
	{
		return 'performan-user-profile';
	}
}
