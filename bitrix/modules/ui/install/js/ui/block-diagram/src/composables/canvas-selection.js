import { onBeforeUnmount, ref, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { bindCancelPaths, type UnbindCancelPaths } from './gesture';
import { replaceSelection } from './highlighted-blocks';
import { type DiagramBlockId } from '../types';

type Rect = {
	x: number,
	y: number,
	width: number,
	height: number,
};

type UseCanvasSelectionParams = {
	rootRef: ?HTMLElement,
	transformLayoutRef: ?HTMLElement,
};

type UseCanvasSelection = {
	isSelecting: boolean,
	selectionRect: Rect,
	start: (event: MouseEvent) => void,
	move: (event: MouseEvent) => void,
	end: () => void,
};

// eslint-disable-next-line max-lines-per-function
export function useCanvasSelection(params: UseCanvasSelectionParams): UseCanvasSelection
{
	const {
		zoom,
		setSelectionWorldRect,
		setSelectionActive,
		isSelectionActive,
		startAutoScroll,
		stopAutoScroll,
		updateMousePosition,
		highlitedBlockIds,
		inputState,
	} = useBlockDiagram();
	const { rootRef, transformLayoutRef } = params;
	const selectionRect = ref({ x: 0, y: 0, width: 0, height: 0 });

	let startClientX = 0;
	let startClientY = 0;
	let cachedRootRect = null;
	let cachedLayerRect = null;
	let scrollOffsetX = 0;
	let scrollOffsetY = 0;
	let lastClientX = 0;
	let lastClientY = 0;
	// The selection as it stood before the press cleared it, and the handle on the cancel paths:
	// the drag is open for exactly as long as that handle is held.
	let selectionBeforeDrag: Array<DiagramBlockId> = [];
	let unbindCancelPaths: UnbindCancelPaths | null = null;

	function updateRects(clientX: number, clientY: number): void
	{
		if (!cachedRootRect || !cachedLayerRect)
		{
			return;
		}

		const currentZoom = toValue(zoom);
		if (!currentZoom)
		{
			return;
		}

		const visualStartX = (startClientX - cachedRootRect.left) - scrollOffsetX;
		const visualStartY = (startClientY - cachedRootRect.top) - scrollOffsetY;
		const currentVisualX = clientX - cachedRootRect.left;
		const currentVisualY = clientY - cachedRootRect.top;

		selectionRect.value = {
			x: Math.min(visualStartX, currentVisualX),
			y: Math.min(visualStartY, currentVisualY),
			width: Math.abs(currentVisualX - visualStartX),
			height: Math.abs(currentVisualY - visualStartY),
		};

		const startLayerX = startClientX - cachedLayerRect.left;
		const startLayerY = startClientY - cachedLayerRect.top;
		const currentLayerX = clientX - cachedLayerRect.left + scrollOffsetX;
		const currentLayerY = clientY - cachedLayerRect.top + scrollOffsetY;

		setSelectionWorldRect({
			x: Math.min(startLayerX, currentLayerX) / currentZoom,
			y: Math.min(startLayerY, currentLayerY) / currentZoom,
			width: Math.abs(currentLayerX - startLayerX) / currentZoom,
			height: Math.abs(currentLayerY - startLayerY) / currentZoom,
		});
	}

	function start(event: MouseEvent): void
	{
		const root = toValue(rootRef);
		const layer = toValue(transformLayoutRef);
		if (!root || !layer)
		{
			return;
		}

		startClientX = event.clientX;
		startClientY = event.clientY;
		lastClientX = event.clientX;
		lastClientY = event.clientY;
		scrollOffsetX = 0;
		scrollOffsetY = 0;
		// A cancelled drag leaves the diagram the way it found it, so what stood selected is kept
		// until the drag ends one way or another.
		selectionBeforeDrag = [...toValue(highlitedBlockIds)];

		cachedRootRect = root.getBoundingClientRect();
		cachedLayerRect = layer.getBoundingClientRect();

		const visualStartX = startClientX - cachedRootRect.left;
		const visualStartY = startClientY - cachedRootRect.top;

		setSelectionActive(true);
		selectionRect.value = { x: visualStartX, y: visualStartY, width: 0, height: 0 };

		startAutoScroll(event, (dx: number, dy: number) => {
			scrollOffsetX += dx;
			scrollOffsetY += dy;
			updateRects(lastClientX, lastClientY);
		});

		// A drag whose release never arrived is still open when this press comes: a mouseup
		// dispatched on the window never travels down to the document. The handle is the only way
		// left to unbind its subscriptions.
		unbindCancelPaths?.();
		unbindCancelPaths = bindCancelPaths(inputState, cancel);
	}

	function move(event: MouseEvent): void
	{
		if (!toValue(isSelectionActive) || !cachedRootRect || !cachedLayerRect)
		{
			return;
		}

		lastClientX = event.clientX;
		lastClientY = event.clientY;
		updateMousePosition(event);
		updateRects(event.clientX, event.clientY);
	}

	function end(): void
	{
		unbindCancelPaths?.();
		unbindCancelPaths = null;
		stopAutoScroll();

		if (toValue(isSelectionActive))
		{
			setSelectionActive(false);
			setSelectionWorldRect(null);
			selectionRect.value = { x: 0, y: 0, width: 0, height: 0 };
		}

		cachedRootRect = null;
		cachedLayerRect = null;
	}

	// A cancelled gesture is one that never happened: the selection goes back to what the press
	// found. A release does not come here - what it selected is its result.
	function cancel(): void
	{
		if (unbindCancelPaths === null)
		{
			return;
		}

		replaceSelection(highlitedBlockIds, selectionBeforeDrag);
		end();
	}

	// The cancel paths listen on the document and the window: a diagram taken down mid-drag has to
	// take them with it.
	onBeforeUnmount(() => {
		unbindCancelPaths?.();
		unbindCancelPaths = null;
	});

	return {
		isSelecting: isSelectionActive,
		selectionRect,
		start,
		move,
		end,
	};
}
