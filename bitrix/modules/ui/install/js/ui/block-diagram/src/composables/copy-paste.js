import { computed, nextTick, toValue, type ComputedRef } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { useBlockPlacement } from './block-placement';
import { useContextMenu } from './context-menu';
import { useDisplacedBlocks } from './displaced-blocks';
import { useGroupable } from './groupable';
import { useHighlightedBlocks } from './highlighted-blocks';
import { useHistory } from './history';
import { useKeyboardShortcuts } from './keyboard-shortcuts';
import { useLoc } from './loc';
import {
	formatComboCaption,
	hasTextSelectionOutside,
	issueNewFragmentIds,
	layoutFragmentBlocks,
	CANVAS_ACTION_ID,
	type DiagramBlockIdFactory,
	type DiagramBlockIdMap,
} from '../utils';
import {
	type DiagramBlock,
	type DiagramBlockId,
	type DiagramClipboardContent,
	type DiagramConnection,
	type Point,
} from '../types';

const COPY_MENU_ITEM_ID = 'copyBlocks';
const PASTE_MENU_ITEM_ID = 'pasteBlocks';

export type CopyPasteMenuItem = {
	id: string;
	text: string;
	hotkey: string;
	disabled: boolean;
	onclick: (point: Point) => void;
};

export type DiagramPasteBlocksPayload = {
	blocks: DiagramBlock[];
	connections: DiagramConnection[];
	point: Point;
};

export type DiagramFragmentCloner = (
	content: DiagramClipboardContent,
	blockIdMap: DiagramBlockIdMap,
) => DiagramClipboardContent;

export type UseCopyPasteOptions = {
	createBlockId?: DiagramBlockIdFactory;
	cloneContent?: DiagramFragmentCloner;
	canPaste?: () => boolean;
	shortcuts?: boolean;
};

export type UseCopyPaste = {
	// Answers whether the buffer was written: an empty node selection copies nothing.
	copy: () => boolean;
	paste: (point: Point) => DiagramBlock[];
	isBufferEmpty: ComputedRef<boolean>;
	copyMenuItem: ComputedRef<CopyPasteMenuItem>;
	pasteMenuItem: ComputedRef<CopyPasteMenuItem>;
};

function selectFragment(
	blocks: DiagramBlock[],
	connections: DiagramConnection[],
	selectedIds: DiagramBlockId[],
	isBackdrop: (blockId: DiagramBlockId) => boolean,
): DiagramClipboardContent
{
	const selected: Set<DiagramBlockId> = new Set(selectedIds);

	return {
		blocks: blocks.filter((block: DiagramBlock): boolean => selected.has(block.id)),
		backdropIds: selectedIds.filter((blockId: DiagramBlockId): boolean => isBackdrop(blockId)),
		// A connection with an end outside the selection is left out: pasted, it would hang on a
		// block that is not part of the fragment.
		connections: connections.filter((connection: DiagramConnection): boolean => {
			return selected.has(connection.sourceBlockId)
				&& selected.has(connection.targetBlockId);
		}),
	};
}

/**
 * Sets up copying and pasting for the diagram it is called inside of. Called once per diagram
 * application: a second call registers a second pair of Mod+C/Mod+V on the shared input state, and
 * one keypress pastes twice. The signature is public API, consumers live outside this repository.
 */
