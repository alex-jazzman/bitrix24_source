import { BaseSecondaryTool } from './base-secondary-tool';

export class PerformanceReviewTool extends BaseSecondaryTool
{
	getIconClass(): string
	{
		return '--o-feedback';
	}

	getHref(): string
	{
		return this.options.path;
	}

	getId(): string
	{
		return 'performance-review';
	}
}
