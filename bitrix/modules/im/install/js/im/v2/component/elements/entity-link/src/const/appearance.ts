export const EntityLinkAppearance = Object.freeze({
	link: 'link',
	button: 'button',
});

export type EntityLinkAppearanceItem = (typeof EntityLinkAppearance)[keyof typeof EntityLinkAppearance];
