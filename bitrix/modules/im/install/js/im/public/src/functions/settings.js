const AvailableSectionNameMap = {
	appearance: 'appearance',
	notify: 'notification',
	notification: 'notification',
	hotkey: 'hotkey',
	recent: 'recent',
	desktop: 'desktop',
};

export const prepareSettingsSection = (rawSectionName: string): string => {
	return AvailableSectionNameMap[rawSectionName] ?? '';
};
