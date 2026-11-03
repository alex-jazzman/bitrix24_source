export type MessageThemeColors = {
	bgContentPrimary: string,
	base1: string,
	base2: string,
	base3: string,
	accentMainLink: string,
	bgSeparatorPrimary: string,
};

export type MessageThemeRequestParams = {
	colorScheme?: 'dark',
	themeColors?: MessageThemeColors,
};
