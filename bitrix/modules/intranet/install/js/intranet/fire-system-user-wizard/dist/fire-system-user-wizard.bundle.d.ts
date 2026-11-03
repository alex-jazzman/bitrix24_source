/* eslint-disable */
type FireSystemUserWizardOptions = {
	integrations?: Array<SystemUserIntegration>;
	onConfirm?: () => void;
	onCancel?: () => void;
};

type SystemUserIntegration = {
	type: 'app' | 'webhook';
	id: number;
	title: string;
};

type FireWizardConfigDto = {
	integration?: {
		hasWebhook: boolean;
	};
	systemUser?: SystemUserFireConfig;
};

type SystemUserFireConfig = {
	isSystemUser?: boolean;
	integrations?: Array<SystemUserIntegration>;
};

type FireWizardListConfigDto = {
	systemUser?: SystemUserListFireConfig;
};

type SystemUserListFireConfig = {
	userIds?: Array<number>;
	integrations?: Array<SystemUserIntegration>;
};

type FireSystemUserWizardHandlers = {
	onConfirm: () => void;
	onFallback?: () => void;
};

type UserListFireFields = {
	userIds: Array<number>;
	isSelectedAllRows: 'Y' | 'N';
	filter: Record<string, unknown>;
};

type FireWizardListConfigResponse = {
	status?: string;
	data: FireWizardListConfigDto;
	errors?: Array<{
		code: string;
		message: string;
	}>;
};

declare namespace BX.Intranet {
	class FireSystemUserWizard {
		constructor(options?: FireSystemUserWizardOptions);
		static hasSystemUser(config: FireWizardConfigDto | null | void): boolean;
		static hasSystemUsers(config: FireWizardListConfigDto | null | void): boolean;
		static showForConfig(config: FireWizardConfigDto | null | void, handlers: FireSystemUserWizardHandlers): boolean;
		static showForListConfig(config: FireWizardListConfigDto | null | void, handlers: FireSystemUserWizardHandlers): boolean;
		show(): void;
		close(): void;
	}

	class SystemUserConfigProvider {
		static fetchForList(fields: UserListFireFields): Promise<FireWizardListConfigResponse>;
	}
}
