import type { FeatureCodeType } from 'bizprocdesigner.feature';
import { FeatureCode } from 'bizprocdesigner.feature';
import type { MenuItemOptions } from 'main.popup';
import type { Point } from 'ui.block-diagram';
import { computed, toValue, inject } from 'ui.vue3';
import { storeToRefs } from 'ui.vue3.pinia';
import { Runtime, Browser } from 'main.core';
import { UI } from 'ui.notification';
import {
	useAnimationQueue,
	useHistory,
	GroupSelectionBox,
	useKeyboardShortcuts,
	useBlockDiagram,
	useHighlightedBlocks,
} from 'ui.block-diagram';
import { setUserSelectedBlock } from '../../../../entities/ai-assistant/api/api';
import { useFeature, useLoc } from '../../../../shared/composables';
import type { Block, Connection } from '../../../../shared/types';
import {
	BlockDiagram as BlockDiagramEntity,
	diagramStore as useDiagramStore,
	BLOCK_SLOT_NAMES,
	CONNECTION_SLOT_NAMES,
	BLOCK_TYPES,
	useBufferStore,
} from '../../../../entities/blocks';
import { CopyPaste, BlockMediator } from '../../lib';

type SetupType = {
	blocks: Array<Block>,
	connections: Array<Connection>,
	blockSlotNames: { [string]: string },
	connectionSlotNames: { [string]: string },
	onBlockTransitionEnd: (block: Block) => void,
	onDropNewBlock: (block: Block) => void,
	highlitedBlockIds: Array<string>,
	isFeatureAvailable: (featureCode: FeatureCodeType) => boolean,
	performPaste: (point: Point) => void,
	isBufferEmpty: boolean,
};

const DEFAULT_SELECTION_PADDING = { top: 27, bottom: 25, left: 17, right: 17 };
const DEFAULT_BLOCK_SIZE = { width: 150, height: 100 };
const SWITCHER_WIDTH = 17;

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
	setup(): SetupType
	{
		const showBlockSettings = inject('showBlockSettings');
		const animationQueue = useAnimationQueue();
		const diagramStore = useDiagramStore();
		const bufferStore = useBufferStore();
		const { blocks: blocksInStore, connections: connectionsInStore } = storeToRefs(diagramStore);
		const { getMessage } = useLoc();
		const highlightedBlocks = useHighlightedBlocks();
		const highlitedBlockIds = highlightedBlocks.highlitedBlockIds;
		const history = useHistory();
		const { isFeatureAvailable } = useFeature();
		const { transformEventToPoint, transformX, transformY } = useBlockDiagram();
		const copyPaste = new CopyPaste();
		const isMac = Browser.isMac();
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

		const blocks = computed({
			get(): Block[]
			{
				return toValue(blocksInStore);
			},
			set(newBlocks: Block[])
			{
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
		const performPaste = (point: Point): void => {
			try
			{
				copyPaste.paste(point);
				history.makeSnapshot();
			}
			catch (e)
			{
				console.error('Paste error:', e);
			}
		};

		const handleCopy = () => {
			const ids = toValue(highlitedBlockIds);
			if (ids.length > 0)
			{
				const blockToCopy = toValue(blocksInStore).find((b) => b.id === ids[0]);
				if (blockToCopy)
				{
					bufferStore.copyBlock(blockToCopy);
				}
			}
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

		const handleUndo = () => {
			if (history.hasPrev)
			{
				history.prev();
				mediator.syncSettingsWithDiagram();
			}
		};

		const handleRedo = () => {
			if (history.hasNext)
			{
				history.next();
				mediator.syncSettingsWithDiagram();
			}
		};

		const handleDelete = () => {
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
				keys: ['Mod', 'z'],
				handler: handleUndo,
			},
			{
				keys: isMac ? ['Mod', 'Shift', 'z'] : ['Mod', 'y'],
				handler: handleRedo,
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

		const fetchUpdateDiagram = Runtime.debounce(updateDiagramData, 700);

		const groupMenuItems = computed(() => [
			{
				id: 'delete-group',
				text: getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_DELETE'),
				onclick: handleDelete,
			},
		]);

		const isBufferEmpty = computed(() => bufferStore.isBufferEmpty);

		async function updateDiagramData(): Promise<void>
		{
			const maxAttempts = 3;
			let attempt = 0;

			while (attempt < maxAttempts)
			{
				try
				{
					// eslint-disable-next-line no-await-in-loop
					await diagramStore.publicDraft();
					diagramStore.updateStatus(true);

					return;
				}
				catch
				{
					attempt++;
					if (attempt >= maxAttempts)
					{
						diagramStore.updateStatus(false);

						UI.Notification.Center.notify({
							content: getMessage('BIZPROCDESIGNER_EDITOR_TOP_PANEL_AUTOSAVE_STATUS_NOT_SAVED_HINT'),
							autoHideDelay: 4000,
						});
					}
				}
			}
		}

		function onDropNewBlock(block: Block): void
		{
			diagramStore.updateBlockPublishStatus(block);
		}

		async function onBlockTransitionEnd(block: Block): Promise<void>
		{
			if (!block || !block.position)
			{
				console.warn('Incorrect object for block transition end event', block);

				return;
			}

			animationQueue.pause();
			try
			{
				// TODO: replace the method showBlockSettings with honey from slices app and settings
				await showBlockSettings(block, true);
			}
			finally
			{
				animationQueue.play();
			}
		}

		function onDeleteConnection(connectionId: string): void
		{
			diagramStore.setConnectionCurrentTimestamp(connectionId);
		}

		function onCreateConnection(connection: Connection): void
		{
			diagramStore.setConnectionCurrentTimestamp(connection.id);
		}

		return {
			blocks,
			connections,
			blockSlotNames: BLOCK_SLOT_NAMES,
			connectionSlotNames: CONNECTION_SLOT_NAMES,
			onBlockTransitionEnd,
			onDropNewBlock,
			highlitedBlockIds,
			isFeatureAvailable,
			groupMenuItems,
			selectionBoxConfig,
			performPaste,
			isBufferEmpty,
			onDeleteConnection,
			onCreateConnection,
		};
	},
	computed: {
		contextMenuItems(): Array<MenuItemOptions>
		{
			return [
				this.pasteMenuItem,
			];
		},
		pasteMenuItem(): MenuItemOptions
		{
			return {
				id: 'paste',
				disabled: this.isBufferEmpty,
				text: this.$Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_BLOCK_CONTEXT_MENU_ITEM_PASTE'),
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
			:disabled="disabled"
			:enableGrouping="enableGrouping"
			:contextMenuItems="contextMenuItems"
			@blockTransitionEnd="onBlockTransitionEnd"
			@dropNewBlock="onDropNewBlock"
			@createConnection="onCreateConnection"
			@deleteConnection="onDeleteConnection"
		>
			<template #[blockSlotNames.SIMPLE]="{ block }">
				<slot
					:name="blockSlotNames.SIMPLE"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.TRIGGER]="{ block }">
				<slot
					:name="blockSlotNames.TRIGGER"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.COMPLEX]="{ block }">
				<slot
					:name="blockSlotNames.COMPLEX"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.COMPLEX]="{ block }">
				<slot
					:name="blockSlotNames.COMPLEX"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.TOOL]="{ block }">
				<slot
					:name="blockSlotNames.TOOL"
					:block="block"
				/>
			</template>

			<template #[blockSlotNames.FRAME]="{ block }">
				<slot
					:name="blockSlotNames.FRAME"
					:block="block"
				/>
			</template>

			<template #[connectionSlotNames.AUX]="{ connection }">
				<slot
					:name="connectionSlotNames.AUX"
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
