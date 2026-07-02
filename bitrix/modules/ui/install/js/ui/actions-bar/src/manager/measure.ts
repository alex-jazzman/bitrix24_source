import { Dom } from 'main.core';

import { type LeftButtons } from './left-buttons';
import { type Panels } from './panels';
import {
	type ButtonsWidths,
	type Collapsible,
	type CollapsibleButtons,
	type CollapsibleWidths,
	type LayoutMeasurements,
} from './types';

/**
 * Returns measurements with missing entries filled in. Already-measured
 * slots are preserved.
 *
 * The browser doesn't paint between operations within the same task, so
 * toggling panels for measurement is invisible to users.
 */
export function calibrate(container: HTMLElement, panels: Panels, previous: LayoutMeasurements): LayoutMeasurements
{
	let counter = previous.counter;
	let nav = previous.nav;
	let buttons = previous.buttons;
	let leftButtons = previous.leftButtons;

	forceIntrinsicWidth(container, () => {
		if (panels.counter && counter === null)
		{
			counter = measureCollapsible(panels.counter, () => panels.getCounterNode()?.offsetWidth ?? 0);
		}

		if (panels.nav && nav === null)
		{
			nav = measureCollapsible(panels.nav, () => panels.getNavNode()?.offsetWidth ?? 0);
		}

		if (panels.buttons && buttons === null)
		{
			buttons = measureButtons(panels.buttons, () => measureButtonsContentWidth(panels.getButtonsNode()));
		}

		if (leftButtons === null)
		{
			// [0] = empty pool: a single state with zero content width.
			// Keeps pickTarget happy when actions-bar has no left buttons.
			leftButtons = panels.leftButtons ? measureLeftButtons(panels.leftButtons) : [0];
		}
	});

	return { counter, nav, buttons, leftButtons };
}

/**
 * Force the container to its intrinsic width during measurement.
 *
 * Without this, flex:1 slots (buttons, --wide panels) get squeezed by the
 * surrounding layout when the screen is narrow at calibration time, and
 * offsetWidth reports the squeezed size instead of the natural one.
 */
function forceIntrinsicWidth(container: HTMLElement, fn: () => void): void
{
	const previousStyle = container.getAttribute('style');

	Dom.style(container, {
		width: 'max-content',
		flex: '0 0 auto',
		minWidth: 'auto',
		maxWidth: 'none',
	});

	try
	{
		fn();
	}
	finally
	{
		if (previousStyle === null)
		{
			container.removeAttribute('style');
		}
		else
		{
			container.setAttribute('style', previousStyle);
		}
	}
}

function measureCollapsible(panel: Collapsible, measureWidth: () => number): CollapsibleWidths
{
	panel.expand();
	const expanded = measureWidth();
	panel.collapse();
	const collapsed = measureWidth();
	panel.expand();

	return { expanded, collapsed };
}

function measureButtons(rb: CollapsibleButtons, measureContentWidth: () => number): ButtonsWidths
{
	const widths: number[] = [];
	const total = rb.getButtonCount();

	for (let collapsedCount = 0; collapsedCount <= total; collapsedCount++)
	{
		rb.setCollapsedCount(collapsedCount);
		widths.push(measureContentWidth());
	}

	rb.setCollapsedCount(0);

	return widths;
}

function measureLeftButtons(lb: LeftButtons): ButtonsWidths
{
	return measureButtons(lb, () => lb.getContentWidth());
}

/**
 * The buttons slot is flex:1, so its offsetWidth is the allocated size, not
 * the natural one. Sum the children's offsetWidths to get the actual needed
 * width.
 */
function measureButtonsContentWidth(slot: HTMLElement | null): number
{
	if (!slot)
	{
		return 0;
	}

	let width = 0;
	for (const child of slot.children)
	{
		width += (child as HTMLElement).offsetWidth;
	}

	return width;
}
