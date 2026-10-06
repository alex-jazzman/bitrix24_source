import { Runtime, Browser, Text } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { type MenuItemOptions } from 'main.popup';
import {
	useHistory,
	GroupSelectionBox,
	useKeyboardShortcuts,
	useBlockDiagram,
	useCanvas,
	useHighlightedBlocks,
	useContextMenu,
	type Point,
} from 'ui.block-diagram';
import { UI } from 'ui.notification';
import { computed, toValue, watch, nextTick, onMounted, onUnmounted, onBeforeUnmount } from 'ui.vue3';
import { storeToRefs } from 'ui.vue3.pinia';

import { FeatureCode, type FeatureCodeType } from 'bizprocdesigner.feature';

import { setUserSelectedBlock } from '../../../../entities/ai-assistant/api/api';
import {
	BlockDiagram as BlockDiagramEntity,
	diagramStore as useDiagramStore,
	BLOCK_SLOT_NAMES,
	CONNECTION_SLOT_NAMES,
	useBufferStore,
} from '../../../../entities/blocks';
import {
	READABLE_EXPRESSION_SHOW_SOURCE_EVENT,
} from '../../../../features/node-settings/ui/readable-expression-popover/readable-expression-popover';
import { useFeature, useLoc } from '../../../../shared/composables';
import { PORT_TYPES, BLOCK_TYPES } from '../../../../shared/constants';
import { type Block, type Connection, type Port } from '../../../../shared/types';
import {
	useCopyPaste,
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
	performPaste: (point: Point) => void,
	isBufferEmpty: boolean,
	isWriteLocked: boolean,
};

const DEFAULT_SELECTION_PADDING = { top: 27, bottom: 25, left: 17, right: 17 };
const DEFAULT_BLOCK_SIZE = { width: 150, height: 100 };
const SWITCHER_WIDTH = 17;
const AUTOSAVE_DELAY = 700;

// mousedown on these elements must not close the settings panel (connection line / its delete button)
const CONNECTION_ELEMENT_SELECTOR = '.ui-block-diagram-connection, .ui-block-diagram-delete-connection-btn';

