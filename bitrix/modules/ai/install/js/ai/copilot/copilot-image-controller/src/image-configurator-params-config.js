import { Loc } from 'main.core';
import { Editor } from 'ui.icon-set.api.core';

export type ImageConfiguratorParam = {
	title: string;
	icon: string;
	options?: ImageConfiguratorParamOption[];
}

export type ImageConfiguratorParamOption = {
	title: string,
	value: string,
}

export type ImageConfiguratorParamsCurrentValues = {
	format: string;
	light: string;
	composition: string;
}

export const params: {[code: string]: ImageConfiguratorParam} = {
	format: {
		title: Loc.getMessage('AI_COPILOT_IMAGE_FORMAT_OPTION_TITLE'),
		icon: Editor.INCERT_IMAGE,
		options: [
			{
				title: Loc.getMessage('AI_COPILOT_IMAGE_FORMAT_OPTION_SQUARE'),
				value: 'square',
			},
			{
				title: Loc.getMessage('AI_COPILOT_IMAGE_FORMAT_OPTION_PORTRAIT'),
				value: 'portrait',
			},
			{
				title: Loc.getMessage('AI_COPILOT_IMAGE_FORMAT_OPTION_LANDSCAPE'),
				value: 'landscape',
			},
			{
				title: Loc.getMessage('AI_COPILOT_IMAGE_FORMAT_OPTION_WIDE'),
				value: 'wide',
			},
		],
	},
	// light: {
	// 	icon: Editor.INCERT_IMAGE,
	// 	title: Loc.getMessage('AI_COPILOT_IMAGE_LIGHT_OPTION_TITLE'),
	// 	options: [
	// 		{
	// 			title: Loc.getMessage('AI_COPILOT_IMAGE_LIGHT_OPTION_COMMON'),
	// 			value: 'common',
	// 		},
	// 	],
	// },
	// composition: {
	// 	icon: Editor.INCERT_IMAGE,
	// 	title: Loc.getMessage('AI_COPILOT_IMAGE_COMPOSITION_OPTION_TITLE'),
	// 	options: [
	// 		{
	// 			title: Loc.getMessage('AI_COPILOT_IMAGE_COMPOSITION_OPTION_COMMON'),
	// 			value: 'common',
	// 		},
	// 	],
	// },
};
