export type MainToolPresentation = {
	id: string,
	label: string,
	title: string,
	description: string,
	hero: string,
	background: string,
	tile: string | null,
};

const presentation: { [string]: { label: string, title: string, description: string } } = {
	crm: {
		label: 'INTRANET_MAIN_TOOL_PICKER_CRM_LABEL',
		title: 'INTRANET_MAIN_TOOL_PICKER_CRM_TITLE',
		description: 'INTRANET_MAIN_TOOL_PICKER_CRM_DESCRIPTION',
	},
	tasks: {
		label: 'INTRANET_MAIN_TOOL_PICKER_TASKS_LABEL',
		title: 'INTRANET_MAIN_TOOL_PICKER_TASKS_TITLE',
		description: 'INTRANET_MAIN_TOOL_PICKER_TASKS_DESCRIPTION',
	},
	social: {
		label: 'INTRANET_MAIN_TOOL_PICKER_SOCIAL_LABEL',
		title: 'INTRANET_MAIN_TOOL_PICKER_SOCIAL_TITLE',
		description: 'INTRANET_MAIN_TOOL_PICKER_SOCIAL_DESCRIPTION',
	},
	sites: {
		label: 'INTRANET_MAIN_TOOL_PICKER_SITES_LABEL',
		title: 'INTRANET_MAIN_TOOL_PICKER_SITES_TITLE',
		description: 'INTRANET_MAIN_TOOL_PICKER_SITES_DESCRIPTION',
	},
	sync: {
		label: 'INTRANET_MAIN_TOOL_PICKER_SYNC_LABEL',
		title: 'INTRANET_MAIN_TOOL_PICKER_SYNC_TITLE',
		description: 'INTRANET_MAIN_TOOL_PICKER_SYNC_DESCRIPTION',
	},
};

export function getMainToolPresentation(presetId: string | null): MainToolPresentation
{
	const id = presetId && Object.hasOwn(presentation, presetId) ? presetId : 'intro';
	const messages = presentation[id] ?? {
		label: 'INTRANET_MAIN_TOOL_PICKER_TOOL_LABEL',
		title: 'INTRANET_MAIN_TOOL_PICKER_INTRO_TITLE',
		description: 'INTRANET_MAIN_TOOL_PICKER_INTRO_DESCRIPTION',
	};

	return {
		...messages,
		id,
		hero: getMainToolImageUrl(`hero-${id}.webp`),
		background: getMainToolImageUrl(`background-${id}.svg`),
		tile: id === 'intro' ? null : getMainToolImageUrl(`tile-${id}.webp`),
	};
}

export function getMainToolImageUrl(fileName: string): string
{
	return `/bitrix/js/intranet/menu-preset/src/images/main-tool-picker/${fileName}`;
}
