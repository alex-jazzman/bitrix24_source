export type StageDescriptionToolbarFormatItem = {
	name: 'bold' | 'italic' | 'underline' | 'strikethrough',
	tag: 'b' | 'i' | 'u' | 's',
	messageCode: string,
};

export type StageDescriptionToolbarItem = StageDescriptionToolbarFormatItem | {
	name: 'link',
	messageCode: string,
};

export const STAGE_DESCRIPTION_TOOLBAR_ITEMS: StageDescriptionToolbarItem[] = [
	{
		name: 'bold',
		tag: 'b',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_BOLD',
	},
	{
		name: 'italic',
		tag: 'i',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_ITALIC',
	},
	{
		name: 'underline',
		tag: 'u',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_UNDERLINE',
	},
	{
		name: 'strikethrough',
		tag: 's',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_STRIKETHROUGH',
	},
	{
		name: 'link',
		messageCode: 'CRM_STAGE_EDITOR_FORMAT_LINK',
	},
];
