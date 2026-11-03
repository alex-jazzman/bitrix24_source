import { ajax } from 'main.core';

export type SystemUserIntegration = {
	type: 'app' | 'webhook',
	id: number,
	title: string,
};

export type UserListFireFields = {
	userIds: Array<number>,
	isSelectedAllRows: 'Y' | 'N',
	filter: Record<string, unknown>,
};

export type SystemUserFireConfig = {
	isSystemUser?: boolean,
	integrations?: Array<SystemUserIntegration>,
};

export type SystemUserListFireConfig = {
	userIds?: Array<number>,
	integrations?: Array<SystemUserIntegration>,
};

export type FireWizardConfigDto = {
	integration?: { hasWebhook: boolean },
	systemUser?: SystemUserFireConfig,
};

export type FireWizardListConfigDto = {
	systemUser?: SystemUserListFireConfig,
};

export type FireWizardListConfigResponse = {
	status?: string,
	data: FireWizardListConfigDto,
	errors?: Array<{ code: string, message: string }>,
};

export class SystemUserConfigProvider
{
	static fetchForList(fields: UserListFireFields): Promise<FireWizardListConfigResponse>
	{
		return ajax.runAction('intranet.v2.UserList.fireWizardConfig', {
			data: {
				fields,
			},
		});
	}
}