// eslint-disable-next-line max-lines-per-function
export function useCopyPaste(options: UseCopyPasteOptions = {}): UseCopyPaste
{
	const {
		createBlockId,
		cloneContent = (content: DiagramClipboardContent): DiagramClipboardContent => content,
		canPaste = (): boolean => true,
		shortcuts = true,
	} = options;

	const {
		blockDiagramRef,
		blocks,
		connections,
		highlitedBlockIds,
		transformX,
		transformY,
		addBlocks,
		addConnections,
		transformEventToPoint,
		isDisabledBlockDiagram,
		hooks,
		actionRegistry,
		copyPasteBuffer: buffer,
	} = useBlockDiagram();
	const highlightedBlocks = useHighlightedBlocks();
	const history = useHistory();
	const { closeContextMenu } = useContextMenu();
	const { resolvePlacementDelta } = useBlockPlacement();
	const { isGroupableBlock } = useGroupable();
	const { mark: markDisplacedBlocks, announceRefusal } = useDisplacedBlocks();
	const loc = useLoc();

	function copy(): boolean
	{
		const selectedIds: DiagramBlockId[] = toValue(highlitedBlockIds);
		// An empty selection leaves the buffer untouched, so a previously copied fragment stays
		// available for pasting. Copying itself is never restricted by canPaste.
		if (selectedIds.length === 0)
		{
			return false;
		}

		buffer.setContent(
			selectFragment(toValue(blocks), toValue(connections), selectedIds, isGroupableBlock),
		);
		closeContextMenu();

		return true;
	}

	// A pasted block has not mounted yet, so the registry of containers knows nothing of it. The copy
	// inherits what the original was - a pasted container lies over the nodes it covers instead of
	// pushing them away - and that is read from the buffer, where it was written while the original
	// was still on the canvas. The registry answers only for content copied before the buffer began
	// to carry the flag; asking it for a copied-then-deleted container would lose the flag.
	function collectPastedBackdropIds(
		blockIdMap: DiagramBlockIdMap,
		copiedBackdropIds: DiagramBlockId[] | null,
	): Set<DiagramBlockId>
	{
		const wasBackdrop = copiedBackdropIds === null
			? isGroupableBlock
			: (blockId: DiagramBlockId): boolean => copiedBackdropIds.includes(blockId);
		const backdropIds = new Set();

		for (const [sourceBlockId, pastedBlockId] of blockIdMap)
		{
			if (wasBackdrop(sourceBlockId))
			{
				backdropIds.add(pastedBlockId);
			}
		}

		return backdropIds;
	}

	function paste(point: Point): DiagramBlock[]
	{
		// Checked before the buffer is read and before the highlight is cleared: a forbidden paste
		// leaves the canvas exactly as it was. The canvas flag closes pasting the same way it
		// closes the other model-changing gestures; canPaste is the domain guard on top of it.
		if (toValue(isDisabledBlockDiagram) || !canPaste())
		{
			return [];
		}

		try
		{
			const content: DiagramClipboardContent | null = buffer.getContent();
			if (content === null || content.blocks.length === 0)
			{
				// An empty paste drops the current selection too: the gesture did happen, it simply
				// had nothing to put on the canvas.
				highlightedBlocks.clear();

				return [];
			}

			const fragment = issueNewFragmentIds(content, createBlockId);
			const clonedContent: DiagramClipboardContent = cloneContent(fragment.content, fragment.blockIdMap);
			const fragmentBlocks: DiagramBlock[] = layoutFragmentBlocks(clonedContent.blocks, point);
			// The whole fragment is one set of participants, so its blocks never block each other: the
			// overlaps it may carry came from the schema it was copied from, and sanitising those is
			// not what this rule is for. The grid is left out of the correction on purpose - the
			// fragment lands where it was aimed at, and the layout above never aligned it either.
			const placementDelta = resolvePlacementDelta(
				fragmentBlocks.map((block: DiagramBlock) => ({
					id: block.id,
					x: block.position.x,
					y: block.position.y,
					width: block.dimensions?.width,
					height: block.dimensions?.height,
				})),
				{
					followsGrid: false,
					backdropIds: collectPastedBackdropIds(fragment.blockIdMap, content.backdropIds ?? null),
				},
			);

			// No free room within the budget: nothing is pasted at all, so the model never comes to
			// hold a forbidden overlap and no snapshot of a half-done paste is taken. The buffer keeps
			// its content and the selection keeps its blocks, so the user may aim somewhere else and
			// try again - which is worth saying out loud, as the canvas itself stays exactly as it was.
			if (placementDelta === null)
			{
				announceRefusal();

				return [];
			}

			// Dropped only once the paste is certain to happen, and strictly before the model changes:
			// what is pasted becomes the new selection, and a refusal above leaves the old one alone.
			highlightedBlocks.clear();

			// Applied before the write: after it the paste would owe the history a second state.
			const pastedBlocks: DiagramBlock[] = fragmentBlocks.map((block: DiagramBlock): DiagramBlock => ({
				...block,
				position: {
					...block.position,
					x: block.position.x + placementDelta.x,
					y: block.position.y + placementDelta.y,
				},
			}));

			addBlocks(pastedBlocks);
			addConnections(clonedContent.connections);

			if (placementDelta.x !== 0 || placementDelta.y !== 0)
			{
				markDisplacedBlocks(pastedBlocks.map((block: DiagramBlock): DiagramBlockId => block.id));
			}

			// The highlight is queued before the hook fires and the snapshot, which defers itself
			// to the same queue, is registered after it: a subscriber deferring its own work lands
			// between the two.
			void nextTick(() => {
				highlightedBlocks.replace(pastedBlocks.map((block: DiagramBlock): DiagramBlockId => block.id));
			});

			// Connections go out as proposed, not as accepted: addConnections silently drops the
			// ones duplicating an already existing block and port pair.
			const payload: DiagramPasteBlocksPayload = {
				blocks: pastedBlocks,
				connections: clonedContent.connections,
				point,
			};
			// Subscribers live outside the extension: a failing one must not cost the paste that
			// already reached the model its own undo step.
			try
			{
				hooks.pasteBlocks.trigger(payload);
			}
			catch (error)
			{
				console.error('Paste error:', error);
			}

			void history.makeSnapshot();

			return pastedBlocks;
		}
		catch (error)
		{
			console.error('Paste error:', error);

			return [];
		}
	}

	/**
	 * Turns the last known pointer position into a paste point. A menu item lands its point inside
	 * the transformed layer, so it is already in world coordinates; the pointer is in viewport
	 * ones, and the camera shift has to be added on top. The two entry points stay different on
	 * purpose: unifying them would move one of them by the pan of the camera.
	 */
	function getShortcutPastePoint(pointer: Point): Point
	{
		const rawPoint: Point = transformEventToPoint({ clientX: pointer.x, clientY: pointer.y });

		return {
			x: rawPoint.x + (toValue(transformX) || 0),
			y: rawPoint.y + (toValue(transformY) || 0),
		};
	}

	/**
	 * Decides who the press belongs to. The browser action is not suppressed up front: text
	 * selected outside the canvas is the browser's to copy, and a press that copied no node has
	 * nothing to suppress it for. Only a copy that actually happened takes the key away.
	 */
	function onCopyShortcut(event: KeyboardEvent): void
	{
		if (hasTextSelectionOutside(toValue(blockDiagramRef)))
		{
			return;
		}

		if (!copy())
		{
			return;
		}

		event.preventDefault();
	}

	if (shortcuts)
	{
		useKeyboardShortcuts([
			{
				actionId: CANVAS_ACTION_ID.COPY,
				preventDefault: false,
				handler: onCopyShortcut,
			},
			{
				actionId: CANVAS_ACTION_ID.PASTE,
				// The shortcut never checks the buffer: the only guard on this path is canPaste.
				handler: (event: KeyboardEvent, pointer: Point): void => {
					paste(getShortcutPastePoint(pointer));
				},
			},
		]);
	}

	// Descriptions, not markup: the consumer puts them into its own menu and overrides any field.
	// The canvas component does not mix them in on its own, so a consumer passing no items keeps
	// the canvas menu closed the way it is today.
	//
	// The combo is read through the version of the registry: the maps behind it are plain - a store
	// keeps the registry markRaw - and without that dependency the item would go on offering the
	// caption of its first build after a reassignment.
	const announcedCombo = (actionId: string): string | null => {
		actionRegistry.getVersion();

		return formatComboCaption(actionRegistry.getCombo(actionId));
	};

	const copyMenuItem: ComputedRef<CopyPasteMenuItem> = computed((): CopyPasteMenuItem => ({
		id: COPY_MENU_ITEM_ID,
		text: loc.getMessage('UI_BLOCK_DIAGRAM_CONTEXT_MENU_ITEM_COPY'),
		hotkey: announcedCombo(CANVAS_ACTION_ID.COPY),
		// Copying is never restricted, the paste predicate does not reach it.
		disabled: false,
		onclick: (): void => {
			copy();
		},
	}));

	const pasteMenuItem: ComputedRef<CopyPasteMenuItem> = computed((): CopyPasteMenuItem => ({
		id: PASTE_MENU_ITEM_ID,
		text: loc.getMessage('UI_BLOCK_DIAGRAM_CONTEXT_MENU_ITEM_PASTE'),
		hotkey: announcedCombo(CANVAS_ACTION_ID.PASTE),
		// The same guards paste() checks, in the same order: an item announced as available has to
		// do something when clicked. A consumer passing a non-reactive canPaste keeps the value it
		// had at the last recomputation.
		disabled: toValue(isDisabledBlockDiagram) || !canPaste() || toValue(buffer.isEmpty),
		onclick: (point: Point): void => {
			paste(point);
		},
	}));

	return {
		copy,
		paste,
		isBufferEmpty: buffer.isEmpty,
		copyMenuItem,
		pasteMenuItem,
	};
}
