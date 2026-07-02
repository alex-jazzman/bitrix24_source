import { Event, Type } from 'main.core';
import { InteractivityChecker, FocusMonitor } from 'ui.a11y';

import { type Menu } from './menu.js';
import { type MenuItem } from './menu-item.js';

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

export type MenuNavigationOptions = {
	onTab?: (event: KeyboardEvent) => void,
	initialFocusPosition: 'first' | 'last',
};

export class MenuNavigation
{
	#menu: Menu | null = null;
	#enabled: boolean = false;
	#onKeyDownHandler: Function | null = null;
	#searchBuffer: string = '';
	#resetTimer: number | null = null;
	#onTab: Function | null = null;
	#initialFocusPosition: 'first' | 'last' = 'first';

	constructor(menu: Menu, options: MenuNavigationOptions = {})
	{
		this.#menu = menu;
		this.#menu.subscribe('onShow', this.#handleMenuShow.bind(this));
		this.#menu.subscribe('onDestroy', this.#handleMenuDestroy.bind(this));
		this.#onKeyDownHandler = this.#handleKeyDown.bind(this);
		this.#onTab = Type.isFunction(options.onTab) ? options.onTab : null;
		this.setInitialFocusPosition(options.initialFocusPosition);
	}

	getMenu(): Menu
	{
		return this.#menu;
	}

	enable(): void
	{
		if (!this.isEnabled())
		{
			this.bindEvents();
		}

		this.#enabled = true;
	}

	disable(): void
	{
		if (this.isEnabled())
		{
			this.unbindEvents();
		}

		this.#enabled = false;
	}

	isEnabled(): boolean
	{
		return this.#enabled;
	}

