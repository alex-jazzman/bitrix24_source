import { Reflection, Runtime } from 'main.core';

import MenuController from './menu-controller';
import type { SystemMenuOptions } from '../button/button-options';

// ui.system.menu depends on ui.buttons, so its class can be obtained only at runtime.
const EXTENSION_NAME = 'ui.system.menu';
const CLASS_NAME = 'BX.UI.System.Menu';
const LOADING_TIMEOUT = 30000;

/**
 * @namespace {BX.UI}
 */
export default class SystemMenuController extends MenuController
{
	#menu: ?Object = null;
	#loading: boolean = false;
	#destroyed: boolean = false;

	async show(): Promise<void>
	{
		if (this.isShown() || this.#loading)
		{
			return;
		}

		if (this.#menu)
		{
			this.#openMenu();

			return;
		}

		// Runtime resolves even an already loaded extension asynchronously,
		// so the class is taken directly to open the menu in the same task
		let MenuClass = Reflection.getClass(CLASS_NAME);
		if (!MenuClass)
		{
			MenuClass = await this.#loadMenuClass();

			if (this.#destroyed)
			{
				return;
			}
		}

		this.#menu = this.#createMenu(MenuClass);
		this.#openMenu();
	}

	close(): void
	{
		if (this.#menu?.getPopup())
		{
			this.#menu.close();
		}
	}

	isShown(): boolean
	{
		return this.#menu?.getPopup()?.isShown() === true;
	}

	destroy(): void
	{
		this.#destroyed = true;

		if (this.#menu?.getPopup())
		{
			this.#menu.destroy();
		}

		this.#menu = null;
	}

	getMenu(): Object | null
	{
		return this.#menu;
	}

	#openMenu(): void
	{
		// the menu is always bound to the button, so the bindElement option is ignored
		this.#menu.show(this.getBindElement());

		if (this.isShown())
		{
			this.notifyShow();
		}
	}

	// Runtime.loadExtension is not guaranteed to settle, so the timeout keeps the button clickable and reports a reason.
	// It is not a recovery: main.core retries the loading itself and keeps the extension promise forever,
	// so a load that has failed for the page stays failed until a reload.
	async #loadMenuClass(): Promise<Function>
	{
		let timer = null;
		const timeout = new Promise((resolve, reject) => {
			timer = setTimeout(() => {
				reject(new Error('loading timed out'));
			}, LOADING_TIMEOUT);
		});

		this.#loading = true;

		try
		{
			const exports = await Promise.race([Runtime.loadExtension(EXTENSION_NAME), timeout]);
			if (!exports?.Menu)
			{
				throw new Error('the extension does not export Menu');
			}

			return exports.Menu;
		}
		catch (error)
		{
			// the show() caller reports the reason, so a loading failure names itself apart from an opening one
			throw new Error(`cannot load ${EXTENSION_NAME}: ${error.message}`, { cause: error });
		}
		finally
		{
			this.#loading = false;
			clearTimeout(timer);
		}
	}

	#createMenu(MenuClass: Function): Object
	{
		const options: SystemMenuOptions = this.getOptions();
		const events = options.events ?? {};

		return new MenuClass({
			...options,
			events: {
				...events,
				// the own state is synchronized before a consumer handler: it may throw or replace the menu
				onClose: (): void => {
					this.notifyClose();
					events.onClose?.();
				},
				onDestroy: (): void => {
					// a popup destroyed from the outside (cacheable: false) is recreated on the next show
					this.#menu = null;
					this.notifyClose();
					events.onDestroy?.();
				},
			},
		});
	}
}