type AutosaveScheduler = {
	schedule: () => void,
	cancel: () => void,
};

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

	return { schedule, cancel };
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
		const bufferStore = useBufferStore();
		const { blocks: blocksInStore, connections: connectionsInStore } = storeToRefs(diagramStore);
		const { getMessage } = useLoc();
		const highlightedBlocks = useHighlightedBlocks();
		const highlitedBlockIds = highlightedBlocks.highlitedBlockIds;
		const { isFeatureAvailable } = useFeature();
		const blockDiagram = useBlockDiagram();
		const {
			transformEventToPoint,
			transformX,
			transformY,
			currentSnapshot,
			movingBlockId,
			rollbackBlockUpdate,
		} = blockDiagram;
		const insertNodeController = useInsertNodeIntoConnection({
			diagramStore,
			blockDiagram,
			selectedBlockIds: highlitedBlockIds,
			disabled: computed(() => props.disabled),
			createConnectionId: () => Text.getRandom(),
			now: () => Date.now(),
			scheduleSave: () => fetchUpdateDiagram(),
		});
		blockDiagram.hooks.startDragBlock.on(insertNodeController.onStartDragBlock);
		blockDiagram.hooks.moveDragBlock.on(insertNodeController.onMoveDragBlock);
		blockDiagram.hooks.endDragBlock.on(insertNodeController.onEndDragBlock);
		onUnmounted(() => {
			blockDiagram.hooks.startDragBlock.off(insertNodeController.onStartDragBlock);
			blockDiagram.hooks.moveDragBlock.off(insertNodeController.onMoveDragBlock);
			blockDiagram.hooks.endDragBlock.off(insertNodeController.onEndDragBlock);
			insertNodeController.dispose();
		});

		const history = useHistory();
		const copyPaste = useCopyPaste();
		const mediator = new BlockMediator();

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

		const performPaste = (point: Point): void => {
			if (toValue(isWriteLocked))
			{
				return;
			}

			try
			{
				highlightedBlocks.clear();

				const newBlocks = copyPaste.paste(point);
				// paste() has already saved the whole group at once, while adding the blocks
				// raised the `blocks` setter and scheduled a deferred save of the same change.
				// An empty buffer pastes nothing and saves nothing, so there is no duplicate to
				// drop: cancelling here would silently throw away the pending save of an earlier
				// change and leave it only in the browser.
				if (newBlocks.length > 0)
				{
					autosaveScheduler.cancel();
				}

				nextTick(() => {
					if (newBlocks.length > 0)
					{
						highlightedBlocks.set(newBlocks.map((block) => block.id));
					}

					if (newBlocks.length === 1)
					{
						mediator.showNodeSettings(newBlocks[0]);
					}
				});

				history.makeSnapshot();
			}
			catch (e)
			{
				console.error('Paste error:', e);
			}
		};

		const handleCopy = () => {
			const selectedIds = toValue(highlitedBlockIds);
			if (selectedIds.length === 0)
			{
				return;
			}

			const selectedBlocks = blocks.value.filter((block) => selectedIds.includes(block.id));

			const selectedConnections = toValue(connections).filter((conn) => {
				return selectedIds.includes(conn.sourceBlockId) && selectedIds.includes(conn.targetBlockId);
			});

			bufferStore.setBufferContent({
				blocks: selectedBlocks,
				connections: selectedConnections,
			});
			closeContextMenu();
		};

		const handlePasteShortcut = (event: KeyboardEvent, mousePos: { x: number, y: number }) => {
			const rawPoint = transformEventToPoint({
				clientX: mousePos.x,
				clientY: mousePos.y,
			});

			const correctedPoint = {
				x: rawPoint.x + (toValue(transformX) || 0),
				y: rawPoint.y + (toValue(transformY) || 0),
			};
			performPaste(correctedPoint);
		};

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
				keys: ['Mod', 'c'],
				handler: handleCopy,
			},
			{
				keys: ['Mod', 'v'],
				handler: handlePasteShortcut,
			},
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

		const blocks = computed({
			get(): Block[]
			{
				return toValue(blocksInStore);
			},
			set(newBlocks: Block[])
			{
				if (insertNodeController.interceptBlocksUpdate(newBlocks).handled)
				{
					const interceptedBlockId = toValue(movingBlockId);
					const attemptedBlock = newBlocks.find((block) => block.id === interceptedBlockId);
					const actualBlock = toValue(blocksInStore).find((block) => block.id === interceptedBlockId);

					rollbackBlockUpdate(attemptedBlock, actualBlock);

					return;
				}

				diagramStore.setBlocks(newBlocks);
				fetchUpdateDiagram();
			},
		});
		const connections = computed({
			get(): Connection[]
			{
				return toValue(connectionsInStore);
			},
			set(newConnections: Connection[]): void
			{
				diagramStore.setConnections(newConnections);
				fetchUpdateDiagram();
			},
		});

		const autosaveScheduler = createAutosaveScheduler(diagramStore.autosave);
		const fetchUpdateDiagram = autosaveScheduler.schedule;
		onBeforeUnmount(autosaveScheduler.cancel);

		const groupMenuItems = computed(() => {
			const items = [
				{
					id: 'copy-group',
					html: getContextMenuItemHtml(
						getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_COPY'),
						IS_MAC ? '⌘ C' : 'Ctrl-C',
					),
					onclick: handleCopy,
				},
			];

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

		const isBufferEmpty = computed(() => bufferStore.isBufferEmpty);

		function onDropNewBlock(block: Block): void
		{
			autosaveScheduler.cancel();
			void diagramStore.updateBlockPublishStatus(block);
		}

		function onDeleteConnection(connectionId: string): void
		{
			diagramStore.setConnectionCurrentTimestamp(connectionId);
			removeOrphanedAuxPorts();
		}

		function getConnectedPortIds(blockId: string): Set<string>
		{
			const ids = new Set();
			for (const connection of diagramStore.connections)
			{
				if (connection.sourceBlockId === blockId)
				{
					ids.add(connection.sourcePortId);
				}

				if (connection.targetBlockId === blockId)
				{
					ids.add(connection.targetPortId);
				}
			}

			return ids;
		}

		function getFirstAuxPort(auxPorts: Array<Port>): Port
		{
			return auxPorts.reduce((first, port) => {
				const a = parseInt(first.title.replaceAll(/\D/g, ''), 10) || 0;
				const b = parseInt(port.title.replaceAll(/\D/g, ''), 10) || 0;

				return b < a ? port : first;
			});
		}

		function removeOrphanedAuxPorts(): void
		{
			for (const block of diagramStore.blocks)
			{
				const auxPorts = block.ports.filter(
					(port) => port.type === PORT_TYPES.aux && port.isActive !== false,
				);
				if (auxPorts.length <= 1)
				{
					continue;
				}

				const connectedPortIds = getConnectedPortIds(block.id);
				const firstAuxPortId = getFirstAuxPort(auxPorts).id;

				const orphanedIds = new Set(
					auxPorts
						.filter((port) => port.id !== firstAuxPortId && !connectedPortIds.has(port.id))
						.map((port) => port.id),
				);

				if (orphanedIds.size > 0)
				{
					diagramStore.setPorts(
						block.id,
						block.ports.filter((port) => !orphanedIds.has(port.id)),
					);
				}
			}
		}

		function onCreateConnection(connection: Connection): void
		{
			diagramStore.setConnectionCurrentTimestamp(connection.id);
		}

		watch(currentSnapshot, () => {
			mediator.syncSettingsWithDiagram();
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

			highlightedBlocks.set([blockId]);
			goToBlockById(blockId);
		}

		onMounted(() => {
			EventEmitter.subscribe(READABLE_EXPRESSION_SHOW_SOURCE_EVENT, onShowExpressionSource);
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
			isConnectionRouteHitTestEnabled: insertNodeController.isRouteHitTestActive,
			blockSlotNames: BLOCK_SLOT_NAMES,
			connectionSlotNames: CONNECTION_SLOT_NAMES,
			onDropNewBlock,
			highlitedBlockIds,
			isFeatureAvailable,
			groupMenuItems,
			selectionBoxConfig,
			performPaste,
			isBufferEmpty,
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
			if (this.isWriteLocked)
			{
				return [];
			}

			return [
				this.pasteMenuItem,
			];
		},
		pasteMenuItem(): MenuItemOptions
		{
			return {
				id: 'paste',
				disabled: this.isBufferEmpty,
				html: getContextMenuItemHtml(
					this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_PASTE'),
					IS_MAC ? '⌘ V' : 'Ctrl-V',
				),
				onclick: (point: Point): void => {
					this.performPaste(point);
				},
			};
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
