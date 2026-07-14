export type IndirectPhraseParts = {
	beforeText: string | null;
	afterText: string | null;
};

export type MailIntegrationSettingsType = {
	sync: {
		enabled: boolean;
		periodValue: string;
	};
};

export type SettingOption = {
	value: string;
	label: string;
};
