import { Dom, Event, Type } from 'main.core';

/**
 * Roles the rows of the grid mark their actions with. The rows of the page arrive in parts - the grid
 * replaces them on every reload and adds the composition of a launch group to them when the row is opened -
 * so an action is found by its role at the moment of the click and never by a node kept from a render.
 */
export const RowActionRole = Object.freeze({
	Retry: 'sign-b2e-process-retry',
	Protocol: 'sign-b2e-process-protocol',
	Catalog: 'sign-b2e-process-catalog',
});

/**
 * Waiting class of a button of `ui.buttons`, named here instead of pulling the buttons into the actions of
 * the rows. The class paints the wait; `aria-busy` next to it says the wait.
 */
export const BUTTON_WAITING_CLASS = 'ui-btn-wait';

export type RetryTarget = {
	launchId: number,
	itemId: number | null,
};

/**
 * What a row of the grid says about itself where an action needs it. The names are the ones the component
 * of the page writes: `data-launch-id` and `data-item-id`.
 */
export type RetryDataset = {
	launchId?: string,
	itemId?: string,
};

export type RowActionHandlers = {
	retry: (target: RetryTarget) => Promise<void>,
	openProtocol: (url: string) => void,
	openCatalog: (url: string) => void,
};

/**
 * The launch the retry is asked for. Without `itemId` the whole group goes back into the queue, with it -
 * the named row alone (API-05). A row that names itself badly is refused instead of falling back to the
 * group: the fallback would retry launches of employees nobody asked about.
 */
export function parseRetryTarget(dataset: RetryDataset): RetryTarget | null
{
	const launchId = readPositiveInt(dataset.launchId);
	if (launchId === null)
	{
		return null;
	}

	const rawItemId = dataset.itemId;
	if (rawItemId === undefined || rawItemId === '')
	{
		return { launchId, itemId: null };
	}

	const itemId = readPositiveInt(rawItemId);

	return itemId === null ? null : { launchId, itemId };
}

function readPositiveInt(value: string | undefined): number | null
{
	if (value === undefined)
	{
		return null;
	}

	const parsed = Number(value);

	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Actions the rows of the list of the processes offer. Bound to the document once and delegated: the row of
 * a process may come with the first render of the page, with a reload of the grid or with the opening of
 * its group, and all three are the same row to the person clicking it.
 */
export class RowActions
{
	#handlers: RowActionHandlers;

	/**
	 * Roles that lead somewhere of their own, each with what opens it. A node of either keeps its address in
	 * `href`, so a page that failed to load this extension still leads the officer there.
	 */
	#slidersByRole: [string, (url: string) => void][];

	constructor(handlers: RowActionHandlers)
	{
		this.#handlers = handlers;
		this.#slidersByRole = [
			[RowActionRole.Protocol, handlers.openProtocol],
			[RowActionRole.Catalog, handlers.openCatalog],
		];
	}

	bind(): void
	{
		Event.bind(document, 'click', this.#handleClick);
	}

	unbind(): void
	{
		Event.unbind(document, 'click', this.#handleClick);
	}

	#handleClick = (event: MouseEvent): void => {
		const source = event.target;
		if (!Type.isDomNode(source))
		{
			return;
		}

		const node = source as HTMLElement;

		const retryButton = node.closest(`[data-role="${RowActionRole.Retry}"]`);
		if (retryButton !== null)
		{
			event.preventDefault();
			this.#retry(retryButton as HTMLElement);

			return;
		}

		for (const [role, open] of this.#slidersByRole)
		{
			const link = node.closest(`[data-role="${role}"]`);
			if (link !== null)
			{
				event.preventDefault();
				open(link.getAttribute('href') ?? '');

				return;
			}
		}
	};

	/**
	 * One press is one retry: the button waits until the answer comes, so a second press does not queue the
	 * employees of the launch a second time.
	 */
	#retry(button: HTMLElement): void
	{
		if (Dom.hasClass(button, BUTTON_WAITING_CLASS))
		{
			return;
		}

		const target = parseRetryTarget(button.dataset);
		if (target === null)
		{
			return;
		}

		Dom.addClass(button, BUTTON_WAITING_CLASS);
		Dom.attr(button, { 'aria-busy': 'true', 'aria-disabled': 'true' });

		void this.#handlers.retry(target).finally(() => {
			Dom.removeClass(button, BUTTON_WAITING_CLASS);
			Dom.attr(button, { 'aria-busy': null, 'aria-disabled': null });
		});
	}
}
