export const ThemeType = Object.freeze({
	light: 'light',
	dark: 'dark',
});

export const ThemePattern = Object.freeze({
	default: 'default',
	aiAssistant: 'ai-assistant',
});

/**
 * Synced with \Bitrix\Im\V2\Chat\Background\BackgroundId (selectable cases).
 */
export const SelectableBackgroundId = Object.freeze({
	azure: 'azure',
	mint: 'mint',
	steel: 'steel',
	slate: 'slate',
	teal: 'teal',
	cornflower: 'cornflower',
	sky: 'sky',
	peach: 'peach',
	frost: 'frost',
});

export const SelectableBackground = Object.freeze({
	// dark ones
	[SelectableBackgroundId.azure]: {
		color: '#9fcfff',
		type: ThemeType.dark,
		pattern: ThemePattern.default,
	},
	[SelectableBackgroundId.mint]: {
		color: '#81d8bf',
		type: ThemeType.dark,
		pattern: ThemePattern.default,
	},
	[SelectableBackgroundId.steel]: {
		color: '#7fadd1',
		type: ThemeType.dark,
		pattern: ThemePattern.default,
	},
	[SelectableBackgroundId.slate]: {
		color: '#7a90b6',
		type: ThemeType.dark,
		pattern: ThemePattern.default,
	},
	[SelectableBackgroundId.teal]: {
		color: '#5f9498',
		type: ThemeType.dark,
		pattern: ThemePattern.default,
	},
	[SelectableBackgroundId.cornflower]: {
		color: '#799fe1',
		type: ThemeType.dark,
		pattern: ThemePattern.default,
	},
	// light ones
	[SelectableBackgroundId.sky]: {
		color: '#cfeefa',
		type: ThemeType.light,
		pattern: ThemePattern.default,
	},
	[SelectableBackgroundId.peach]: {
		color: '#efded3',
		type: ThemeType.light,
		pattern: ThemePattern.default,
	},
	[SelectableBackgroundId.frost]: {
		color: '#eff4f6',
		type: ThemeType.light,
		pattern: ThemePattern.default,
	},
});

// should be synced with \Bitrix\Im\V2\Chat\Background\BackgroundId
export const SpecialBackgroundId = {
	collab: 'collab',
	martaAI: 'martaAI',
	copilot: 'copilot',
	notifications: 'notifications',
};

export const SpecialBackground = {
	[SpecialBackgroundId.collab]: {
		color: '#76c68b',
		type: ThemeType.dark,
		pattern: ThemePattern.default,
	},
	[SpecialBackgroundId.martaAI]: {
		color: '#0277ff',
		type: ThemeType.dark,
		pattern: ThemePattern.aiAssistant,
	},
	[SpecialBackgroundId.copilot]: SelectableBackground[SelectableBackgroundId.slate],
	[SpecialBackgroundId.notifications]: {
		color: '#fafcfd',
		type: ThemeType.light,
		pattern: ThemePattern.default,
	},
};

/**
 * Maps background IDs to image file (without extension).
 * Images are at /bitrix/js/im/images/chat-v2-background/{name}.png
 */
export const ImageFileByBackgroundId = {
	[SpecialBackgroundId.collab]: 'collab-v2',
	[SpecialBackgroundId.martaAI]: 'ai-assistant',
	[SpecialBackgroundId.copilot]: '4',
	[SpecialBackgroundId.notifications]: '11',
	[SelectableBackgroundId.azure]: '1',
	[SelectableBackgroundId.mint]: '2',
	[SelectableBackgroundId.steel]: '3',
	[SelectableBackgroundId.slate]: '4',
	[SelectableBackgroundId.teal]: '5',
	[SelectableBackgroundId.cornflower]: '6',
	[SelectableBackgroundId.sky]: '7',
	[SelectableBackgroundId.peach]: '9',
	[SelectableBackgroundId.frost]: '11',
};

export type BackgroundItem = {
	color: string,
	type: $Values<typeof ThemeType>,
	pattern: $Values<typeof ThemePattern>,
};
