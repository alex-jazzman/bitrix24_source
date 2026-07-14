/* eslint-disable */
type IndirectPhraseParts = {
	beforeText: string | null;
	afterText: string | null;
};

type MailIntegrationSettingsType = {
	sync: {
		enabled: boolean;
		periodValue: string;
	};
};

type SettingOption = {
	value: string;
	label: string;
};
