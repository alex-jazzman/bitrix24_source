import { Runtime, Browser } from 'main.core';
import { useAppStore } from '../../../entities/app';
import { useCommonNodeSettingsStore } from '../../../entities/common-node-settings';
import { useNodeSettingsStore, generateNextInputPortId } from '../../../entities/node-settings';
import {
	diagramStore as useDiagramStore,
	BLOCK_TYPES,
	useBufferStore,
} from '../../../entities/blocks';
import { useLoc } from '../../../shared/composables';
import { PORT_TYPES, COMPLEX_NODE_PORT_LABELS } from '../../../shared/constants';
import { useHistory, useHighlightedBlocks, useBlockDiagram } from 'ui.block-diagram';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import type { Block, BlockId, Port } from '../../../shared/types';

const HIDE_SETTINGS_DELAY = 300;
const DRAG_THRESHOLD = 5;

export class BlockMediator
{
	#loc = null;
	#history = null;
	#appStore = null;
	#commonNodeSettingsStore = null;
	#complexNodeSettingsStore = null;
	#diagramStore = null;
	#bufferStore = null;
	#highlightedBlocks = null;
	#contextMenuItems = null;
	#clickStartX = 0;
	#clickStartY = 0;
	#isShowingSettings = false;

	constructor()
	{
		this.#loc = useLoc();
		this.#history = useHistory();
		this.#appStore = useAppStore();
		this.#commonNodeSettingsStore = useCommonNodeSettingsStore();
		this.#complexNodeSettingsStore = useNodeSettingsStore();
		this.#diagramStore = useDiagramStore();
		this.#bufferStore = useBufferStore();
		const isMac = Browser.isMac();
		this.#contextMenuItems = {
			deleteBlock: {
				text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'),
				shortcut: isMac ? '⌫' : 'Del',
			},
			copyBlock: {
				text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_COPY'),
				shortcut: isMac ? '⌘ С' : 'Ctrl-C',
			},
		};
		this.#highlightedBlocks = useHighlightedBlocks();

