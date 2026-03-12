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
	const { zoom, setSelectionWorldRect, setSelectionActive, isSelectionActive } = useBlockDiagram();
	const { rootRef, transformLayoutRef } = params;
	const selectionRect = ref({ x: 0, y: 0, width: 0, height: 0 });

	let startClientX = 0;
	let startClientY = 0;
	let cachedRootRect = null;
	let cachedLayerRect = null;

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

		cachedRootRect = root.getBoundingClientRect();
		cachedLayerRect = layer.getBoundingClientRect();

		const visualStartX = startClientX - cachedRootRect.left;
		const visualStartY = startClientY - cachedRootRect.top;

		setSelectionActive(true);
		selectionRect.value = { x: visualStartX, y: visualStartY, width: 0, height: 0 };
	}

	function move(event: MouseEvent): void
	{
		if (!toValue(isSelectionActive) || !cachedRootRect || !cachedLayerRect)
		{
			return;
		}

		const root = toValue(rootRef);
		const layer = toValue(transformLayoutRef);
		const currentZoom = toValue(zoom);

		if (!root || !layer || !currentZoom)
		{
			return;
		}

		const visualStartX = startClientX - cachedRootRect.left;
		const visualStartY = startClientY - cachedRootRect.top;
		const currentVisualX = event.clientX - cachedRootRect.left;
		const currentVisualY = event.clientY - cachedRootRect.top;

		selectionRect.value = {
			x: Math.min(visualStartX, currentVisualX),
			y: Math.min(visualStartY, currentVisualY),
			width: Math.abs(currentVisualX - visualStartX),
			height: Math.abs(currentVisualY - visualStartY),
		};

		const startLayerX = startClientX - cachedLayerRect.left;
		const startLayerY = startClientY - cachedLayerRect.top;
		const currentLayerX = event.clientX - cachedLayerRect.left;
		const currentLayerY = event.clientY - cachedLayerRect.top;

		setSelectionWorldRect({
			x: Math.min(startLayerX, currentLayerX) / currentZoom,
			y: Math.min(startLayerY, currentLayerY) / currentZoom,
			width: Math.abs(currentLayerX - startLayerX) / currentZoom,
			height: Math.abs(currentLayerY - startLayerY) / currentZoom,
		});
	}

	function end(): void
	{
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
