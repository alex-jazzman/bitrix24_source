import { type Panels } from './panels';
import { type LayoutMeasurements, type LayoutTarget } from './types';

/**
 * Pick the smallest disruption that fits within the available width.
 *
 * Priority: collapse right-buttons one-by-one, then left-buttons one-by-one,
 * then nav, then counter. Returns the fully-expanded layout if any
 * measurement is missing.
 */
export function pickTarget(measurements: LayoutMeasurements, container: HTMLElement, panels: Panels): LayoutTarget
{
	const { counter, nav, buttons, leftButtons } = measurements;
	if (counter === null || nav === null || buttons === null || leftButtons === null)
	{
		return { buttons: 0, leftButtons: 0, nav: 'expanded', counter: 'expanded' };
	}

	const budget = computeBudget(container);
	const overhead = computeOverhead(container, panels);

	const rightAllCollapsed = buttons.length - 1;
	const leftAllCollapsed = leftButtons.length - 1;

	// 1. Try collapsing right-buttons only (k = 0..rightAllCollapsed).
	const fittingRight = buttons.findIndex(
		(width) => overhead + width + leftButtons[0] + nav.expanded + counter.expanded <= budget,
	);
	if (fittingRight !== -1)
	{
		return { buttons: fittingRight, leftButtons: 0, nav: 'expanded', counter: 'expanded' };
	}

	// 2. All right-buttons collapsed — try collapsing left-buttons (kLeft = 1..leftAllCollapsed).
	for (let kLeft = 1; kLeft <= leftAllCollapsed; kLeft++)
	{
		if (overhead + buttons[rightAllCollapsed] + leftButtons[kLeft] + nav.expanded + counter.expanded <= budget)
		{
			return { buttons: rightAllCollapsed, leftButtons: kLeft, nav: 'expanded', counter: 'expanded' };
		}
	}

	// 3. Everything collapsed but still doesn't fit — try collapsing nav.
	const allButtonsWidth = buttons[rightAllCollapsed] + leftButtons[leftAllCollapsed];
	if (overhead + allButtonsWidth + nav.collapsed + counter.expanded <= budget)
	{
		return { buttons: rightAllCollapsed, leftButtons: leftAllCollapsed, nav: 'collapsed', counter: 'expanded' };
	}

	return { buttons: rightAllCollapsed, leftButtons: leftAllCollapsed, nav: 'collapsed', counter: 'collapsed' };
}

/**
 * Width available for the actions bar — parent's content width minus its
 * other children.
 */
function computeBudget(container: HTMLElement): number
{
	const parent = container.parentElement;
	if (!parent)
	{
		return Number.POSITIVE_INFINITY;
	}

	let siblingsWidth = 0;
	for (const child of parent.children)
	{
		if (child !== container)
		{
			siblingsWidth += (child as HTMLElement).offsetWidth;
		}
	}

	return parent.clientWidth - computePaddingAndGaps(parent) - siblingsWidth;
}

/**
 * Static width inside the container excluding managed panels. For each
 * managed slot we count only padding and gap (its actual width depends on
 * the panel state, already tracked in the measurements). Other slots
 * contribute their natural content width.
 */
function computeOverhead(container: HTMLElement, panels: Panels): number
{
	let overhead = computePaddingAndGaps(container);

	for (const slot of container.children)
	{
		overhead += computePaddingAndGaps(slot);

		if (!panels.isManagedSlot(slot))
		{
			for (const child of slot.children)
			{
				overhead += (child as HTMLElement).offsetWidth;
			}
		}
	}

	return overhead;
}

function computePaddingAndGaps(el: Element): number
{
	const cs = getComputedStyle(el);
	const padL = parseFloat(cs.paddingLeft) || 0;
	const padR = parseFloat(cs.paddingRight) || 0;
	const gap = parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0;
	const gapsCount = Math.max(0, el.children.length - 1);

	return padL + padR + gap * gapsCount;
}
