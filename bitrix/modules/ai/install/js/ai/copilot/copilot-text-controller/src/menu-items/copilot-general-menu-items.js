import type { CopilotTextController } from 'ai.copilot.copilot-text-controller';
import {
	GenerateWithRequiredUserMessageCommand,
	GenerateWithoutRequiredUserMessage,
	OpenFeedbackFormCommand,
	OpenImageConfigurator, OpenAboutCopilot,
} from '../menu-item-commands/index';
import { CopilotMenuItems } from './copilot-menu-items';
import type { CopilotMenuItem } from 'ai.copilot';
import type { EngineInfo } from '../types/engine-info';
import type { Prompt } from 'ai.engine';
import { Loc } from 'main.core';
import { CopilotProvidersMenuItems } from './copilot-providers-menu-items';
import { Main as MainIconSet, Main } from 'ui.icon-set.api.core';

type CopilotGeneralMenuItemsOptions = {
	engines: EngineInfo[],
	prompts: Prompt[],
	selectedEngineCode: string,
	canEditSettings: boolean,
	copilotTextController: CopilotTextController,
	addImageMenuItem: boolean;
}
export class CopilotGeneralMenuItems extends CopilotMenuItems
{
	static getMenuItems(options: CopilotGeneralMenuItemsOptions): CopilotMenuItem[] {
		const {
			prompts,
			engines,
			selectedEngineCode,
			canEditSettings = false,
			copilotTextController,
			addImageMenuItem = false,
		} = options;

		const imageMenuItem = addImageMenuItem
			? [{
				code: 'image',
				text: Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_IMAGE'),
				icon: Main.MAGIC_IMAGE,
				command: new OpenImageConfigurator({
					copilotTextController,
				}),
				labelText: Loc.getMessage('AI_COPILOT_MENU_ITEM_LABEL_NEW'),
			}] : [];

		return [
			...imageMenuItem,
			...getGeneralMenuItemsFromPrompts(prompts, copilotTextController),
			...getSelectedEngineMenuItem(engines, selectedEngineCode, copilotTextController, canEditSettings),
			{
				code: 'about_open_copilot',
				text: Loc.getMessage('AI_COPILOT_MENU_ITEM_ABOUT_COPILOT'),
				icon: MainIconSet.INFO,
				command: new OpenAboutCopilot(),
			},
			{
				code: 'feedback',
				text: Loc.getMessage('AI_COPILOT_MENU_ITEM_AI_FEEDBACK'),
				icon: Main.FEEDBACK,
				command: (new OpenFeedbackFormCommand({
					copilotTextController,
					category: copilotTextController.getCategory(),
					isBeforeGeneration: false,
				})),
			},
		];
	}
}

function getGeneralMenuItemsFromPrompts(
	prompts: Prompt[],
	copilotTextController: CopilotTextController,
): CopilotMenuItem[]
{
	return prompts.map((prompt) => {
		let command = null;
		if (prompt.required)
		{
			command = prompt.type === 'simpleTemplate'
				? new GenerateWithRequiredUserMessageCommand({
					copilotTextController,
					commandCode: prompt.code,
				})
				: new GenerateWithoutRequiredUserMessage({
					copilotTextController,
					prompts,
					commandCode: prompt.code,
				});
		}

		return {
			command,
			code: prompt.code,
			text: prompt.title,
			children: getGeneralMenuItemsFromPrompts(prompt.children || [], copilotTextController),
			separator: prompt.separator,
			title: prompt.title,
			icon: prompt.icon,
			section: prompt.section,
		};
	}).filter((item) => item.code !== 'zero_prompt');
}

function getSelectedEngineMenuItem(
	engines: EngineInfo[],
	selectedEngineCode: string,
	copilotTextController: CopilotTextController,
	canEditSettings: boolean = false,
): CopilotMenuItem[]
{
	return [
		{
			separator: true,
			title: Loc.getMessage('AI_COPILOT_PROVIDER_MENU_SECTION'),
			text: Loc.getMessage('AI_COPILOT_PROVIDER_MENU_SECTION'),
		},
		{
			code: 'provider',
			text: Loc.getMessage('AI_COPILOT_MENU_ITEM_OPEN_COPILOT'),
			children: CopilotProvidersMenuItems.getMenuItems({
				engines,
				selectedEngineCode,
				canEditSettings,
				copilotTextController,
			}),
			icon: Main.COPILOT_AI,
		},
	];
}
