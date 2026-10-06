/* eslint-disable */
type CrmMassConfigFormOptions = {
	containerId?: string;
	initialData?: InitialData;
};

type InitialData = {
	mailboxIds: number[];
	settingsConfig: BX.Mail.Connecting.SettingsConfig.RawSettingsConfig & {
		crmAvailable?: boolean;
		canEditCrmIntegration?: boolean;
	};
};

declare namespace BX.Mail.Grid.MailboxCrmMass {
	class CrmMassConfigForm {
		constructor(options?: CrmMassConfigFormOptions);
		start(): void;
	}
}
