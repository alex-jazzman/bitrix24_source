import { Runtime, Browser } from 'main.core';
import { useHistory, useHighlightedBlocks, useBlockDiagram } from 'ui.block-diagram';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { toValue } from 'ui.vue3';
import { type MenuItemOptions } from 'ui.vue3.components.menu';

import { useAgentHighlightStore } from '../../../entities/ai-assistant/stores/agent-highlight-store';
import { useAppStore } from '../../../entities/app';
import {
	diagramStore as useDiagramStore,
	useBufferStore,
	isBlockActivated,
	nodeTitleEditServices,
} from '../../../entities/blocks';
import { useCommonNodeSettingsStore } from '../../../entities/common-node-settings';
import { useNodeSettingsStore, generateNextInputPortId, areNodeSettingsDirty } from '../../../entities/node-settings';
import { useLoc } from '../../../shared/composables';
import { textEditorServices } from '../../../shared/ui';
import {
	PORT_TYPES,
	COMPLEX_NODE_PORT_LABELS,
	BLOCK_TYPES_WITHOUT_SETTINGS,
} from '../../../shared/constants';
import { useNodeDataInspectorStore } from '../../../shared/stores/node-data-inspector-store';
import { FocusAnchor, rescueFocus } from '../../../shared/utils/focus-rescue';
import { useDefaultTitle } from '../../../features/catalog';
import { useDataViewDefinitionStore } from '../../../features/data-view-editor';
import { type Block, type BlockId, type Port } from '../../../shared/types';
import { getContextMenuItemHtml } from './get-context-menu-item-html';

const HIDE_SETTINGS_DELAY = 300;
const DRAG_THRESHOLD = 5;
const RENAME_NODE_TITLE_TEST_ID = 'bizprocdesigner-block-menu-rename';

// withTransition: play the content change of the settings panel with a transition. Off by default,
// so a click on a node and the context menu keep showing the settings instantly.
type ShowNodeSettingsOptions = {
	withTransition?: boolean;
};

export class BlockMediator
{
	#loc = null;
	#history = null;
	#appStore = null;
	#commonNodeSettingsStore = null;
	#complexNodeSettingsStore = null;
	#dataViewDefinitionStore = null;
	#blockDiagram = null;
	#nodeInspectorStore = null;
	#diagramStore = null;
	#bufferStore = null;
	#highlightedBlocks = null;
	#agentHighlightStore = null;
	#isMac = false;
	#clickStartX = 0;
	#clickStartY = 0;
	// The show in flight, as a promise settled the moment it ends. Doubles as the guard against a
	// second show over the first one: while it is there the panel is being replaced already.
	#showInFlight = null;
	#clearSelectionTimeout = null;

	constructor()
	{
		this.#loc = useLoc();
		this.#history = useHistory();
		this.#appStore = useAppStore();
		this.#commonNodeSettingsStore = useCommonNodeSettingsStore();
		this.#complexNodeSettingsStore = useNodeSettingsStore();
		this.#dataViewDefinitionStore = useDataViewDefinitionStore();
		this.#diagramStore = useDiagramStore();
		this.#blockDiagram = useBlockDiagram();
		this.#bufferStore = useBufferStore();
		this.#isMac = Browser.isMac();
		this.#highlightedBlocks = useHighlightedBlocks();
		this.#agentHighlightStore = useAgentHighlightStore();

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
		// The form living in the panel goes away with the state, so a focus left inside it must not
		// fall through to <body>.
		rescueFocus(FocusAnchor.settingsPanel);
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

	/**
	 * The show in flight as a promise settled the moment it ends, and null when the mediator is free.
	 * Meant for a caller that can afford to wait its turn — the automatic series over the nodes an
	 * agent has just added: a step of it refused by the guard below is lost for good, and the last of
	 * those steps is the result of the build the user is waiting for. A click of the user asks nothing
	 * of this and keeps taking the refusal, the way it always did.
	 */
	getShowInFlight(): ?Promise<void>
	{
		return this.#showInFlight;
	}

	async showNodeSettings(block: Block, options: ShowNodeSettingsOptions): Promise<boolean>
	{
		if (BLOCK_TYPES_WITHOUT_SETTINGS.includes(toValue(block).type))
		{
			this.hideAllSettings();

			return false;
		}

		if (this.#showInFlight !== null)
		{
			return false;
		}

		let settleShow = null;
		this.#showInFlight = new Promise((resolve) => {
			settleShow = resolve;
		});

		try
		{
			// The serving panel is declared by the server, never derived from the block type or
			// from the set of its properties; an absent marker keeps the legacy form.
			if (toValue(block).node?.servedByUnifiedPanel === true)
			{
				return await this.showComplexNodeSettings(block, options);
			}

			const isCommonNodeSettingsShown = await this.showCommonNodeSettings(block, options);
			if (isCommonNodeSettingsShown)
			{
				this.#nodeInspectorStore.setBlock(block);
			}

			return isCommonNodeSettingsShown;
		}
		finally
		{
			this.#showInFlight = null;
			settleShow();
		}
	}

	async showCommonNodeSettings(block: Block, options: ShowNodeSettingsOptions): Promise<boolean>
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
		this.#commonNodeSettingsStore.showSettings(block, options);
		this.#nodeInspectorStore.setBlock(block);

