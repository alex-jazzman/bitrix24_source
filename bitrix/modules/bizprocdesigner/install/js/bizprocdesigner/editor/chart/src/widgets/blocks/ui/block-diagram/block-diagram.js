import { Browser, Text, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { type MenuItemOptions } from 'main.popup';
import {
	useHistory,
	GroupSelectionBox,
	useKeyboardShortcuts,
	useBlockDiagram,
	useCanvas,
	useCopyPaste,
	useHighlightedBlocks,
	useContextMenu,
	type CopyPasteMenuItem,
	type DiagramPasteBlocksPayload,
} from 'ui.block-diagram';
import {
	computed,
	toValue,
	watch,
	nextTick,
	onMounted,
	onUnmounted,
	onBeforeUnmount,
	useTemplateRef,
} from 'ui.vue3';
import { storeToRefs } from 'ui.vue3.pinia';

// eslint-disable-next-line @bitrix24/bitrix24-rules/need-alias
import { FeatureCode, type FeatureCodeType } from 'bizprocdesigner.feature';

import { setUserSelectedBlock } from '../../../../entities/ai-assistant/api/api';
import {
	BlockDiagram as BlockDiagramEntity,
	diagramStore as useDiagramStore,
	BLOCK_SLOT_NAMES,
	CONNECTION_SLOT_NAMES,
	rewriteActivityIds,
	getConnectedPortIds,
	getUnconfiguredConnectedAuxPortIds,
	shouldRemoveOrphanedAuxPort,
	syncPortsWithActionAuxPorts,
} from '../../../../entities/blocks';
import { reportInsertOutcome, useSaveToLibrary } from '../../../../features/fragment-library';
import {
	READABLE_EXPRESSION_SHOW_SOURCE_EVENT,
} from '../../../../features/node-settings/ui/readable-expression-popover/readable-expression-popover';
import { getActionAuxPortsFromActivity } from '../../../../entities/node-settings/utils/action-aux-ports';
import { useFeature, useLoc } from '../../../../shared/composables';
import { PORT_TYPES, BLOCK_TYPES, FRAGMENT_LIBRARY_EVENTS } from '../../../../shared/constants';
import { type Block, type BlockPosition, type Connection, type Port } from '../../../../shared/types';
import { createUniqueId } from '../../../../shared/utils';
import {
	useInsertFragment,
	useInsertNodeIntoConnection,
	BlockMediator,
	getContextMenuItemHtml,
} from '../../lib';

import './block-diagram.css';

const IS_MAC = Browser.isMac();

type SetupType = {
	blocks: Array<Block>,
	connections: Array<Connection>,
	blockSlotNames: { [string]: string },
	connectionSlotNames: { [string]: string },
	onDropNewBlock: (block: Block) => void,
	highlitedBlockIds: Array<string>,
	isFeatureAvailable: (featureCode: FeatureCodeType) => boolean,
	pasteMenuItem: MenuItemOptions,
	isWriteLocked: boolean,
};

const DEFAULT_SELECTION_PADDING = { top: 27, bottom: 25, left: 17, right: 17 };
const DEFAULT_BLOCK_SIZE = { width: 150, height: 100 };
const SWITCHER_WIDTH = 17;
const AUTOSAVE_DELAY = 700;
const CONNECTION_PREVIEW_SELECTOR = '.ui-block-diagram-connection-preview';
const CONNECTION_PREVIEW_PATH_SELECTOR = '.ui-block-diagram-connection-preview__path';
const CONNECTION_PREVIEW_MARKER_SELECTOR = '.ui-block-diagram-connection-preview__marker';

// mousedown on these elements must not close the settings panel (connection line / its delete button)
const CONNECTION_ELEMENT_SELECTOR = '.ui-block-diagram-connection, .ui-block-diagram-delete-connection-btn';

const COPY_GROUP_TEST_ID = 'bizprocdesigner-group-menu-copy';
const PASTE_TEST_ID = 'bizprocdesigner-canvas-menu-paste';
const SAVE_TO_LIBRARY_TEST_ID = 'bizprocdesigner-group-menu-save-to-library';
const INSERT_FROM_LIBRARY_TEST_ID = 'bizprocdesigner-canvas-menu-insert-from-library';
const INSERT_FROM_LIBRARY_ITEM_ID = 'insert-from-library';

type AutosaveScheduler = {
	schedule: () => void,
	cancel: () => void,
	flush: () => void,
};

export function probeRenderedConnectionPreview(
	container: Element,
	activationKey: string,
	currentActivationKey: ?string,
): boolean
{
	if (currentActivationKey !== activationKey || !Type.isElementNode(container))
	{
		return false;
	}

	const previews = container.querySelectorAll(CONNECTION_PREVIEW_SELECTOR);
	if (previews.length !== 1)
	{
		return false;
	}

	const paths = previews[0].querySelectorAll(CONNECTION_PREVIEW_PATH_SELECTOR);
	const markers = previews[0].querySelectorAll(CONNECTION_PREVIEW_MARKER_SELECTOR);
	if (paths.length !== 2 || markers.length !== 2)
	{
		return false;
	}

	const hasValidPaths = [...paths].every((path) => {
		const value = path.getAttribute('d');

		return Type.isStringFilled(value)
			&& value.trim() !== ''
			&& !/NaN|Infinity/.test(value)
		;
	});
	const hasValidMarkers = [...markers].every((marker) => {
		return ['cx', 'cy'].every((attribute) => {
			const value = marker.getAttribute(attribute);

			return Type.isStringFilled(value)
				&& value.trim() !== ''
				&& Number.isFinite(Number(value))
			;
		});
	});

	return hasValidPaths && hasValidMarkers;
}

export function createAutosaveScheduler(
	autosave: () => mixed,
	delay: number = AUTOSAVE_DELAY,
): AutosaveScheduler
{
	let timerId = null;

	function cancel(): void
	{
		if (timerId === null)
		{
			return;
		}

		clearTimeout(timerId);
		timerId = null;
	}

	function schedule(): void
	{
		cancel();
		timerId = setTimeout(() => {
			timerId = null;
			void autosave();
		}, delay);
	}

	// Sends the change waiting out the delay right now: the person is about to give the template back,
	// and a save left to the timer would fire when there is nothing left to write with.
	function flush(): void
	{
		if (timerId === null)
		{
			return;
		}

		cancel();
		void autosave();
	}

	return { schedule, cancel, flush };
}

/**
 * The selection on its way into the library: the very blocks that are highlighted and only the links
 * with both ends among them. A link leading out of the selection is left out exactly as copying leaves
 * it out - saved, it would point at a node the fragment does not carry (INV-07).
 */
export function selectFragmentForLibrary(
	blocks: Array<Block>,
	connections: Array<Connection>,
	selectedIds: Array<string>,
): { blocks: Array<Block>, connections: Array<Connection> }
{
	const selected = new Set(selectedIds);

	return {
		blocks: blocks.filter((block) => selected.has(block.id)),
		connections: connections.filter(
			(connection) => selected.has(connection.sourceBlockId) && selected.has(connection.targetBlockId),
		),
	};
}

// The canvas owns the phrase and the hotkey caption of its own action; the markup, the item id and
// the test id stay the editor's own.
function toEditorMenuItem(id: string, testId: string, item: CopyPasteMenuItem): MenuItemOptions
{
	return {
		id,
		disabled: item.disabled,
		html: getContextMenuItemHtml(item.text, item.hotkey),
		// Lower-case key on purpose: dataset.testid renders as data-testid, the attribute
		// page.getByTestId() looks for.
		dataset: { testid: testId },
		onclick: item.onclick,
	};
}

// @vue/component
export const BlockDiagram = {
	name: 'BlockDiagramWidget',
	components: {
		BlockDiagramEntity,
		GroupSelectionBox,
	},
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		enableGrouping: {
			type: Boolean,
			default: false,
		},
	},
	// eslint-disable-next-line max-lines-per-function
	setup(props): SetupType
	{
		const diagramStore = useDiagramStore();
		const { blocks: blocksInStore, connections: connectionsInStore } = storeToRefs(diagramStore);
		const { getMessage } = useLoc();
		const highlightedBlocks = useHighlightedBlocks();
		const highlitedBlockIds = highlightedBlocks.highlitedBlockIds;
		const { isFeatureAvailable } = useFeature();
		const blockDiagram = useBlockDiagram();
		const { connectionPreview, hooks } = blockDiagram;
		const blockDiagramEntityRef = useTemplateRef('blockDiagramEntity');
		function probeConnectionPreview(activationKey: string): boolean
		{
			const container = blockDiagramEntityRef.value?.$el;

			return probeRenderedConnectionPreview(
				container,
				activationKey,
				toValue(connectionPreview)?.activationKey,
			);
		}
		const {
			currentSnapshot,
			rollbackBlockUpdate,
		} = blockDiagram;
		const mediator = new BlockMediator();
		const insertNodeController = useInsertNodeIntoConnection({
			diagramStore,
			blockDiagram,
			selectedBlockIds: highlitedBlockIds,
			disabled: computed(() => props.disabled),
			createConnectionId: () => Text.getRandom(),
			now: () => Date.now(),
			scheduleSave: () => fetchUpdateDiagram(),
			syncSettingsWithDiagram: () => mediator.syncSettingsWithDiagram(),
			probeConnectionPreview,
		});
		const { startDragBlock, moveDragBlock, endDragBlock, pasteBlocks } = hooks;
		const {
			onStartDragBlock,
			onMoveDragBlock,
			onEndDragBlock,
			isRouteHitTestActive,
		} = insertNodeController;
		startDragBlock.on(onStartDragBlock);
		moveDragBlock.on(onMoveDragBlock);
		endDragBlock.on(onEndDragBlock);
		onUnmounted(() => {
			startDragBlock.off(onStartDragBlock);
			moveDragBlock.off(onMoveDragBlock);
			endDragBlock.off(onEndDragBlock);
			insertNodeController.destroy();
		});

		const history = useHistory();

		const selectionBoxConfig = computed(() => {
			const selectedIds = toValue(highlitedBlockIds);
			const selectedBlocks = (selectedIds?.length)
				? toValue(blocks).filter((b) => selectedIds.includes(b.id))
				: []
			;

			let { left } = DEFAULT_SELECTION_PADDING;

			if (selectedBlocks.length > 0)
			{
				const minX = Math.min(...selectedBlocks.map((b) => b.position.x));
				const hasTriggerOnLeft = selectedBlocks.some((b) => (
					b.type === BLOCK_TYPES.TRIGGER
					&& Math.abs(b.position.x - minX) < 1
				));

				if (hasTriggerOnLeft)
				{
					left += SWITCHER_WIDTH;
				}
			}

			return {
				padding: { ...DEFAULT_SELECTION_PADDING, left },
				defaultBlockSize: DEFAULT_BLOCK_SIZE,
			};
		});
		const isWriteLocked = computed((): boolean => diagramStore.isWriteLocked);

		// The canvas owns the buffer, the new ids, the geometry, the highlight and the history
		// snapshot; what stays here is the domain: the id format, the activity references and the
		// ban on writing.
		const copyPaste = useCopyPaste({
			createBlockId: createUniqueId,
			cloneContent: rewriteActivityIds,
			canPaste: (): boolean => !toValue(isWriteLocked),
		});

		/**
		 * What the two ways of adding a fragment share (TPL-01): the paste from the buffer and the
		 * insertion from the library. A group addition is one change of the diagram: a single save
		 * chain covers every added block and connection instead of racing one chain per block. Adding
		 * them raised both setters, and each scheduled a deferred save of the same change - that
		 * duplicate is what gets dropped here. Neither path leaves a pending save of an earlier change
		 * to throw away: the hook of the paste only fires on a non-empty one.
		 *
		 * The history snapshot and the highlight of what was added stay out of here on purpose: on the
		 * path of the buffer the canvas makes both itself, and a shared step would mean a second
		 * snapshot there - undoing one paste would take two presses.
		 */
		function afterFragmentAdded(addedBlocks: Array<Block>, addedConnections: Array<Connection>): void
		{
			for (const block of addedBlocks)
			{
				diagramStore.setBlockCurrentTimestamp(block);
			}

			for (const connection of addedConnections)
			{
				diagramStore.setConnectionCurrentTimestamp(connection.id);
			}

			void diagramStore.autosave();
			autosaveScheduler.cancel();
		}

		function onPasteBlocks(payload: DiagramPasteBlocksPayload): void
		{
			const { blocks: pastedBlocks, connections: pastedConnections } = payload;

			afterFragmentAdded(pastedBlocks, pastedConnections);

			nextTick(() => {
				if (pastedBlocks.length === 1)
				{
					mediator.showNodeSettings(pastedBlocks[0]);
				}
			});
		}

		pasteBlocks.on(onPasteBlocks);
		onUnmounted(() => {
			pasteBlocks.off(onPasteBlocks);
		});

		// The second way of adding a fragment: no copy machine of its own, no copy buffer, the same
		// post-processing as the paste from the buffer.
		const { insertFragment } = useInsertFragment({
			diagramStore,
			blockDiagram,
			highlightedBlocks,
			history,
			afterFragmentAdded,
			reportOutcome: reportInsertOutcome,
		});

		const handleDelete = () => {
			if (toValue(isWriteLocked))
			{
				return;
			}

			const ids = toValue(highlitedBlockIds);
			if (ids.length === 0)
			{
				return;
			}

			ids.forEach((id) => {
				diagramStore.deleteBlockById(id);
				mediator.hideCurrentBlockSettings(id);
			});

			history.makeSnapshot();
			highlightedBlocks.clear();
			closeContextMenu();
			fetchUpdateDiagram();
		};

		useKeyboardShortcuts([
			{
				keys: ['Delete'],
				handler: handleDelete,
			},
			{
				keys: ['Backspace'],
				handler: handleDelete,
			},
		]);

		const { closeContextMenu } = useContextMenu();

		// A refused gesture leaves its own geometry in the block index of the canvas: the model was
		// never replaced, so the watcher that would rebuild the index never runs. Every block the
		// gesture reported differently from the model is taken back to the model - a resize reports
		// no moving block and a group drag reports several, so the whole reported set is compared
		// instead of a single id. Removal goes by block id, so the model block doubles as the
		// removal key where the gesture dropped it. The last call releases the command flag.
		function rollbackRefusedBlocks(attemptedBlocks: Block[]): void
		{
			const attemptedById = new Map(attemptedBlocks.map((block) => [block.id, block]));
			const actualById = new Map(toValue(blocksInStore).map((block) => [block.id, block]));

			for (const blockId of new Set([...attemptedById.keys(), ...actualById.keys()]))
			{
				const attemptedBlock = attemptedById.get(blockId) ?? null;
				const actualBlock = actualById.get(blockId) ?? null;

				if (attemptedBlock !== actualBlock)
				{
					rollbackBlockUpdate(attemptedBlock ?? actualBlock, actualBlock);
				}
			}

			rollbackBlockUpdate(null, null);
		}

		const blocks = computed({
			get(): Block[]
			{
				return toValue(blocksInStore);
			},
			set(newBlocks: Block[])
			{
				// Reading a published version keeps the canvas live, so every graph edit it reports -
				// a move, a resize, an undo of the library - has to be refused here: the write lock is
				// the only thing standing between those gestures and the draft.
				if (toValue(isWriteLocked) || insertNodeController.interceptBlocksUpdate(newBlocks).handled)
				{
					rollbackRefusedBlocks(newBlocks);

					return;
				}

				diagramStore.setBlocks(newBlocks);
				fetchUpdateDiagram();
			},
		});
		// The engine names a deleted connection by id, and by the time it does the store no longer holds
		// it: keep what the store had right before the write to resolve that id back to its source port.
		// This leans on the engine writing connections before it reports the deletion; e2e
		// output-autolink-undo.spec.ts is what turns red if that order ever changes.
		let connectionsBeforeChange = [];
		const connections = computed({
			get(): Connection[]
			{
				return toValue(connectionsInStore);
			},
			set(newConnections: Connection[]): void
			{
				if (toValue(isWriteLocked))
				{
					return;
				}

				connectionsBeforeChange = toValue(connectionsInStore);
				diagramStore.setConnections(newConnections);
				fetchUpdateDiagram();
			},
		});

		const autosaveScheduler = createAutosaveScheduler(diagramStore.autosave);
		const fetchUpdateDiagram = autosaveScheduler.schedule;
		diagramStore.setPendingSaveFlush(autosaveScheduler.flush);
		onBeforeUnmount(() => {
			autosaveScheduler.cancel();
			diagramStore.setPendingSaveFlush(null);
		});

		// The selection goes into the dialog through the door of useSaveToLibrary(), the same one the
		// menu of a single node uses; the buffer of the copying is not touched at all.
		const { canSaveToLibrary, saveToLibrary } = useSaveToLibrary();

		function saveSelectionToLibrary(): void
		{
			const fragment = selectFragmentForLibrary(
				toValue(blocks),
				toValue(connections),
				toValue(highlitedBlockIds),
			);

			closeContextMenu();
			saveToLibrary(fragment.blocks, fragment.connections);
		}

		const groupMenuItems = computed(() => {
			const items = [
				toEditorMenuItem('copy-group', COPY_GROUP_TEST_ID, toValue(copyPaste.copyMenuItem)),
			];

			// The item is offered only where it can do something: the feature is on and there is a
			// selection to save. It carries no hotkey of its own and gets no caption plate for one.
			if (canSaveToLibrary() && toValue(highlitedBlockIds).length > 0)
			{
				items.push({
					id: 'save-to-library',
					html: getContextMenuItemHtml(
						getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_MENU_ITEM_SAVE'),
					),
					dataset: { testid: SAVE_TO_LIBRARY_TEST_ID },
					onclick: saveSelectionToLibrary,
				});
			}

			if (!toValue(isWriteLocked))
			{
				items.push({
					id: 'delete-group',
					html: getContextMenuItemHtml(
						getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'),
						IS_MAC ? '⌫' : 'Del',
					),
					onclick: handleDelete,
				});
			}

			return items;
		});

		const pasteMenuItem = computed((): MenuItemOptions => {
			return toEditorMenuItem('paste', PASTE_TEST_ID, toValue(copyPaste.pasteMenuItem));
		});

		/**
		 * The library is opened by the only event there is for it, and the place the menu was called at
		 * travels with it: the window is not modal, so by the time a fragment is chosen the pointer is
		 * long gone and the place has to be remembered. The point comes from the item of the menu, that
		 * is in world coordinates, exactly as the paste next to it gets it.
		 */
		function openFragmentLibrary(point: BlockPosition): void
		{
			EventEmitter.emit(FRAGMENT_LIBRARY_EVENTS.OPEN, { point });
		}

		const insertFromLibraryMenuItem = computed((): ?MenuItemOptions => {
			if (!isFeatureAvailable(FeatureCode.componentLibrary))
			{
				return null;
			}

			return {
				id: INSERT_FROM_LIBRARY_ITEM_ID,
				html: getContextMenuItemHtml(
					getMessage('BIZPROCDESIGNER_EDITOR_FRAGMENT_LIBRARY_MENU_ITEM_INSERT'),
				),
				dataset: { testid: INSERT_FROM_LIBRARY_TEST_ID },
				onclick: openFragmentLibrary,
			};
		});

		function onDropNewBlock(block: Block): void
		{
			autosaveScheduler.cancel();
			void diagramStore.updateBlockPublishStatus(block);
		}

		function onDeleteConnection(connectionId: string): void
		{
			if (toValue(isWriteLocked))
			{
				return;
			}

			diagramStore.setConnectionCurrentTimestamp(connectionId);
			if (removeOrphanedAuxPorts())
			{
				history.makeSnapshot();
				fetchUpdateDiagram();
			}
			mediator.removeUnboundOutputPort(
				connectionsBeforeChange.find((connection) => connection.id === connectionId),
			);
		}

		function getFirstAuxPort(auxPorts: Array<Port>): Port
		{
			return auxPorts.reduce((first, port) => {
				const { title: firstTitle } = first;
				const { title: portTitle } = port;
				const a = parseInt(firstTitle.replaceAll(/\D/g, ''), 10) || 0;
				const b = parseInt(portTitle.replaceAll(/\D/g, ''), 10) || 0;

				return b < a ? port : first;
			});
		}

		function removeOrphanedAuxPorts(): boolean
		{
			if (toValue(isWriteLocked))
			{
				return false;
			}

			let changed = false;

			for (const block of diagramStore.blocks)
			{
				const actionAuxPorts = getActionAuxPortsFromActivity(block.activity);
				const actionAuxPortIds = new Set(actionAuxPorts.keys());
				const connectedPortIds = getConnectedPortIds(diagramStore.connections, block.id);
				const auxPortIds = new Set(
					block.ports
						.filter((port) => port.type === PORT_TYPES.aux)
						.map((port) => port.id),
				);
				const connectedAuxPortIds = getUnconfiguredConnectedAuxPortIds(
					diagramStore.connections,
					block.id,
					auxPortIds,
					actionAuxPortIds,
				);
				const ports = syncPortsWithActionAuxPorts(block, actionAuxPorts, connectedAuxPortIds);
				if (ports !== block.ports)
				{
					diagramStore.setPorts(block.id, ports);
					changed = true;
				}

				const auxPorts = ports.filter(
					(port) => port.type === PORT_TYPES.aux && port.isActive !== false,
				);
				if (auxPorts.length <= 1)
				{
					continue;
				}

				const firstAuxPortId = getFirstAuxPort(auxPorts).id;

				const orphanedIds = new Set(
					auxPorts
						.filter((port) => {
							return shouldRemoveOrphanedAuxPort(
								port,
								firstAuxPortId,
								connectedPortIds,
								actionAuxPortIds,
							);
						})
						.map((port) => port.id),
				);

				if (orphanedIds.size > 0)
				{
					diagramStore.setPorts(
						block.id,
						ports.filter((port) => !orphanedIds.has(port.id)),
					);
					changed = true;
				}
			}

			return changed;
		}

		function onCreateConnection(connection: Connection): void
		{
			if (toValue(isWriteLocked))
			{
				return;
			}

			diagramStore.setConnectionCurrentTimestamp(connection.id);
		}

		watch(currentSnapshot, () => {
			mediator.syncSettingsWithDiagram();
		});

		watch([() => diagramStore.blocks, () => diagramStore.connections], () => {
			if (removeOrphanedAuxPorts())
			{
				history.makeSnapshot();
				fetchUpdateDiagram();
			}
		});

		// A wholesale graph swap (version view, restore, undo) leaves an open settings panel
		// showing a node of the graph that is gone.
		watch(() => diagramStore.graphRevision, () => {
			mediator.hideAllSettings();
			// The undo stack still describes the replaced graph: redo would write a foreign schema
			// into the current draft, undo would restore the one loaded with the page. The swapped-in
			// graph becomes the only base point (makeSnapshot is deferred, so it reads the new state).
			history.clear();
			history.makeSnapshot();
		});

		const { goToBlockById } = useCanvas();

		function onShowExpressionSource(event: BaseEvent): void
		{
			const blockId = event.getData()?.blockId;
			if (!blockId)
			{
				return;
			}

			highlightedBlocks.replace([blockId]);
			goToBlockById(blockId);
		}

		onMounted(() => {
			EventEmitter.subscribe(READABLE_EXPRESSION_SHOW_SOURCE_EVENT, onShowExpressionSource);
			if (removeOrphanedAuxPorts())
			{
				history.makeSnapshot();
			}
		});

		onUnmounted(() => {
			EventEmitter.unsubscribe(READABLE_EXPRESSION_SHOW_SOURCE_EVENT, onShowExpressionSource);
		});

		function onCanvasMouseDown(event: MouseEvent): void
		{
			if (event.button !== 0)
			{
				return;
			}

			const target = event.target;
			if (target instanceof Element && target.closest(CONNECTION_ELEMENT_SELECTOR))
			{
				return;
			}

			mediator.hideAllSettings();
		}

		return {
			blocks,
			connections,
			isConnectionRouteHitTestEnabled: isRouteHitTestActive,
			blockSlotNames: BLOCK_SLOT_NAMES,
			connectionSlotNames: CONNECTION_SLOT_NAMES,
			onDropNewBlock,
			highlitedBlockIds,
			isFeatureAvailable,
			groupMenuItems,
			selectionBoxConfig,
			pasteMenuItem,
			insertFromLibraryMenuItem,
			insertFragment,
			onDeleteConnection,
			onCreateConnection,
			closeContextMenu,
			onCanvasMouseDown,
			isWriteLocked,
		};
	},
	computed: {
		contextMenuItems(): Array<MenuItemOptions>
		{
			// The ban on writing closes the whole menu of the canvas: both items add nodes to the scheme.
			if (this.isWriteLocked)
			{
				return [];
			}

			return [
				this.pasteMenuItem,
				...(this.insertFromLibraryMenuItem ? [this.insertFromLibraryMenuItem] : []),
			];
		},
	},
	// @todo to widget
	watch: {
		highlitedBlockIds: {
			deep: true,
			handler(newIds: string[], oldIds: string[]): void
			{
				if (!this.isFeatureAvailable(FeatureCode.aiAssistant))
				{
					return;
				}

				if (oldIds.length > 0 && newIds.length === 0)
				{
					setUserSelectedBlock();
				}

				if (newIds.length === 1)
				{
					const id = newIds[0];
					const existedBlock = this.blocks.find((block) => block.id === id);
					if (existedBlock)
					{
						setUserSelectedBlock(id);
					}
				}
			},
		},
	},
	template: `
		<BlockDiagramEntity
			ref="blockDiagramEntity"
			v-model:blocks="blocks"
			v-model:connections="connections"
			:connection-route-hit-test-enabled="isConnectionRouteHitTestEnabled"
			:disabled="disabled"
			:enableGrouping="enableGrouping"
			:contextMenuItems="contextMenuItems"
			@mousedown="onCanvasMouseDown"
			@dropNewBlock="onDropNewBlock"
			@createConnection="onCreateConnection"
			@deleteConnection="onDeleteConnection"
		>
			<template
				v-for="slotName in Object.values(blockSlotNames)"
				#[slotName]="{ block }"
			>
				<slot
					:name="slotName"
					:block="block"
				/>
			</template>

			<template
				v-for="slotName in Object.values(connectionSlotNames)"
				#[slotName]="{ connection }"
			>
				<slot
					:name="slotName"
					:connection="connection"
				/>
			</template>

			<template #group-selection-box>
				<GroupSelectionBox
					v-if="enableGrouping"
					:menuItems="groupMenuItems"
					:padding="selectionBoxConfig.padding"
					:defaultBlockSize="selectionBoxConfig.defaultBlockSize"
				/>
			</template>
		</BlockDiagramEntity>
	`,
};
