import { BaseSecondaryTool } from './base-secondary-tool';

export class PerformanUserProfileTool extends BaseSecondaryTool
{
	getIconClass(): string
	{
		return '--o-achievement';
	}

	onClick(): void
	{
		window.open(this.options.path || '/performan/', '_blank');
	}

	getId(): string
	{
		return 'performan-user-profile';
	}
}
