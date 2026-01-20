import { BaseSecondaryTool } from './base-secondary-tool';

export class PerformanUserProfileTool extends BaseSecondaryTool
{
	getIconClass(): string
	{
		return '--o-achievement';
	}

	onClick(): void
	{
		const userId = this.options.userId;

		BX.Runtime.loadExtension('performan.application.user-profile')
			.then(() => {
				(new BX.Performan.Application.UserProfile({ userId })).show();
			});
	}

	getId(): string
	{
		return 'performan-user-profile';
	}
}
