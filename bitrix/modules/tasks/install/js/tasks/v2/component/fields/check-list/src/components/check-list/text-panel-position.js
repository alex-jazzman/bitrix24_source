export const TextPanelPlacement = Object.freeze({
	Above: 'above',
	Below: 'below',
});

// The offset the checklist already keeps between its panels and the edge of the list.
const DefaultPaddingOffset = 18;

// The gap the editor's floating toolbar keeps between itself and the caret line.
const DefaultVerticalGap = 10;

export type TextPanelPlacementValue = 'above' | 'below';

export type TextPanelAnchor = {
	x: number,
	top: number,
	bottom: number,
};

export type TextPanelBox = {
	width: number,
	height: number,
};

export type TextPanelPositionInput = {
	anchor: TextPanelAnchor,
	panel: TextPanelBox,
	visibleWindow: TextPanelBox,
	padding?: number,
	gap?: number,
	topBoundary?: number,
};

export type TextPanelPosition = {
	left: number,
	top: number,
	placement: TextPanelPlacementValue,
	visible: boolean,
};

function clamp(value: number, min: number, max: number): number
{
	return Math.min(Math.max(value, min), max);
}

/**
 * Centres the panel on the caret end of the selection and keeps it within the visible window:
 * below the line when the header leaves no room above, unless the panel would leave the window.
 * Coordinates are those of the visible window; measuring them and writing the styles is the caller's.
 */
export function computeTextPanelPosition(input: TextPanelPositionInput): TextPanelPosition
{
	const {
		anchor,
		panel,
		visibleWindow,
		padding = DefaultPaddingOffset,
		gap = DefaultVerticalGap,
		topBoundary = 0,
	} = input;

	// A window narrower than the panel leaves no range to hold it in, and the left edge takes it.
	const maxLeft = Math.max(padding, visibleWindow.width - panel.width - padding);
	const left = clamp(anchor.x - (panel.width / 2), padding, maxLeft);

	const above = anchor.top - panel.height - gap;
	const below = anchor.bottom + gap;
	const fitsBelow = (below + panel.height) <= visibleWindow.height;
	const placement = (above >= topBoundary || !fitsBelow) ? TextPanelPlacement.Above : TextPanelPlacement.Below;
	const top = placement === TextPanelPlacement.Above ? above : below;

	const visible = (
		anchor.bottom > topBoundary
		&& anchor.top < visibleWindow.height
		&& top >= 0
	);

	return { left, top, placement, visible };
}
