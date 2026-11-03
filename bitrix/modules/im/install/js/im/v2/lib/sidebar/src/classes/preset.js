import { type ComponentOptions } from 'ui.vue3';
import { Loc } from 'main.core';

import { type SidebarMainPanelBlockType } from 'im.v2.const';
import { type BaseMenu } from 'im.v2.lib.menu';

import { baseBlocks } from '../configs/base';

type SidebarPresetOptions = {
	blocks: SidebarMainPanelBlockType[],
	getHeaderTitle?: () => string,
	getCustomDescription?: () => string,
	areChatMembersEnabled?: () => boolean,
	isHeaderMenuEnabled?: () => boolean,
	areSharedChatsEnabled?: () => boolean,
	isAutoDeleteEnabled?: () => boolean,
	getHeaderMenu?: () => ?typeof BaseMenu,
	getMembersMenu?: () => ?typeof BaseMenu,
	getCustomBlocks?: () => ComponentOptions[],
};

export class SidebarPreset
{
	#configTemplate: SidebarPresetOptions;

	constructor(rawConfig: SidebarPresetOptions = {})
	{
		this.#configTemplate = { ...this.#getDefaultConfig(), ...rawConfig };
	}

	get(): SidebarPresetOptions
	{
		return this.#configTemplate;
	}

	#getDefaultConfig(): SidebarPresetOptions
	{
		return {
			blocks: baseBlocks,
			getHeaderTitle: () => Loc.getMessage('IM_SIDEBAR_HEADER_TITLE'),
			isHeaderMenuEnabled: () => true,
			areSharedChatsEnabled: () => true,
			areChatMembersEnabled: () => true,
			isAutoDeleteEnabled: () => true,
			getCustomDescription: () => '',
			getHeaderMenu: () => null,
			getMembersMenu: () => null,
			getCustomBlocks: () => [],
		};
	}
}
