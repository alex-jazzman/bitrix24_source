import { Type } from 'main.core';
import { Menu, MenuItem, type MenuItemOptions, Popup } from 'main.popup';
import { EventEmitter } from 'main.core.events';
import Options from '../options';
import DefaultController from './default-controller';

export default class SettingsController extends DefaultController
{
	menuId = 'leftMenuSettingsPopup';
	#menu: ?Menu = null;

	createPopup(): Popup
	{
		const menu = new Menu({
			bindElement: this.container,
			targetContainer: document.querySelector('.js-app__left-menu'),
			items: this.getItems(),
			angle: true,
			offsetTop: 0,
			offsetLeft: 50,
		});

		this.#menu = menu;
		const popup = menu.getPopupWindow();
		popup.subscribe('onDestroy', () => {
			if (this.#menu === menu)
			{
				this.#menu = null;
			}
		});

		return popup;
	}

	getMenuItem(id: string): ?MenuItem
	{
		if (!this.#menu || this.#menu.getPopupWindow() !== this.popup || this.popup.isDestroyed())
		{
			return null;
		}

		return this.#menu.getMenuItem(id);
	}

	getItems(): Array
	{
		const notHandledMenuItems = EventEmitter.emit(this, Options.eventName('onGettingSettingMenuItems'));

		return this.#getMenuItems([...notHandledMenuItems][0]);
	}

	#getMenuItems(items: MenuItemOptions[]): MenuItemOptions[]
	{
		if (Type.isArray(items) === false)
		{
			return [];
		}

		return items.map((item) => {
			return this.#getMenuItem(item);
		});
	}

	#getMenuItem(data: MenuItemOptions): MenuItemOptions
	{
		if (!Type.isPlainObject(data))
		{
			return null;
		}

		const { id, text, html, onclick, className, disabled, items = [], delimiter = false } = data;

		return {
			id,
			html,
			text: html ? undefined : text,
			items: this.#getMenuItems(items),
			delimiter,
			disabled,
			className: `menu-popup-no-icon ${className}`,
			onclick: (event, item: MenuItem) => {
				if (!Type.isArrayFilled(items))
				{
					item.getMenuWindow().close();
				}
				item.getMenuWindow().getParentMenuItem()?.getMenuWindow()?.close();

				if (onclick)
				{
					onclick(event, item);
				}
			},
		};
	}
}
