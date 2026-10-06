import { ajax, Dom, Event, Loc, Tag } from 'main.core';
import 'ui.icon-set.small-outline';
import 'ui.icon-set.solid';

import { type TabConfig } from '../catalog';
import { type CatalogItem } from '../tab-controller';
import { renderIcon } from '../utils/icons.js';
import { MY_TAB_ID } from '../constants';

type CatalogPopupItemPinButtonOptions = {
	onPinToggled?: () => void,
};

type CatalogPopupItemPinMenuItem = {
	title: string,
	onClick: () => void,
};

export class CatalogPopupItemPinButton
{
	#item: CatalogItem;
	#tab: TabConfig | null;
	#onPinToggled: (() => void) | null;
	#node: HTMLButtonElement | null = null;

	constructor(
		item: CatalogItem,
		tab: TabConfig | null = null,
		options: CatalogPopupItemPinButtonOptions = {},
	)
	{
		this.#item = item;
		this.#tab = tab;
		this.#onPinToggled = options.onPinToggled ?? null;
	}

	canBePinned(): boolean
	{
		return this.#tab?.id === MY_TAB_ID && this.#item.isHidden !== true;
	}

	getMenuItem(): ?CatalogPopupItemPinMenuItem
	{
		if (!this.canBePinned())
		{
			return null;
		}

		return {
			title: Loc.getMessage(
				this.#item.isPinned
					? 'VIBECODECONNECTOR_CATALOG_MENU_UNPIN'
					: 'VIBECODECONNECTOR_CATALOG_MENU_PIN',
			),
			onClick: () => this.toggle(),
		};
	}

	render(): ?HTMLElement
	{
		if (!this.canBePinned())
		{
			return null;
		}

		if (this.#node === null)
		{
			this.#node = Tag.render`<button type="button"></button>`;

			Event.bind(this.#node, 'click', (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				this.toggle();
			});

			Event.bind(this.#node, 'keydown', (event: KeyboardEvent) => {
				event.stopPropagation();
			});
		}

		this.#syncNode();

		return this.#node;
	}

	toggle(): void
	{
		const action = this.#item.isPinned
			? 'vibecodeconnector.Catalog.unpin'
			: 'vibecodeconnector.Catalog.pin';

		this.#item.isPinned = !this.#item.isPinned;
		this.#syncNode();
		this.#onPinToggled?.();

		ajax.runAction(action, {
			data: { ...this.#tab?.extraData, catalogItemId: this.#item.id },
		}).catch((error) => {
			this.#item.isPinned = !this.#item.isPinned;
			this.#syncNode();
			this.#onPinToggled?.();
			console.error('[vibecodeconnector.catalog] failed to toggle pin', this.#item.id, error);
		});
	}

	#syncNode(): void
	{
		if (!(this.#node instanceof HTMLButtonElement))
		{
			return;
		}

		this.#node.className = `vibecode-catalog__item-pin-button${this.#item.isPinned ? ' vibecode-catalog__item-pin-button--pinned' : ''}`;
		this.#node.setAttribute('aria-label', Loc.getMessage(
			this.#item.isPinned
				? 'VIBECODECONNECTOR_CATALOG_MENU_UNPIN'
				: 'VIBECODECONNECTOR_CATALOG_MENU_PIN',
		));

		Dom.clean(this.#node);
		Dom.append(renderIcon(this.#item.isPinned ? 's-pin' : 'so-pin', 16), this.#node);
	}
}