		const { hooks } = useBlockDiagram();
		hooks.startDragBlock.on((block) => {
			const settingsBlockId = this.#commonNodeSettingsStore.block?.id
				?? this.#complexNodeSettingsStore.block?.id;

			if (settingsBlockId && settingsBlockId !== block.value.id)
			{
				this.#highlightedBlocks.clear();
				this.#highlightedBlocks.add(settingsBlockId);
			}
		});
	}

	isCurrentBlock(blockId: BlockId): boolean
	{
		return this.#commonNodeSettingsStore.isCurrentBlock(blockId)
			|| (this.#complexNodeSettingsStore.isShown && this.#complexNodeSettingsStore.isCurrentBlock(blockId));
	}

	isCurrentComplexBlock(blockId: BlockId): boolean
	{
		return this.#complexNodeSettingsStore.isShown && this.#complexNodeSettingsStore.isCurrentBlock(blockId);
	}

	hideAllSettings(): Promise<void>
	{
		return new Promise((resolve) => {
			this.#appStore.hideRightPanel();
			this.#commonNodeSettingsStore.hideSettings();
			this.#complexNodeSettingsStore.toggleVisibility(false);
			this.#complexNodeSettingsStore.reset();

			setTimeout(() => resolve(), HIDE_SETTINGS_DELAY);
		});
	}

	#resetSettingsState(): void
	{
		this.#commonNodeSettingsStore.hideSettings();
		this.#complexNodeSettingsStore.toggleVisibility(false);
		this.#complexNodeSettingsStore.reset();
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
		if (this.#isShowingSettings)
		{
			return;
		}

		this.#isShowingSettings = true;

		try
		{
			const blockActivities = ['StateInitializationActivity', 'StateFinalizationActivity', 'EventDrivenActivity'];

			if (blockActivities.includes(block.activity.Type))
			{
				await Runtime.loadExtension('sidepanel');
				const url = `/bizprocdesigner/editor/?ID=${this.#diagramStore.templateId}&editBlock=${block.id}`;
				window.BX.SidePanel.Instance.open(
					url,
					{
						customLeftBoundary: 50,
						allowChangeHistory: false,
						cacheable: false,
					},
				);

				return;
			}

			const notReallyComplexBlock = ['ForEachActivity', 'WhileActivity', 'IfElseBranchActivity'];

			if (block.type === BLOCK_TYPES.COMPLEX && !notReallyComplexBlock.includes(block.activity.Type))
			{
				await this.showComplexNodeSettings(block);

				return;
			}

			await this.showCommonNodeSettings(block);
		}
		finally
		{
			this.#isShowingSettings = false;
		}
	}

	async showCommonNodeSettings(block: Block): void
	{
		const shouldSwitch = await this.#shouldSwitchToBlock();
		if (!shouldSwitch)
		{
			return;
		}

		if (!this.#commonNodeSettingsStore.isVisible)
		{
			this.#resetSettingsState();
			this.#appStore.showRightPanel();
		}

		this.#commonNodeSettingsStore.showSettings(block);
	}

	async showComplexNodeSettings(block: Block): void
	{
		const shouldSwitch = await this.#shouldSwitchToBlock();
		if (!shouldSwitch)
		{
			return;
		}

		if (!this.#complexNodeSettingsStore.isShown)
		{
			this.#resetSettingsState();
			this.#appStore.showRightPanel();
			this.#complexNodeSettingsStore.toggleVisibility(true);
		}

		await this.#complexNodeSettingsStore.fetchNodeSettings(block);
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
		const itemId = 'deleteBlock';

		return {
			id: itemId,
			html: this.#getMenuItemHtml(itemId),
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
		const itemId = 'copyBlock';

		return {
			id: itemId,
			html: this.#getMenuItemHtml(itemId),
			onclick: (): void => {
				this.#bufferStore.setBufferContent({
					blocks: [block],
					connections: [],
				});
			},
		};
	}

	addComplexBlockPort(block: Block, title: string): void
	{
		let portId = '';
		const isConnectionPort = `${title[0]}${title[1]}` === COMPLEX_NODE_PORT_LABELS.connection;
		if (this.isCurrentComplexBlock(block.id))
		{
			portId = this.#complexNodeSettingsStore.addRule();
			if (isConnectionPort)
			{
				this.#complexNodeSettingsStore.addConnectionPort(portId, PORT_TYPES.input);
			}
			else
			{
				this.#complexNodeSettingsStore.addRulePort(portId, PORT_TYPES.input, title);
			}
		}
		else
		{
			portId = generateNextInputPortId(
				block.ports.filter((port) => port.type === PORT_TYPES.input),
			);
		}

		const isPortExists = block.ports.some((port) => port.title === title);
		if (isPortExists)
		{
			return;
		}

		this.#diagramStore.setPorts(block.id, [
			...block.ports,
			{
				id: portId,
				title,
				type: PORT_TYPES.input,
				position: 'left',
				isConnectionPort,
			},
		]);
	}

	getComplexBlockPorts(block: Block): Array<Port>
	{
		const { id, ports } = block;

		return this.#complexNodeSettingsStore.isCurrentBlock(id)
			? (this.#complexNodeSettingsStore.ports ?? ports)
			: ports;
	}

	getComplexBlockTitle(block: Block): string
	{
		const { id, node: { title } } = block;

		return this.#complexNodeSettingsStore.isCurrentBlock(id)
			? this.#complexNodeSettingsStore.nodeSettings?.title
			: title;
	}

	resetComplexBlockSettings(shouldHide: boolean = true): void
	{
		const { block: complexBlock, nodeSettings } = this.#complexNodeSettingsStore;

		if (complexBlock && nodeSettings)
		{
			this.#complexNodeSettingsStore.discardFormSettings();
			this.#diagramStore.updateNodeTitle(complexBlock, nodeSettings.title);
		}

		if (shouldHide)
		{
			this.#complexNodeSettingsStore.toggleVisibility(false);
			this.#complexNodeSettingsStore.reset();
		}
		else if (complexBlock)
		{
			this.#complexNodeSettingsStore.setCurrentRuleId('');
		}
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
			this.resetComplexBlockSettings(false);

			return true;
		}

		const shouldStay = await this.#showConfirm();
		if (!shouldStay)
		{
			this.resetComplexBlockSettings(false);
		}

		return !shouldStay;
	}

	#getMenuItemHtml(itemId: string): string
	{
		return `
			<span class="editor-chart-block-control-menu-item">
				${this.#contextMenuItems[itemId].text}
				<span class="editor-chart-block-control-menu-item__action-code">
					<span class="editor-chart-block-control-menu-item__action-code_text">
						${this.#contextMenuItems[itemId].shortcut}
					</span>
				</span>
			</span>
		`;
	}

	syncSettingsWithDiagram(): void
	{
		const complexBlockId = this.#complexNodeSettingsStore.isShown
			? this.#complexNodeSettingsStore.block?.id
			: null;
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

	handleMouseUp(event: MouseEvent, block: Block): void
	{
		if (event.button !== 0)
		{
			return;
		}

		const isGroupSelected = this.#highlightedBlocks.highlitedBlockIds.value.length > 1;
		if (isGroupSelected)
		{
			return;
		}

		const delta = Math.hypot(event.clientX - this.#clickStartX, event.clientY - this.#clickStartY);
		const isDrag = delta > DRAG_THRESHOLD;

		if (isDrag && !this.isAnySettingsOpen())
		{
			this.#highlightedBlocks.clear();

			return;
		}

		if (this.isCurrentBlock(block.id))
		{
			return;
		}

		this.#highlightedBlocks.clear();
		this.#highlightedBlocks.add(block.id);
		this.showNodeSettings(block);
	}

	handleMouseDown(event: MouseEvent): void
	{
		if (event.button !== 0)
		{
			return;
		}
		this.#clickStartX = event.clientX;
		this.#clickStartY = event.clientY;
	}

	isAnySettingsOpen(): boolean
	{
		return this.#commonNodeSettingsStore.isVisible || this.#complexNodeSettingsStore.isShown;
	}
}
