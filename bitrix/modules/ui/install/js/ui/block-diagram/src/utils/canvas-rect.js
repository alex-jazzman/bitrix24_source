export type CanvasRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

const TRANSFORM_LAYOUT_SELECTOR = '.ui-block-diagram-canvas-transform__transform';

export function getCanvasRect(element: ?HTMLElement): CanvasRect | null
{
	const layout = element?.closest(TRANSFORM_LAYOUT_SELECTOR);

	if (!layout)
	{
		return null;
	}

	const layoutRect = layout.getBoundingClientRect();
	const elementRect = element.getBoundingClientRect();
	const { transform } = getComputedStyle(layout);
	const scale = transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a;

	return {
		x: (elementRect.x - layoutRect.x) / scale,
		y: (elementRect.y - layoutRect.y) / scale,
		width: elementRect.width / scale,
		height: elementRect.height / scale,
	};
}