	bindEvents(): void
	{
		Event.bind(this.getMenu().getMenuContainer(), 'keydown', this.#onKeyDownHandler);
	}

	unbindEvents(): void
	{
		Event.unbind(this.getMenu().getMenuContainer(), 'keydown', this.#onKeyDownHandler);
	}

	setInitialFocusPosition(focusPosition: 'first' | 'last'): void
	{
		if (focusPosition === 'first' || focusPosition === 'last')
		{
			this.#initialFocusPosition = focusPosition;
		}
	}

	#handleMenuShow(): void
	{
		this.enable();

		if (this.#menu.getParentMenuWindow() === null)
		{
			if (FocusMonitor.Instance.getLastInputModality() === 'keyboard' && this.#menu.getFocusTrap() !== null)
			{
				if (this.#initialFocusPosition === 'last')
				{
					this.focusLast();
				}
				else
				{
					this.focusFirst();
				}
			}
		}
		else if (this.#menu.getLastInputModal() === 'keyboard')
		{
			this.focusFirst();
		}
	}

	#handleMenuDestroy(): void
	{
		this.disable();
		this.#menu = null;
	}

	#handleKeyDown(event: KeyboardEvent): void
	{
		if (!this.getMenu().isShown())
		{
			return;
		}

		if (event.metaKey || event.ctrlKey || event.altKey)
		{
			return;
		}

		const target: HTMLElement = event.target;
		if (target?.tagName === 'TEXTAREA' || target instanceof HTMLInputElement)
		{
			return;
		}

		event.preventDefault();

		switch (event.key)
		{
			case 'ArrowDown':
			{
				this.focusNext();
				break;
			}

			case 'ArrowUp':
			{
				this.focusPrevious();
				break;
			}

			case 'ArrowLeft':
			{
				const focusedItem = this.getMenu().getFocusedItem();
				const parentItem = focusedItem?.getMenuWindow()?.getParentMenuItem();
				if (parentItem)
				{
					parentItem.focus(true);
					parentItem.closeSubMenu('keyboard');
				}

				break;
			}

			case 'ArrowRight':
			{
				this.#openSubMenuByKeyboard(this.getMenu().getFocusedItem());

				break;
			}

			case 'Home':
			case 'PageUp':
			{
				this.focusFirst();
				break;
			}

			case 'End':
			case 'PageDown':
			{
				this.focusLast();
				break;
			}

			case ' ':
			case 'Enter':
			case 'Space':
			{
				const focusedItem = this.getMenu().getFocusedItem();
				if (focusedItem)
				{
					if (focusedItem.hasSubMenu())
					{
						this.#openSubMenuByKeyboard(focusedItem);
					}
					else
					{
						focusedItem.getContainer().click();
					}
				}

				break;
			}

			case 'Tab':
			{
				if (this.#onTab === null)
				{
					const rootMenuWindow = this.getMenu().getRootMenuWindow() || this.getMenu();
					rootMenuWindow.close();
				}
				else
				{
					this.#onTab(event, this.#menu);
				}

				break;
			}

			default:
			{
				if (this.#isTypeaheadEvent(event))
				{
					this.#searchBuffer += event.key;
					this.focusByText(this.#searchBuffer);
					clearTimeout(this.#resetTimer);
					this.#resetTimer = setTimeout(() => {
						this.#searchBuffer = '';
					}, 200);
				}

				break;
			}
		}
	}

	#openSubMenuByKeyboard(item: MenuItem): void
	{
		if (!item || !item.hasSubMenu())
		{
			return;
		}

		if (item.getSubMenu()?.isShown())
		{
			item.getSubMenu().getNavigation().focusFirst();
		}
		else
		{
			item.showSubMenu('keyboard');
		}

		item.blur();
	}

	#isTypeaheadEvent(event: KeyboardEvent): boolean
	{
		if (event.key === ' ' && this.#searchBuffer.length > 0)
		{
			return true;
		}

		return event.key.length === 1 && /^[\p{Letter}\p{Number}]$/u.test(event.key);
	}

	focusByText(text: string): void
	{
		const items = this.getItems();
		const focusedItem = this.getMenu().getFocusedItem();
		const normalizedText = text.toLowerCase();

		const matches: MenuItem[] = items.filter((item: MenuItem) => {
			const word = item.getTextContent().trim().toLowerCase().slice(0, Math.max(0, normalizedText.length));

			return collator.compare(normalizedText, word) === 0;
		});

		if (matches.length === 0)
		{
			return null;
		}

		const focusedMatchIndex = matches.indexOf(focusedItem);

		if (focusedMatchIndex >= 0)
		{
			const item = matches[(focusedMatchIndex + 1) % matches.length];
			item.focus(true);

			return item;
		}

		const focusedIndex = items.indexOf(focusedItem);
		const nextMatch: MenuItem = matches.find((item: MenuItem) => items.indexOf(item) > focusedIndex) ?? matches[0];

		nextMatch.focus(true);

		return nextMatch;
	}

	focusNext(looped: boolean = true): MenuItem | null
	{
		const focusedItem = this.getMenu().getFocusedItem();
		const items = this.getItems();
		if (items.length === 0)
		{
			return null;
		}

		if (!focusedItem)
		{
			items[0].focus(true);

			return items[0];
		}

		const position = this.getMenuItemPosition(focusedItem.id);
		if (position === -1)
		{
			items[0].focus(true);

			return items[0];
		}

		if (position + 1 < items.length)
		{
			const nextPosition = position + 1;
			items[nextPosition].focus(true);

			return items[nextPosition];
		}

		if (looped)
		{
			items[0].focus(true);

			return items[0];
		}

		return null;
	}

	focusPrevious(looped: boolean = true): MenuItem | null
	{
		const focusedItem = this.getMenu().getFocusedItem();
		const items = this.getItems();
		if (items.length === 0)
		{
			return null;
		}

		if (!focusedItem)
		{
			items[items.length - 1].focus(true);

			return items[items.length - 1];
		}

		const position = this.getMenuItemPosition(focusedItem.id);
		if (position === -1)
		{
			items[items.length - 1].focus(true);

			return items[items.length - 1];
		}

		if (position - 1 >= 0)
		{
			const previousPosition = position - 1;
			items[previousPosition].focus(true);

			return items[previousPosition];
		}

		if (looped)
		{
			const lastPosition = items.length - 1;
			items[lastPosition].focus(true);

			return items[lastPosition];
		}

		return null;
	}

	focusFirst(): MenuItem | null
	{
		const items = this.getItems();
		if (items.length > 0)
		{
			items[0].focus(true);

			return items[0];
		}

		return null;
	}

	focusLast(): MenuItem | null
	{
		const items = this.getItems();
		if (items.length > 0)
		{
			items[items.length - 1].focus(true);

			return items[items.length - 1];
		}

		return null;
	}

	getItems(): MenuItem[]
	{
		return this.getMenu().getMenuItems().filter((item) => {
			return item.isFocusable() && InteractivityChecker.isVisible(item.getContainer());
		});
	}

	getMenuItemPosition(itemId: string): number
	{
		const items = this.getItems();
		for (const [i, item] of items.entries())
		{
			if (item.id && item.id === itemId)
			{
				return i;
			}
		}

		return -1;
	}
}
