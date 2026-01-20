import { useAppStore } from '../../../entities/app';
import { useCommonNodeSettingsStore } from '../../../entities/common-node-settings';
import { useNodeSettingsStore } from '../../../entities/node-settings';
import { diagramStore as useDiagramStore } from '../../../entities/blocks';
import { useLoc } from '../../../shared/composables';
import { useHistory } from 'ui.block-diagram';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import type { Block, BlockId } from '../../../shared/types';
import { BLOCK_TYPES } from '../../../entities/blocks';

const HIDE_SETTINGS_DELAY = 300;

export class BlockMediator
{
	#loc = null;
	#history = null;
	#appStore = null;
	#commonNodeSettingsStore = null;
	#complexNodeSettingsStore = null;
	#diagramStore = null;

	constructor()
	{
		this.#loc = useLoc();
		this.#history = useHistory();
		this.#appStore = useAppStore();
		this.#commonNodeSettingsStore = useCommonNodeSettingsStore();
		this.#complexNodeSettingsStore = useNodeSettingsStore();
		this.#diagramStore = useDiagramStore();
	}

	isCurrentBlock(blockId: BlockId): boolean
	{
		return this.#commonNodeSettingsStore.isCurrentBlock(blockId)
			|| this.#complexNodeSettingsStore.isCurrentBlock(blockId);
	}

	hideAllSettings(): Promise<void>
	{
		return new Promise((resolve) => {
			this.#appStore.hideRightPanel();
			this.#commonNodeSettingsStore.hideSettings();
			this.#complexNodeSettingsStore.toggleVisibility(false);

			setTimeout(() => resolve(), HIDE_SETTINGS_DELAY);
		});
	}

	hideCurrentBlockSettings(blockId: BlockId): void
	{
		if (this.isCurrentBlock(blockId))
		{
			this.hideAllSettings();
		}
	}

	async showNodeSettings(block: Block): void
	{
		const notReallyComplexBlock = ['ForEachActivity', 'IfElseBranchActivity'];

		if (block.type === BLOCK_TYPES.COMPLEX && !notReallyComplexBlock.includes(block.activity.Type))
		{
			this.showComplexNodeSettings(block);

			return;
		}

		this.showCommonNodeSettings(block);
	}

	async showCommonNodeSettings(block: Block): void
	{
		await this.hideAllSettings();
		this.#appStore.showRightPanel();
		this.#commonNodeSettingsStore.showSettings(block);
	}

	async showComplexNodeSettings(block: Block): void
	{
		await this.hideAllSettings();
		this.#appStore.showRightPanel();
		this.#complexNodeSettingsStore.toggleVisibility(true);
		await this.#complexNodeSettingsStore.fetchNodeSettings(block);
	}

	getCtxMenuItemShowSimpleSettings(block: Block): MenuItemOptions
	{
		return {
			id: 'showSimpleSettings',
			text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_OPEN'),
			onclick: () => this.showNodeSettings(block),
		};
	}

	getCtxMenuItemShowComplexSettings(block: Block): MenuItemOptions
	{
		return {
			id: 'showComplexSettings',
			text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_OPEN'),
			onclick: () => this.showNodeSettings(block),
		};
	}

	getCtxMenuItemDeleteBlock(block: Block): MenuItemOptions
	{
		return {
			id: 'deleteBlock',
			text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'),
			onclick: () => {
				this.hideCurrentBlockSettings(block.id);
				this.#diagramStore.deleteBlockById(block.id);
				this.#history.makeSnapshot();
			},
		};
	}
}
