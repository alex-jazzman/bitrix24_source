import { Browser } from 'main.core';
import { useHistory, useHighlightedBlocks, useBlockDiagram } from 'ui.block-diagram';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { toValue } from 'ui.vue3';
import { type MenuItemOptions } from 'ui.vue3.components.menu';

import { useAgentHighlightStore } from '../../../entities/ai-assistant/stores/agent-highlight-store';
import { useAppStore } from '../../../entities/app';
import {
	diagramStore as useDiagramStore,
	isBlockActivated,
	nodeTitleEditServices,
} from '../../../entities/blocks';
import { useCommonNodeSettingsStore } from '../../../entities/common-node-settings';
import {
	useNodeSettingsStore,
	generateNextInputPortId,
	generateNextOutputPortId,
	areNodeSettingsDirty,
	getUnreachableOutputPortIds,
	isOutputReachableInAnyState,
} from '../../../entities/node-settings';
import { useLoc } from '../../../shared/composables';
import {
	PORT_TYPES,
	BLOCK_TYPES,
	COMPLEX_NODE_PORT_LABELS,
	BLOCK_TYPES_WITHOUT_SETTINGS,
} from '../../../shared/constants';
import { parsePortTitle } from '../../../shared/utils';
import { useNodeDataInspectorStore } from '../../../shared/stores/node-data-inspector-store';
import { FocusAnchor, rescueFocus } from '../../../shared/utils/focus-rescue';
import { useDefaultTitle } from '../../../features/catalog';
import { useEditFrameContent } from '../../../features/blocks/composables/use-edit-frame-content';
import { useSaveToLibrary } from '../../../features/fragment-library';
import { useDataViewDefinitionStore } from '../../../features/data-view-editor';
import { type Block, type BlockId, type Connection, type Port, type PortId } from '../../../shared/types';
import { getContextMenuItemHtml } from './get-context-menu-item-html';

const HIDE_SETTINGS_DELAY = 300;
const DRAG_THRESHOLD = 5;
const COPY_BLOCK_TEST_ID = 'bizprocdesigner-block-menu-copy';
const RENAME_NODE_TITLE_TEST_ID = 'bizprocdesigner-block-menu-rename';
const SAVE_TO_LIBRARY_TEST_ID = 'bizprocdesigner-block-menu-save-to-library';
const EDIT_FRAME_CONTENT_TEST_ID = 'bizprocdesigner-block-menu-edit-frame-content';

// withTransition: play the content change of the settings panel with a transition. Off by default,
// so a click on a node and the context menu keep showing the settings instantly.
type ShowNodeSettingsOptions = {
	withTransition?: boolean;
};

