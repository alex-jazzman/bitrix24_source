import { Dom, Event, Type } from 'main.core';
import { MenuManager } from 'main.popup';

const buttonSelector = '.sign-b2e-configure-activity__dictionary-button';
const waitClass = '--wait';

export type DictionaryItem = {
	value: string,
	name: string,
};

export type DictionaryFieldOptions = {
	fieldName: ?string,
	containerNode: ?HTMLElement,
	menuId: string,
	emptyText?: ?string,
	errorText?: ?string,
	loadItems: () => Promise<?Array<DictionaryItem>>,
};

/**
 * Dictionary values are offered by a menu, the field itself stays a plain bizproc text control:
 * its value is never overwritten on init, so a value coming from an expression survives reopening.
 */
export class DictionaryField
{
	#fieldName: ?string;
	#containerNode: ?HTMLElement;
	#menuId: string;
	#emptyText: string;
	#errorText: string;
	#loadItems: () => Promise<?Array<DictionaryItem>>;
	#items: ?Array<DictionaryItem> = null;
	#inputNode: HTMLInputElement | null = null;
	#buttonNode: HTMLElement | null = null;
	#isBusy: boolean = false;

	constructor(options: DictionaryFieldOptions)
	{
		this.#fieldName = options.fieldName;
		this.#containerNode = options.containerNode;
		this.#menuId = options.menuId;
		this.#emptyText = options.emptyText ?? '';
		this.#errorText = options.errorText ?? '';
		this.#loadItems = options.loadItems;
	}

	init(): void
	{
		if (!Type.isStringFilled(this.#fieldName) || !Type.isDomNode(this.#containerNode))
		{
			return;
		}

		this.#inputNode = this.#containerNode.querySelector(`input[name="${this.#fieldName}"]`);
		this.#buttonNode = this.#containerNode.querySelector(buttonSelector);
		if (!this.#inputNode || !this.#buttonNode)
		{
			return;
		}

		Dom.attr(this.#buttonNode, 'aria-haspopup', 'menu');
		Event.bind(this.#buttonNode, 'click', this.#handleSelectClick);
	}

	#handleSelectClick = async (): Promise<void> => {
		if (this.#isBusy)
		{
			return;
		}

		this.#isBusy = true;
		Dom.addClass(this.#buttonNode, waitClass);
		try
		{
			this.#toggleMenu(await this.#getMenuItems());
		}
		finally
		{
			this.#isBusy = false;
			Dom.removeClass(this.#buttonNode, waitClass);
		}
	};

	async #getMenuItems(): Promise<Array<Object>>
	{
		if (this.#items === null)
		{
			const items = await this.#loadItems();
			if (items === null)
			{
				return this.#getMessageItems(this.#errorText);
			}

			this.#items = items;
		}

		if (this.#items.length === 0)
		{
			return this.#getMessageItems(this.#emptyText);
		}

		return this.#items.map((item: DictionaryItem): Object => ({
			// MenuItem encodes the text option, dictionary titles are inserted as text
			text: item.name,
			onclick: (): void => {
				this.#applyValue(item.value);
				MenuManager.getMenuById(this.#menuId)?.close();
			},
		}));
	}

	#getMessageItems(text: string): Array<Object>
	{
		return Type.isStringFilled(text) ? [{ text, disabled: true }] : [];
	}

	#toggleMenu(items: Array<Object>): void
	{
		const currentMenu = MenuManager.getMenuById(this.#menuId);
		if (currentMenu)
		{
			const wasShown = currentMenu.getPopupWindow().isShown();
			currentMenu.destroy();
			this.#setExpanded(false);
			if (wasShown)
			{
				return;
			}
		}

		if (items.length === 0)
		{
			return;
		}

		MenuManager.create({
			id: this.#menuId,
			bindElement: this.#buttonNode,
			items,
			// the menu is rebuilt on every opening, a closed one must not stay in the manager
			cacheable: false,
			events: {
				onPopupClose: (): void => this.#setExpanded(false),
			},
		}).show();
		this.#setExpanded(true);
	}

	#setExpanded(isExpanded: boolean): void
	{
		Dom.attr(this.#buttonNode, 'aria-expanded', isExpanded ? 'true' : 'false');
	}

	#applyValue(value: string): void
	{
		this.#inputNode.value = value;
		// the dialog learns about a programmatic value the same way the platform field controls report it
		this.#inputNode.dispatchEvent(new globalThis.Event('change', { bubbles: true }));
	}
}