		return true;
	}

	async showComplexNodeSettings(block: Block, options: ShowNodeSettingsOptions): Promise<boolean>
	{
		const shouldSwitch = await this.#shouldSwitchToBlock();
		if (!shouldSwitch)
		{
			return false;
		}

		if (this.#complexNodeSettingsStore.isShown)
		{
			// The load takes down the header, the tabs, the content and the footer at once, so a focus
			// left inside them would land on <body>. Whoever asked for the show, the user working in
			// the panel that is being replaced keeps a place to stand. The branch below replaces the
			// state instead, and rescues the focus itself.
			rescueFocus(FocusAnchor.settingsPanel);
		}
		else
		{
			this.#resetSettingsState();
			this.#appStore.showRightPanel();
			this.#complexNodeSettingsStore.toggleVisibility(true);
		}

		this.#nodeInspectorStore.setBlock(block);

		await this.#complexNodeSettingsStore.fetchNodeSettings(
			block,
			useDefaultTitle().resolveDefaultTitle(block.activity),
			options,
		);

		return true;
	}

	#areComplexNodeSettingsDirty(block: Block): boolean
	{
		const { ports, nodeSettings, prevSavedNodeSettings } = this.#complexNodeSettingsStore;

		return areNodeSettingsDirty({
			nodeSettings,
			prevSavedNodeSettings,
			ports,
			blockPorts: block.ports,
		});
	}

	getCtxMenuItemShowSettings(block: Block): MenuItemOptions
	{
		return {
			id: 'showSettings',
			text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_OPEN'),
			onclick: () => this.showNodeSettings(block),
		};
	}

	getCtxMenuItemToggleActivation(block: Block): MenuItemOptions
	{
		const isActivated = isBlockActivated(block);

		return {
			id: 'toggleActivation',
			text: isActivated
				? this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DEACTIVATE')
				: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_ACTIVATE'),
			onclick: () => {
				this.#diagramStore.toggleBlockActivation(block.id);
			},
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
			},
		};
	}

	getCommonBlockMenuOptions(block: Block): Array<MenuItemOptions>
	{
		if (this.#diagramStore.isWriteLocked)
		{
			return [
				this.getCtxMenuItemShowSettings(block),
				this.getCtxMenuItemCopyBlock(block),
			];
		}

		return [
			this.getCtxMenuItemShowSettings(block),
			this.getCtxMenuItemToggleActivation(block),
			this.getCtxMenuItemCopyBlock(block),
			this.getCtxMenuItemDeleteBlock(block),
		];
	}

	getSettingsBlockMenuOptions(block: Block): Array<MenuItemOptions>
	{
		if (this.#diagramStore.isWriteLocked)
		{
			return [
				this.getCtxMenuItemCopyBlock(block),
			];
		}

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
				this.#isMac ? '⌘ C' : 'Ctrl-C',
			),
			onclick: (): void => {
				this.#bufferStore.setBufferContent({
					blocks: [block],
					connections: [],
				});
			},
		};
	}
	getCtxMenuItemEditFrameContent(blockId: BlockId): MenuItemOptions
	{
		const itemId = 'editFrameContent';

		return {
			id: itemId,
			html: getContextMenuItemHtml(
				this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_FRAME_ITEM_EDIT'),
				this.#isMac ? '⌘ E' : 'Ctrl-E',
			),
			onclick: (): void => {
				textEditorServices
					.get(blockId)
					.onEdit();
			},
		};
	}

	getCtxMenuItemRenameNodeTitle(blockId: BlockId): MenuItemOptions
	{
		return {
			id: 'renameNodeTitle',
			text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_FRAME_ITEM_RENAME'),
			dataset: { testid: RENAME_NODE_TITLE_TEST_ID },
			onclick: (): void => {
				nodeTitleEditServices
					.get(blockId)
					.startEdit();
			},
		};
	}

	addComplexBlockPort(block: Block, title: string): ?string
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
			return block.ports.find((port) => port.title === title)?.id ?? null;
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

		this.#history.makeSnapshot();

		return portId;
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

		this.#history.makeSnapshot();
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

	#closeTableSettings(): void
	{
		this.#dataViewDefinitionStore.close();
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
			this.#closeTableSettings();

			return true;
		}

		const shouldStay = await this.#showConfirm();
		if (!shouldStay)
		{
			this.resetComplexBlockSettings(false);
			this.#closeTableSettings();
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

		// A click is told from a drag the way the editor has always told them apart: by the distance
		// between the press and the release. The highlight rides on that same verdict instead of
		// growing a second one of its own.
		const delta = Math.hypot(event.clientX - this.#clickStartX, event.clientY - this.#clickStartY);
		const isDrag = delta > DRAG_THRESHOLD;

		// A click puts the agent highlight out whatever the handler does next: neither a group
		// selection nor an already open settings panel makes the node any less clicked.
		if (!isDrag)
		{
			this.#agentHighlightStore.dismiss(block.id);
		}

		const isGroupSelected = this.#highlightedBlocks.highlitedBlockIds.value.length > 1;
		if (isGroupSelected)
		{
			return;
		}

		if (isDrag && !this.isAnySettingsOpen())
		{
			this.#scheduleSelectionClear(block.id);

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

		this.#cancelSelectionClear();
		this.#clickStartX = event.clientX;
		this.#clickStartY = event.clientY;
	}

	#scheduleSelectionClear(blockId: BlockId): void
	{
		this.#cancelSelectionClear();
		// A microtask can run before the document-level mouseup listener commits the drag.
		this.#clearSelectionTimeout = setTimeout(() => {
			this.#clearSelectionTimeout = null;
			const selectedIds = this.#highlightedBlocks.highlitedBlockIds.value;

			if (selectedIds.length === 1 && selectedIds[0] === blockId)
			{
				this.#highlightedBlocks.clear();
			}
		}, 0);
	}

	#cancelSelectionClear(): void
	{
		if (this.#clearSelectionTimeout === null)
		{
			return;
		}

		clearTimeout(this.#clearSelectionTimeout);
		this.#clearSelectionTimeout = null;
	}

	isAnySettingsOpen(): boolean
	{
		return this.#commonNodeSettingsStore.isVisible || this.#complexNodeSettingsStore.isShown;
	}
}
