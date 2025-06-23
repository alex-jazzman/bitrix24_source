import { Loc } from 'main.core';

import { baseBlocks } from '../configs/base';
import { BlockFilter } from './block-filter';

import type { SidebarMainPanelBlockType } from 'im.v2.const';

type RawConfig = {
	blocks: SidebarMainPanelBlockType[],
	headerTitle: string,
	headerMenuEnabled: boolean,
};

export class SidebarConfig
{
	#blocks: SidebarMainPanelBlockType[];
	#headerTitle: string;
	#headerMenuEnabled: boolean;

	constructor(rawConfig: RawConfig = {})
	{
		const preparedConfig = { ...this.#getDefaultConfig(), ...rawConfig };

		const { blocks, headerTitle, headerMenuEnabled } = preparedConfig;
		this.#blocks = blocks;
		this.#headerTitle = headerTitle;
		this.#headerMenuEnabled = headerMenuEnabled;
	}

	getBlocks(dialogId: string): SidebarMainPanelBlockType[]
	{
		return (new BlockFilter(dialogId, this.#blocks)).run();
	}

	getHeaderTitle(): string
	{
		return this.#headerTitle;
	}

	isMenuEnabled(): boolean
	{
		return this.#headerMenuEnabled;
	}

	#getDefaultConfig(): RawConfig
	{
		return {
			blocks: baseBlocks,
			headerTitle: Loc.getMessage('IM_SIDEBAR_HEADER_TITLE'),
			headerMenuEnabled: true,
		};
	}
}
