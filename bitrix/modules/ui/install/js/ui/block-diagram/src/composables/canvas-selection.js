import { ref, toValue } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';

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
	start: MouseEvent,
	move: MouseEvent,
};

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

	return {
		isSelecting: isSelectionActive,
		selectionRect,
		start,
		move,
		end,
	};
}
