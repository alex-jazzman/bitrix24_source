export const ViewMode = Object.freeze({
	Hint: 'hint',
	Rules: 'rules',
} as const);

export type ViewMode = typeof ViewMode[keyof typeof ViewMode];
