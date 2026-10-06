import { Dom, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { FOCUSABLE_CLASS, makeActivatable } from './keyboard';
import { visuallyHidden } from './visually-hidden';

const GRID_UPDATED_EVENT = 'Grid::updated';
const ROW_ACTIONS_SELECTOR = '.main-grid-row-action-button';
const CHECKBOX_SELECTOR = 'input.main-grid-row-checkbox, input.main-grid-check-all';
const DEFAULT_ACTIVE_CLASS = 'main-grid-cell-content-action-active';

export type GridToggleOptions = {
	selector: string,
	label: string,
	activeClass?: string,
};

export type EnhanceGridOptions = {
	gridId?: string,
	rowActionsLabel?: string,
	checkboxesFromTitle?: boolean,
	columnLabels?: { [dataName: string]: string },
	toggles?: GridToggleOptions[],
};

export type GridSubscription = {
	destroy: () => void,
};

type GridUpdatedEvent = {
	getCompatData?: () => Array<{ getId?: () => string }>,
};

function getActiveClass(toggle: GridToggleOptions): string
{
	// consumers pass BX.Grid.CellActionState.ACTIVE explicitly; the default keeps its current value
	return Type.isStringFilled(toggle.activeClass) ? (toggle.activeClass as string) : DEFAULT_ACTIVE_CLASS;
}

function labelColumnHeaders(container: HTMLElement, columnLabels: { [dataName: string]: string }): void
{
	Object.entries(columnLabels).forEach(([dataName, label]) => {
		if (!Type.isStringFilled(label))
		{
			return;
		}

		const header = container.querySelector<HTMLElement>(`.main-grid-cell-head[data-name="${dataName}"]`);
		if (!header || header.querySelector('visually-hidden'))
		{
			return;
		}

		// axe empty-table-header requires text content, aria-label is not enough
		Dom.append(visuallyHidden(label), header);
	});
}

function hideServiceFrame(gridId: string): void
{
	const serviceFrame = document.getElementById(`main-grid-tmp-frame-${gridId}`);
	if (serviceFrame)
	{
		// technical grid frame must not be reachable by keyboard or screen reader
		Dom.attr(serviceFrame, { 'aria-hidden': 'true', tabindex: '-1' });
	}
}

function enhanceToggles(container: HTMLElement, toggles: GridToggleOptions[]): void
{
	toggles.forEach((toggle) => {
		if (!Type.isStringFilled(toggle?.selector) || !Type.isStringFilled(toggle?.label))
		{
			return;
		}

		const activeClass = getActiveClass(toggle);

		container.querySelectorAll<HTMLElement>(toggle.selector).forEach((button) => {
			if (!Dom.hasClass(button, FOCUSABLE_CLASS))
			{
				// the grid binds its own click handler; empty handler adds only keyboard activation
				makeActivatable(button, () => {});
				Dom.attr(button, 'aria-label', toggle.label);
			}

			Dom.attr(button, 'aria-pressed', Dom.hasClass(button, activeClass) ? 'true' : 'false');
		});
	});
}

export function enhanceGrid(container: HTMLElement, options: EnhanceGridOptions = {}): void
{
	if (!Type.isDomNode(container))
	{
		return;
	}

	if (Type.isStringFilled(options.rowActionsLabel))
	{
		container.querySelectorAll<HTMLElement>(ROW_ACTIONS_SELECTOR).forEach((button) => {
			Dom.attr(button, {
				'aria-label': options.rowActionsLabel,
				'aria-haspopup': 'menu',
			});
		});
	}

	if (options.checkboxesFromTitle === true)
	{
		container.querySelectorAll<HTMLElement>(CHECKBOX_SELECTOR).forEach((checkbox) => {
			if (!checkbox.getAttribute('aria-label') && Type.isStringFilled(checkbox.title))
			{
				Dom.attr(checkbox, 'aria-label', checkbox.title);
			}
		});
	}

	if (Type.isPlainObject(options.columnLabels))
	{
		labelColumnHeaders(container, options.columnLabels as { [dataName: string]: string });
	}

	if (Type.isArrayFilled(options.toggles))
	{
		enhanceToggles(container, options.toggles as GridToggleOptions[]);
	}

	if (Type.isStringFilled(options.gridId))
	{
		hideServiceFrame(options.gridId as string);
	}
}

export function subscribeGridUpdated(gridId: string, handler: () => void): GridSubscription
{
	if (!Type.isStringFilled(gridId) || !Type.isFunction(handler))
	{
		return { destroy: () => {} };
	}

	// Grid::updated is global: without the grid check an update of any other grid
	// on the page would trigger this handler too
	const eventHandler = (event: GridUpdatedEvent): void => {
		if (event?.getCompatData?.()?.[0]?.getId?.() !== gridId)
		{
			return;
		}

		handler();
	};

	EventEmitter.subscribe(GRID_UPDATED_EVENT, eventHandler);

	return {
		destroy(): void
		{
			EventEmitter.unsubscribe(GRID_UPDATED_EVENT, eventHandler);
		},
	};
}
