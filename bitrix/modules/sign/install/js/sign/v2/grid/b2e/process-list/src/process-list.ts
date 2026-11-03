import { Loc } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { FocusNavigator, LiveAnnouncer } from 'ui.a11y';
import { Api } from 'sign.v2.api';

import { RowActions, type RetryTarget } from './row-action';

/**
 * Width of the slider of the protocol of a process, as bizproc opens the same page from its own surfaces.
 */
const PROTOCOL_SLIDER_WIDTH = 1200;

/**
 * Width of the slider of the catalog of the processes, as the submenu of the create button opens it.
 */
const CATALOG_SLIDER_WIDTH = 1650;

/**
 * The grid of the page as `main.ui.grid` hands it over. Named here are the two things the tab asks of it -
 * the reload of the rows and the container the focus goes to while they are being replaced.
 */
type GridInstance = {
	reload: () => void,
	getContainer?: () => HTMLElement | null,
};

/**
 * Client half of the tab "Processes". The rows, the groups and everything written in them are built by the
 * component of the page; this class answers only for what a row lets the officer do - the retry of a launch
 * that did not take place (AC-015c) and the protocol of a process (ERR-006).
 */
export class ProcessList
{
	static #instance: ProcessList | null = null;

	#gridId: string;
	#actions: RowActions;

	/**
	 * Entry point of the page. The grid replaces its rows over ajax and loads the composition of a group
	 * into them, so the actions are delegated and bound once - a repeated call after a reload changes
	 * nothing.
	 */
	static bind(gridId: string): void
	{
		if (ProcessList.#instance !== null)
		{
			return;
		}

		ProcessList.#instance = new ProcessList(gridId);
		ProcessList.#instance.#subscribe();
	}

	constructor(gridId: string)
	{
		this.#gridId = gridId;
		this.#actions = new RowActions({
			retry: (target: RetryTarget) => this.#retry(target),
			openProtocol: (url: string) => ProcessList.#openSlider(url, PROTOCOL_SLIDER_WIDTH),
			// the empty tab offers the catalog of the section, and it is the very slider the submenu of the
			// create button opens - the officer starts a process in one place and not in two
			openCatalog: (url: string) => ProcessList.#openSlider(url, CATALOG_SLIDER_WIDTH),
		});
	}

	#subscribe(): void
	{
		this.#actions.bind();
	}

	/**
	 * A retry that took place changes the row it was asked about and, with it, the state of its group: a
	 * launch nothing failed in stops being a failed one. Nothing here is worked out on the client - the list
	 * is asked again and says what it says.
	 */
	async #retry(target: RetryTarget): Promise<void>
	{
		try
		{
			await new Api().process.retry(target.launchId, target.itemId);
		}
		catch
		{
			// the transport of the module reports the refusal itself, so a refused retry leaves the list
			// exactly as the officer saw it and says nothing twice
			return;
		}

		const grid = this.#getGrid();

		// the reload takes the pressed button away with the rows, so the focus leaves for the grid first and
		// the result is told after it - otherwise the press is answered by nothing at all
		ProcessList.#leadFocusToGrid(grid);
		LiveAnnouncer.announce(Loc.getMessage('SIGN_B2E_PROCESS_LIST_RETRY_ANNOUNCE') ?? '');

		grid?.reload();
	}

	#getGrid(): GridInstance | null
	{
		const manager = BX.Main?.gridManager;

		return manager?.getInstanceById(this.#gridId) ?? manager?.getById(this.#gridId)?.instance ?? null;
	}

	static #leadFocusToGrid(grid: GridInstance | null): void
	{
		const container = grid?.getContainer?.() ?? null;
		if (container !== null)
		{
			FocusNavigator.focusContainer(container);
		}
	}

	static #openSlider(url: string, width: number): void
	{
		if (url === '')
		{
			return;
		}

		SidePanel.Instance.open(url, {
			width,
			cacheable: false,
		});
	}
}
