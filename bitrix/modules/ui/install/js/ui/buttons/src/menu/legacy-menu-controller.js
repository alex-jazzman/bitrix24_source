import { Text } from 'main.core';
import { Menu, type MenuOptions } from 'main.popup';

import MenuController, { type MenuControllerCallbacks } from './menu-controller';

/**
 * @namespace {BX.UI}
 */
export default class LegacyMenuController extends MenuController
{
	#menu: Menu;

	#handleClose = (): void => {
		this.notifyClose();
	};

	constructor(options: MenuOptions, callbacks: MenuControllerCallbacks)
	{
		super(options, callbacks);

		this.#menu = new Menu({
			id: `ui-btn-menu-${Text.getRandom().toLowerCase()}`,
			bindElement: this.getBindElement(),
			...this.getOptions(),
		});

		this.#menu.getPopupWindow().subscribe('onClose', this.#handleClose);
	}

	show(): void
	{
		this.#menu.show();

		if (this.isShown())
		{
			this.notifyShow();
		}
	}

	close(): void
	{
		this.#menu.close();
	}

	isShown(): boolean
	{
		return this.#menu.getPopupWindow().isShown();
	}

	destroy(): void
	{
		this.close();

		this.#menu.getPopupWindow().unsubscribe('onClose', this.#handleClose);
		this.#menu.destroy();
	}

	getMenu(): Menu
	{
		return this.#menu;
	}
}
