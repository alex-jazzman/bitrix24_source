import { Dom } from 'main.core';
import { type Menu, type MenuItem } from 'main.popup';
import { SidePanel } from 'main.sidepanel';
import { Api, type AvailableProcess, type AvailableProcessListResponse } from 'sign.v2.api';

import { openRunProcess } from './run-process';
import { buildSubmenuItems, SUBMENU_PROCESS_LIMIT } from './submenu';
import { type RunProcessMenuOptions } from './type';

import './style.css';

const MENU_SCOPE_CLASS = 'sign-b2e-run-process-menu';
const CATALOG_SLIDER_WIDTH = 1650;

/**
 * Submenu of the "run a process" item of the create button. Whether the item exists at all is decided by
 * the toolbar at the render of the page; this class only answers what the submenu is made of and asks the
 * catalog for it once - on the first expand.
 */
export class RunProcessMenu
{
	static #menus: WeakMap<MenuItem, RunProcessMenu> = new WeakMap();

	/**
	 * Entry point of the toolbar, called on every expand of the submenu.
	 */
	static fill(item: MenuItem, options: RunProcessMenuOptions): void
	{
		let menu = this.#menus.get(item);
		if (menu === undefined)
		{
			menu = new RunProcessMenu(item, options);
			this.#menus.set(item, menu);
		}

		menu.#load();
	}

	#item: MenuItem;
	#options: RunProcessMenuOptions;
	#api: Api = new Api();
	#isLoaded: boolean = false;
	#isLoading: boolean = false;

	constructor(item: MenuItem, options: RunProcessMenuOptions)
	{
		this.#item = item;
		this.#options = options;
	}

	async #load(): Promise<void>
	{
		if (this.#isLoaded || this.#isLoading)
		{
			return;
		}

		this.#isLoading = true;
		try
		{
			this.#render(await this.#api.process.getAvailableList(SUBMENU_PROCESS_LIMIT));
			this.#isLoaded = true;
		}
		catch
		{
			// the transport has already told about the failure, and the next expand asks again
		}
		finally
		{
			this.#isLoading = false;
		}
	}

	#render(response: AvailableProcessListResponse): void
	{
		const subMenu: Menu | null = this.#item.getSubMenu();
		if (subMenu === null)
		{
			return;
		}

		Dom.addClass(subMenu.getMenuContainer(), MENU_SCOPE_CLASS);

		const placeholderIds = subMenu.getMenuItems().map((item: MenuItem) => item.getId());
		buildSubmenuItems(
			response,
			this.#options,
			(process: AvailableProcess) => this.#runProcess(process),
			() => this.#openCatalog(),
		).forEach((item) => subMenu.addMenuItem(item, null));

		// the placeholder leaves last: a menu left without items destroys its own popup
		placeholderIds.forEach((id: string) => subMenu.removeMenuItem(id));

		this.#item.adjustSubMenu();
	}

	async #runProcess(process: AvailableProcess): Promise<void>
	{
		this.#closeMenu();

		await openRunProcess(process);
	}

	#openCatalog(): void
	{
		this.#closeMenu();

		SidePanel.Instance.open(this.#options.allProcessesUrl, {
			width: CATALOG_SLIDER_WIDTH,
			cacheable: false,
		});
	}

	#closeMenu(): void
	{
		this.#item.getMenuWindow()?.close();
	}
}
