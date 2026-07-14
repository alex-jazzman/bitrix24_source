export type IndirectPhraseParts = {
	beforeText: string | null;
	afterText: string | null;
};

export type SettingOption = {
	value: string;
	label: string;
};

export type ResponsibleQueueItem = {
	id: string | number;
	entityId: string;
	name: string;
};

export type CrmIntegrationSettingsType = {
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