const getPortTitleNumber = (title: ?string): number => {
	const number = parsePortTitle(title)?.id;

	return Number.isFinite(number) ? number : 0;
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
	#copyPasteBuffer = null;
	#highlightedBlocks = null;
	#agentHighlightStore = null;
	#isMac = false;
	#editFrameContent = null;
	#canEditFrameContent = null;
	#saveToLibrary = null;
	#canSaveToLibrary = null;
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
		this.#copyPasteBuffer = this.#blockDiagram.copyPasteBuffer;
		this.#isMac = Browser.isMac();
		this.#highlightedBlocks = useHighlightedBlocks();
		this.#agentHighlightStore = useAgentHighlightStore();
		const editFrameContent = useEditFrameContent();
		this.#editFrameContent = editFrameContent.editFrameContent;
		this.#canEditFrameContent = editFrameContent.canEditFrameContent;
		const saveToLibrary = useSaveToLibrary();
		this.#saveToLibrary = saveToLibrary.saveToLibrary;
		this.#canSaveToLibrary = saveToLibrary.canSaveToLibrary;

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

	// Whether the settings store holds the LOADED settings of this block, so its rules may answer for the
	// node. Deliberately not isCurrentComplexBlock(): fetchNodeSettings() marks the node as the current
	// one before the request and commits the block only after it, so in between the rules are an empty
	// map that would report every output of the node as unbound. The committed block tells the two
	// states apart.
	areSettingsLoadedForBlock(blockId: BlockId): boolean
	{
		return this.#complexNodeSettingsStore.block?.id === blockId
			&& this.#complexNodeSettingsStore.isCurrentBlock(blockId);
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
		this.syncSettingsWithDiagram();

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
		// Saving reads the scheme and writes nothing (see useSaveToLibrary), so it stands beside copying
		// in both sets.
		const saveToLibrary = this.#canSaveToLibrary()
			? [this.getCtxMenuItemSaveToLibrary(block)]
			: []
		;

		if (this.#diagramStore.isWriteLocked)
		{
			return [
				this.getCtxMenuItemShowSettings(block),
				this.getCtxMenuItemCopyBlock(block),
				...saveToLibrary,
			];
		}

		return [
			this.getCtxMenuItemShowSettings(block),
			this.getCtxMenuItemToggleActivation(block),
			this.getCtxMenuItemCopyBlock(block),
			...saveToLibrary,
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

	// The menu of a frame is assembled here beside the other block menus, so the write lock trims it
	// the same way: the frame keeps its own set of items, but renaming and deleting leave it under
	// the lock instead of reaching the actions behind them.
	getFrameBlockMenuOptions(block: Block): Array<MenuItemOptions>
	{
		if (this.#diagramStore.isWriteLocked)
		{
			return [
				this.getCtxMenuItemCopyBlock(block),
			];
		}

		const items = [];

		// The item is here even on a frame without a content area: turning the area on is part of
		// the way into editing, so the menu opens the same editor as the button and the double
		// click do. Where that way is closed the item goes with it, instead of opening a menu that
		// does nothing.
		if (this.#canEditFrameContent())
		{
			items.push(this.getCtxMenuItemEditFrameContent(block.id));
		}

		items.push(
			this.getCtxMenuItemRenameNodeTitle(block.id),
			this.getCtxMenuItemCopyBlock(block),
			this.getCtxMenuItemDeleteBlock(block),
		);

		return items;
	}

	getCtxMenuItemCopyBlock(block: Block): MenuItemOptions
	{
		const itemId = 'copyBlock';

		return {
			id: itemId,
			html: getContextMenuItemHtml(
				this.#loc.getMessage('UI_BLOCK_DIAGRAM_CONTEXT_MENU_ITEM_COPY'),
				this.#isMac ? '⌘ C' : 'Ctrl-C',
			),
			dataset: { testid: COPY_BLOCK_TEST_ID },
			onclick: (): void => {
				this.#copyPasteBuffer.setContent({
					blocks: [block],
					connections: [],
				});
			},
		};
	}

	// No hotkey and no caption plate for one: the item of the group selection has none either.
	getCtxMenuItemSaveToLibrary(block: Block): MenuItemOptions
	{
		return {
			id: 'saveToLibrary',
			html: getContextMenuItemHtml(
				this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_MENU_ITEM_SAVE'),
			),
			dataset: { testid: SAVE_TO_LIBRARY_TEST_ID },
			onclick: (): void => {
				this.#saveToLibrary([block], []);
			},
		};
	}

	getCtxMenuItemEditFrameContent(blockId: BlockId): MenuItemOptions
	{
		const itemId = 'editFrameContent';

		return {
			id: itemId,
			// No shortcut caption: the action needs the frame it was called on, and a shortcut
			// carries no such argument.
			text: this.#loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_FRAME_ITEM_EDIT'),
			dataset: { testid: EDIT_FRAME_CONTENT_TEST_ID },
			onclick: (): void => {
				this.#editFrameContent(blockId);
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

	// Ports are written here for every way in - a drop on a virtual port, the plus of the aux column,
	// the last connection of an output leaving. The lock is checked at this single point, because a
	// materialized port reaches the graph before the setter of connections can refuse the connection
	// that asked for it, and the settings of the open node change along the way.
	addComplexBlockPort(block: Block, title: string): ?string
	{
		if (this.#diagramStore.isWriteLocked)
		{
			return null;
		}

		let portId = '';
		const isRelationPort = `${title[0]}${title[1]}` === COMPLEX_NODE_PORT_LABELS.relation;
		const portType = isRelationPort ? PORT_TYPES.inputRelation : PORT_TYPES.input;
		if (this.isCurrentComplexBlock(block.id))
		{
			if (isRelationPort)
			{
				portId = this.#complexNodeSettingsStore.addRelation();
				if (portId === null)
				{
					return null;
				}

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

	// Materializes a plain output E{N} dropped onto a placeholder. The "Output" construction is not
	// created: the port stays unbound to any rule until the user binds it in the settings panel.
	addComplexBlockOutputPort(block: Block, title: string): string
	{
		if (this.#diagramStore.isWriteLocked)
		{
			return '';
		}

		const existingBlockPort = block.ports.find((port) => port.title === title);
		if (existingBlockPort)
		{
			return existingBlockPort.id;
		}

		// The ports the placeholder title was built from, so the id and the title come from one source:
		// while the settings of this node are loaded the store owns them, and an id counted off the block
		// alone would repeat one the store has already handed out. The loaded-settings predicate picks the
		// source, not the weaker one getComplexBlockPorts() draws the port column by: in the load window of
		// the panel the store still holds the ports of the node opened before this one.
		const areSettingsLoaded = this.areSettingsLoadedForBlock(block.id);
		const complexBlockPorts = areSettingsLoaded
			? (this.#complexNodeSettingsStore.ports ?? block.ports)
			: block.ports;
		// The same source answers whether this output is already named: a port the store has handed out
		// keeps its id, and a fresh one would leave the store and the diagram naming one output twice.
		const existingSettingsPort = complexBlockPorts.find((port) => port.title === title);
		const portId = existingSettingsPort?.id ?? generateNextOutputPortId(
			complexBlockPorts.filter((port) => {
				return port.type === PORT_TYPES.output || port.type === PORT_TYPES.outputRelation;
			}),
		);

		// A port written to the diagram alone is lost on the next saveSettings(): it overwrites the
		// diagram ports with the settings store content. The same predicate answers here: while the panel
		// loads, the store holds no ports of this node to write to, and fetchNodeSettings() rebuilds them
		// off the block with this port included.
		if (!existingSettingsPort && areSettingsLoaded)
		{
			this.#complexNodeSettingsStore.addRulePort(portId, PORT_TYPES.output, title);
		}

		this.#diagramStore.setPorts(block.id, this.#insertPortByTitleNumber(block.ports, {
			id: portId,
			title,
			type: PORT_TYPES.output,
			position: 'right',
		}));

		this.#history.makeSnapshot();

		return portId;
	}

	// Mirrors addRulePort() of the settings store: a port goes where the number in its title asks for,
	// so the diagram keeps one order no matter whether the panel took part in the materialization.
	#insertPortByTitleNumber(ports: Array<Port>, newPort: Port): Array<Port>
	{
		const samePortTypePorts = ports.filter((port) => port.type === newPort.type);
		const newPortNumber = getPortTitleNumber(newPort.title);

		for (let i = samePortTypePorts.length - 1; i >= 0; i--)
		{
			if (getPortTitleNumber(samePortTypePorts[i].title) < newPortNumber)
			{
				const nextPorts = [...ports];
				nextPorts.splice(ports.indexOf(samePortTypePorts[i]) + 1, 0, newPort);

				return nextPorts;
			}
		}

		return [newPort, ...ports];
	}

	// Mirrors addComplexBlockOutputPort: an output a connection brought to life goes away with its last
	// connection while no rule of the node points at it. An output bound to a rule stays, and so does one
	// that still holds another connection.
	removeUnboundOutputPort(connection: Connection): void
	{
		if (this.#diagramStore.isWriteLocked)
		{
			return;
		}

		// A graph replay (an external agent draft) reaches this rule as a series of addressed deletions:
		// the outputs it leaves behind belong to the replayed graph, not to a gesture of the user.
		if (!connection || toValue(this.#blockDiagram.isAnimate))
		{
			return;
		}

		const block = this.#diagramStore.blocks.find((item) => item.id === connection.sourceBlockId);
		if (block?.type !== BLOCK_TYPES.COMPLEX)
		{
			return;
		}

		const port = block.ports?.find((item) => item.id === connection.sourcePortId);
		if (port?.type !== PORT_TYPES.output || this.#hasPortConnections(block.id, port.id))
		{
			return;
		}

		// Both states answer here, unlike the mark and the alert of the panel: they redraw with the
		// draft, a deletion outlives it. An output the saved rules still point at therefore survives the
		// window in which the panel has its binding removed and not saved.
		const areSettingsLoaded = this.areSettingsLoadedForBlock(block.id);
		const isReachable = isOutputReachableInAnyState(port.id, {
			settingsRules: areSettingsLoaded ? (this.#complexNodeSettingsStore.nodeSettings?.rules ?? null) : null,
			activityProperties: block.activity?.Properties ?? null,
		});
		if (isReachable)
		{
			return;
		}

		if (areSettingsLoaded)
		{
			this.#complexNodeSettingsStore.deletePort(port.id);
		}

		this.#diagramStore.setPorts(block.id, block.ports.filter((item) => item.id !== port.id));

		this.#history.makeSnapshot();
	}

	#hasPortConnections(blockId: BlockId, portId: PortId): boolean
	{
		return this.#diagramStore.connections.some((connection) => {
			return (connection.sourceBlockId === blockId && connection.sourcePortId === portId)
				|| (connection.targetBlockId === blockId && connection.targetPortId === portId);
		});
	}

	addAuxPort(block: Block, title: string): ?string
	{
		if (this.#diagramStore.isWriteLocked)
		{
			return null;
		}

		const existingPort = block.ports.find((port) => port.type === PORT_TYPES.aux && port.title === title);
		if (existingPort)
		{
			if (existingPort.isActive === false)
			{
				this.#diagramStore.setPorts(block.id, block.ports.map((port) => {
					return port.id === existingPort.id ? { ...port, isActive: true } : port;
				}));
				this.#history.makeSnapshot();
			}

			return existingPort.id;
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

		return `a${nextPortNumber}`;
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

		const block = this.#diagramStore.blocks.find((item) => item.id === currentId);

		if (!block)
		{
			this.hideAllSettings();
			if (complexBlockId)
			{
				this.#complexNodeSettingsStore.toggleVisibility(false);
				this.#complexNodeSettingsStore.reset();
			}

			return;
		}

		// The loaded-settings predicate, not the weaker "panel is shown": in the load window of another
		// node the rules already describe THAT node while the ports still belong to this one, and rules
		// that answer for someone else report every output here as unbound.
		if (complexBlockId && this.areSettingsLoadedForBlock(complexBlockId))
		{
			this.#syncSettingsOutputPortsWithBlock(block);
		}
	}

	// History snapshots the diagram alone, so undoing a materialized or a removed output leaves the open
	// settings panel holding the other version of the port list. For an output no rule points at, the
	// diagram is the source of truth: a port a connection still leaves through has to exist, and one the
	// diagram no longer has is gone. An output bound to a rule is left alone - it legitimately lives in
	// the settings store until saveSettings() writes it to the diagram.
	#syncSettingsOutputPortsWithBlock(block: Block): void
	{
		const settingsPorts = this.#complexNodeSettingsStore.ports;
		if (!Array.isArray(settingsPorts))
		{
			return;
		}

		const blockOutputPorts = (block.ports ?? []).filter((port) => port.type === PORT_TYPES.output);
		const blockOutputPortIds = new Set(blockOutputPorts.map((port) => port.id));
		const settingsOutputPortIds = new Set(
			settingsPorts
				.filter((port) => port.type === PORT_TYPES.output)
				.map((port) => port.id),
		);
		// The outputs of the settings store the diagram no longer has. Their reachability is answered by
		// one pass over the source for the whole list, not by a pass per port.
		const missingSettingsOutputPorts = settingsPorts.filter((port) => {
			return port.type === PORT_TYPES.output && !blockOutputPortIds.has(port.id);
		});
		// The rules of the panel are the only source here: the caller runs this method only for a block
		// whose settings are loaded, so the rules map is there and it describes this very block.
		const unreachablePortIds = new Set(getUnreachableOutputPortIds(
			missingSettingsOutputPorts.map((port) => port.id),
			{ settingsRules: this.#complexNodeSettingsStore.nodeSettings?.rules ?? null },
		));

		missingSettingsOutputPorts
			.filter((port) => unreachablePortIds.has(port.id))
			.forEach((port) => {
				this.#complexNodeSettingsStore.deletePort(port.id);
			});

		blockOutputPorts
			.filter((port) => {
				return !settingsOutputPortIds.has(port.id) && this.#hasPortConnections(block.id, port.id);
			})
			.forEach((port) => {
				this.#complexNodeSettingsStore.addRulePort(port.id, PORT_TYPES.output, port.title);
			});
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
