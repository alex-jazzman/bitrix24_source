import { ajax } from 'main.core';

export class FireWizardConfigProvider
{
	fetch(userId: number): Promise<boolean>
	{
		return ajax.runAction('intranet.v2.User.fireWizardConfig', {
			data: {
				userId,
			},
		});
	}

	static fetch(userId: number): Promise<boolean>
	{
		return new FireWizardConfigProvider().fetch(userId);
	}
}
