import { useAppStore } from '../../../entities/app';
import { useCommonNodeSettingsStore } from '../../../entities/common-node-settings';
import { useNodeSettingsStore, generateNextInputPortId } from '../../../entities/node-settings';
import { diagramStore as useDiagramStore, BLOCK_TYPES, useBufferStore } from '../../../entities/blocks';
import { useLoc } from '../../../shared/composables';
import { PORT_TYPES } from '../../../shared/constants';
import { useHistory } from 'ui.block-diagram';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import type { Block, BlockId, Port } from '../../../shared/types';

const HIDE_SETTINGS_DELAY = 300;

export class BlockMediator
{
	#loc = null;
	#history = null;
	#appStore = null;
	#commonNodeSettingsStore = null;
	#complexNodeSettingsStore = null;
	#diagramStore = null;
	#bufferStore = null;

	constructor()
	{
		this.#loc = useLoc();
		this.#history = useHistory();
		this.#appStore = useAppStore();
		this.#commonNodeSettingsStore = useCommonNodeSettingsStore();
		this.#complexNodeSettingsStore = useNodeSettingsStore();
		this.#diagramStore = useDiagramStore();
		this.#bufferStore = useBufferStore();
	}

	isCurrentBlock(blockId: BlockId): boolean
	{
		return this.#commonNodeSettingsStore.isCurrentBlock(blockId)
			|| this.#complexNodeSettingsStore.isCurrentBlock(blockId);
	}

	isCurrentComplexBlock(blockId: BlockId): boolean
	{
		return this.#complexNodeSettingsStore.isCurrentBlock(blockId);
	}

	hideAllSettings(): Promise<void>
	{
		return new Promise((resolve) => {
			this.#appStore.hideRightPanel();
			this.#commonNodeSettingsStore.hideSettings();

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
		const shouldSwitch = await this.#shouldSwitchToBlock();
		if (shouldSwitch)
		{
			await this.hideAllSettings();
			this.#appStore.showRightPanel();
			this.#commonNodeSettingsStore.showSettings(block);
		}
	}

	async showComplexNodeSettings(block: Block): void
	{
		const shouldSwitch = await this.#shouldSwitchToBlock();
		if (shouldSwitch)
		{
			await this.hideAllSettings();
			this.#appStore.showRightPanel();
			this.#complexNodeSettingsStore.toggleVisibility(true);
			await this.#complexNodeSettingsStore.fetchNodeSettings(block);
		}
	}

	#areComplexNodeSettingsDirty(block: Block): boolean
	{
		const { ports, nodeSettings } = this.#complexNodeSettingsStore;
		const { title, description } = nodeSettings;
		const blockDescription = block.activity.Properties.EditorComment ?? '';

		return ports.length !== block.ports.length
			|| title.trim() !== block.node.title.trim()
			|| description.trim() !== blockDescription.trim();
	}

	getCtxMenuItemShowSettings(block: Block): MenuItemOptions
	{
		return {
			id: 'showSettings',
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
				const isCurrentComplexBlock = this.isCurrentComplexBlock(block.id);
				this.hideCurrentBlockSettings(block.id);
				if (isCurrentComplexBlock)
				{
					this.resetComplexBlockSettings();
				}

				this.#diagramStore.deleteBlockById(block.id);
				this.#history.makeSnapshot();
			},
		};
	}

	getCommonBlockMenuOptions(block: Block): Array<MenuItemOptions>
	{
		return [
			this.getCtxMenuItemShowSettings(block),
			this.getCtxMenuItemCopyBlock(block),
			this.getCtxMenuItemDeleteBlock(block),
		];
	}

	getCtxMenuItemCopyBlock(block: Block): MenuItemOptions
	{
		return {
			id: 'copyBlock',
			text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_COPY'),
			onclick: (): void => {
				this.#bufferStore.copyBlock(block);
			},
		};
	}

	addComplexBlockPort(block: Block, title: string): void
	{
		let portId = '';
		if (this.#complexNodeSettingsStore.isCurrentBlock(block.id))
		{
			portId = this.#complexNodeSettingsStore.addRule();
			this.#complexNodeSettingsStore.addRulePort(portId, PORT_TYPES.input);
		}
		else
		{
			portId = generateNextInputPortId(
				block.ports.filter((port) => port.type === PORT_TYPES.input),
			);
		}

		this.#diagramStore.setPorts(block.id, [
			...block.ports,
			{
				id: portId,
				title,
				type: PORT_TYPES.input,
				position: 'left',
			},
		]);
	}

	getComplexBlockPorts(block: Block): Array<Port>
	{
		const { id, ports } = block;

		return this.isCurrentComplexBlock(id) ? (this.#complexNodeSettingsStore.ports ?? ports) : ports;
	}

	getComplexBlockTitle(block: Block): string
	{
		const { id, node: { title } } = block;

		return this.isCurrentComplexBlock(id) ? this.#complexNodeSettingsStore.nodeSettings?.title : title;
	}

	resetComplexBlockSettings(): void
	{
		const { block: complexBlock, nodeSettings } = this.#complexNodeSettingsStore;
		this.#complexNodeSettingsStore.discardFormSettings();
		this.#diagramStore.updateNodeTitle(complexBlock, nodeSettings.title);
		this.#complexNodeSettingsStore.toggleVisibility(false);
		this.#complexNodeSettingsStore.reset();
	}

	#showConfirm(): Promise<boolean>
	{
		return new Promise((resolve) => {
			const messageBox = new MessageBox({
				message: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_UNSAVE_CONFIRM'),
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_UNSAVE_CONFIRM_OK'),
				cancelCaption: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_UNSAVE_CONFIRM_CANCEL'),
				onOk: () => {
					resolve(true);
					messageBox.close();
				},
				onCancel: () => {
					resolve(false);
					messageBox.close();
				},
			});
			messageBox.show();
		});
	}

	async #shouldSwitchToBlock(): Promise<boolean>
	{
		const { block: complexBlock } = this.#complexNodeSettingsStore;
		if (!complexBlock)
		{
			return true;
		}

		const areComplexNodeSettingsDirty = this.#areComplexNodeSettingsDirty(complexBlock);
		if (!areComplexNodeSettingsDirty)
		{
			this.resetComplexBlockSettings();

			return true;
		}

		const shouldStay = await this.#showConfirm();
		if (!shouldStay)
		{
			this.resetComplexBlockSettings();
		}

		return !shouldStay;
	}

	syncSettingsWithDiagram(): void
	{
		const complexBlockId = this.#complexNodeSettingsStore.block?.id;
		const currentId = complexBlockId || this.#commonNodeSettingsStore.block?.id;
		if (!currentId)
		{
			return;
		}

		const blockExists = this.#diagramStore.blocks.some((block) => block.id === currentId);

		if (!blockExists)
		{
			this.hideAllSettings();
			if (complexBlockId)
			{
				this.#complexNodeSettingsStore.toggleVisibility(false);
				this.#complexNodeSettingsStore.reset();
			}
		}
	}
}
