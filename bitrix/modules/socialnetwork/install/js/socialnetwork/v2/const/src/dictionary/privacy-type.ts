export const PrivacyType = Object.freeze({
	Closed: 'closed',
	Open: 'open',
});

export type IPrivacyType = typeof PrivacyType[keyof typeof PrivacyType];
