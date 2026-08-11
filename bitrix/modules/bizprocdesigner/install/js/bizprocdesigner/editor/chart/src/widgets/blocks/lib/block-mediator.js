import { Runtime, Browser } from 'main.core';
import { useHistory, useHighlightedBlocks, useBlockDiagram } from 'ui.block-diagram';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { toValue } from 'ui.vue3';
import { type MenuItemOptions } from 'ui.vue3.components.menu';

import { useAppStore } from '../../../entities/app';
import {
	diagramStore as useDiagramStore,
	useBufferStore,
} from '../../../entities/blocks';
import { useCommonNodeSettingsStore } from '../../../entities/common-node-settings';
import { useNodeSettingsStore, generateNextInputPortId } from '../../../entities/node-settings';
import { useLoc } from '../../../shared/composables';
import {
	PORT_TYPES,
	COMPLEX_NODE_PORT_LABELS,
	BLOCK_TYPES,
	BLOCK_TYPES_WITHOUT_SETTINGS,
} from '../../../shared/constants';
import { useNodeDataInspectorStore } from '../../../shared/stores/node-data-inspector-store';
import { useDefaultTitle } from '../../../features/catalog';
import { type Block, type BlockId, type Port } from '../../../shared/types';
import { getContextMenuItemHtml } from './get-context-menu-item-html';

const HIDE_SETTINGS_DELAY = 300;
const DRAG_THRESHOLD = 5;

export class BlockMediator
{
	#loc = null;
	#history = null;
	#appStore = null;
	#commonNodeSettingsStore = null;
	#complexNodeSettingsStore = null;
	#blockDiagram = null;
	#nodeInspectorStore = null;
	#diagramStore = null;
	#bufferStore = null;
	#highlightedBlocks = null;
	#isMac = false;
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
		this.#blockDiagram = useBlockDiagram();
		this.#bufferStore = useBufferStore();
		this.#isMac = Browser.isMac();
		this.#highlightedBlocks = useHighlightedBlocks();

		this.#blockDiagram.hooks.startDragBlock.on((block) => {
			const settingsBlockId = this.#commonNodeSettingsStore.block?.id
				?? this.#complexNodeSettingsStore.block?.id;

			if (settingsBlockId && settingsBlockId !== block.value.id)
			{
				this.#highlightedBlocks.clear();
				this.#highlightedBlocks.add(settingsBlockId);
			}
		});
		this.#nodeInspectorStore = useNodeDataInspectorStore();
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
		if (BLOCK_TYPES_WITHOUT_SETTINGS.includes(toValue(block).type))
		{
			this.hideAllSettings();

			return;
		}

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

			const notReallyComplexBlock = [
				'ForEachActivity',
				'WhileActivity',
				'IfElseBranchActivity',
			];

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
			return false;
		}

		if (!this.#commonNodeSettingsStore.isVisible)
		{
			this.#resetSettingsState();
			this.#appStore.showRightPanel();
		}

		await useDefaultTitle().waitForCatalog();
		this.#commonNodeSettingsStore.showSettings(block);
		this.#nodeInspectorStore.setBlock(block);

		return true;
	}

	async showComplexNodeSettings(block: Block): Promise<boolean>
	{
		const shouldSwitch = await this.#shouldSwitchToBlock();
		if (!shouldSwitch)
		{
			return false;
		}

		if (!this.#complexNodeSettingsStore.isShown)
		{
			this.#resetSettingsState();
			this.#appStore.showRightPanel();
			this.#complexNodeSettingsStore.toggleVisibility(true);
		}

		this.#nodeInspectorStore.setBlock(block);

		await this.#complexNodeSettingsStore.fetchNodeSettings(
			block,
			useDefaultTitle().resolveDefaultTitle(block.activity),
		);

		return true;
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
			html: getContextMenuItemHtml(
				this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'),
				this.#isMac ? '⌫' : 'Del',
			),
			onclick: () => {
				const isCurrentComplexBlock = this.isCurrentComplexBlock(block.id);
				this.hideCurrentBlockSettings(block.id);
				if (isCurrentComplexBlock)
				{
					this.resetComplexBlockSettings();
				}

				this.#blockDiagram.deleteBlockById(block.id);
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

	getSettingsBlockMenuOptions(block: Block): Array<MenuItemOptions>
	{
		return [
			this.getCtxMenuItemCopyBlock(block),
			this.getCtxMenuItemDeleteBlock(block),
		];
	}

	getCtxMenuItemCopyBlock(block: Block): MenuItemOptions
	{
		const itemId = 'copyBlock';

		return {
			id: itemId,
			html: getContextMenuItemHtml(
				this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_COPY'),
				this.#isMac ? '⌘ С' : 'Ctrl-C',
			),
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
		const isRelationPort = `${title[0]}${title[1]}` === COMPLEX_NODE_PORT_LABELS.relation;
		const portType = isRelationPort ? PORT_TYPES.inputRelation : PORT_TYPES.input;
		if (this.isCurrentComplexBlock(block.id))
		{
			if (isRelationPort)
			{
				portId = this.#complexNodeSettingsStore.addRelation();
				this.#complexNodeSettingsStore.addRelationPort(portId, portType);
			}
			else
			{
				portId = this.#complexNodeSettingsStore.addRule();
				this.#complexNodeSettingsStore.addRulePort(portId, portType, title);
			}
		}
		else
		{
			portId = generateNextInputPortId(
				block.ports.filter((port) => {
					return port.type === PORT_TYPES.inputRelation || port.type === PORT_TYPES.input;
				}),
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
				type: portType,
				position: 'left',
			},
		]);
	}

	addAuxPort(block: Block, title: string): void
	{
		const isPortExists = block.ports.some((port) => port.title === title);
		if (isPortExists)
		{
			return;
		}

		const auxPorts = block.ports.filter((port) => port.type === PORT_TYPES.aux);
		const nextPortNumber = auxPorts.reduce(
			(acc, port) => {
				const num = parseInt(port.id.slice(1), 10);

				return Math.max(acc, Number.isNaN(num) ? 0 : num);
			},
			-1,
		) + 1;

		this.#diagramStore.setPorts(block.id, [
			...block.ports,
			{
				id: `a${nextPortNumber}`,
				title,
				type: PORT_TYPES.aux,
				position: 'bottom',
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
		}

		if (shouldHide)
		{
			this.#complexNodeSettingsStore.toggleVisibility(false);
			this.#complexNodeSettingsStore.reset();
		}
		else if (complexBlock)
		{
			this.#complexNodeSettingsStore.setCurrentRule(null);
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
