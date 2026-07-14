/* eslint-disable */
type CrmIntegrationSettingsType = {
	enabled: boolean;
	sync: {
		enabled: boolean;
		periodValue: string;
	};
	incoming: {
		enabled: boolean;
		createAction: string;
	};
	outgoing: {
		enabled: boolean;
		createAction: string;
	};
	assignKnownClientEmails: boolean;
	vcf: boolean;
	source: string;
	leadCreationAddresses: string;
	responsibleQueue: ResponsibleQueueItem[];
};

type IndirectPhraseParts = {
	beforeText: string | null;
	afterText: string | null;
};

type ResponsibleQueueItem = {
	id: string | number;
	entityId: string;
	name: string;
};

type SettingOption = {
	value: string;
	label: string;
};

declare namespace BX.Mail.Connecting.CrmIntegration {
	const CrmIntegration: any;

	const BitrixSettingSelector: any;

	const UserSelector: any;
}
