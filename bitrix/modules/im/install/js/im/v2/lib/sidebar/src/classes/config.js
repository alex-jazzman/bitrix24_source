import { type ComponentOptions } from 'ui.vue3';

import { type SidebarMainPanelBlockType } from 'im.v2.const';

import { type BaseMenu } from 'im.v2.lib.menu';

import { BlockFilter } from './block-filter';
import { SidebarPreset } from './preset';

export class SidebarConfig
{
	#dialogId: string;
	#blocks: SidebarMainPanelBlockType[];
	#getHeaderTitle: () => string;
	#getCustomDescription: () => string;
	#areChatMembersEnabled: () => boolean;
	#isHeaderMenuEnabled: () => boolean;
	#areSharedChatsEnabled: boolean;
	#isAutoDeleteEnabled: boolean;
	#getHeaderMenu: () => ?typeof BaseMenu;
	#getMembersMenu: () => ?typeof BaseMenu;
	#getCustomBlocks: () => ComponentOptions[];

	constructor(dialogId: string, preset: ?SidebarPreset)
	{
		const presetInstance = preset ?? new SidebarPreset();

		const {
			blocks,
			getHeaderTitle,
			isHeaderMenuEnabled,
			getCustomDescription,
			areSharedChatsEnabled,
			areChatMembersEnabled,
			isAutoDeleteEnabled,
			getHeaderMenu,
			getMembersMenu,
			getCustomBlocks,
		} = presetInstance.get();

		this.#dialogId = dialogId;
		this.#blocks = blocks;
		this.#getHeaderTitle = getHeaderTitle;
		this.#areSharedChatsEnabled = areSharedChatsEnabled;
		this.#areChatMembersEnabled = areChatMembersEnabled;
		this.#getCustomDescription = getCustomDescription;
		this.#isHeaderMenuEnabled = isHeaderMenuEnabled;
		this.#isAutoDeleteEnabled = isAutoDeleteEnabled;
		this.#getHeaderMenu = getHeaderMenu;
		this.#getMembersMenu = getMembersMenu;
		this.#getCustomBlocks = getCustomBlocks;
	}

	getBlocks(): SidebarMainPanelBlockType[]
	{
		return (new BlockFilter(this.#dialogId, this.#blocks)).run();
	}

	getHeaderTitle(): string
	{
		return this.#getHeaderTitle();
	}

	getCustomDescription(): string
	{
		return this.#getCustomDescription(this.#dialogId);
	}

	isHeaderMenuEnabled(): boolean
	{
		return this.#isHeaderMenuEnabled();
	}

	isAutoDeleteEnabled(): boolean
	{
		return this.#isAutoDeleteEnabled();
	}

	areSharedChatsEnabled(): boolean
	{
		return this.#areSharedChatsEnabled();
	}

	areChatMembersEnabled(): boolean
	{
		return this.#areChatMembersEnabled(this.#dialogId);
	}

	getHeaderMenuClass(): ?typeof BaseMenu
	{
		return this.#getHeaderMenu();
	}

	getMembersMenuClass(): ?typeof BaseMenu
	{
		return this.#getMembersMenu();
	}

	getCustomBlocks(): ComponentOptions[]
	{
		return this.#getCustomBlocks();
	}
}
