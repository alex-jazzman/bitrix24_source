import { ajax, Dom, Event, Loc, Tag } from 'main.core';
import 'ui.icon-set.outline';
import 'ui.icon-set.solid';

import { type TabConfig } from '../catalog';
import { type CatalogItem } from '../tab-controller';
import { renderIcon } from '../utils/icons.js';
import { MY_TAB_ID } from '../constants';

export type FavoriteRequestRegistry = {
	get: () => Promise<void> | null,
	track: (request: Promise<void>, desired: boolean) => void,
	settle: (value: boolean) => void,
};

type CatalogPopupItemFavoriteButtonOptions = {
	onFavoriteToggled?: (committed: boolean) => void,
	favoriteRequests?: FavoriteRequestRegistry,
};

export class CatalogPopupItemFavoriteButton
{
	#item: CatalogItem;
	#tab: TabConfig | null;
	#onFavoriteToggled: ((committed: boolean) => void) | null;
	#node: HTMLButtonElement | null = null;
	#request: Promise<void> | null = null;
	#favoriteRequests: FavoriteRequestRegistry | null;

	constructor(
		item: CatalogItem,
		tab: TabConfig | null = null,
		options: CatalogPopupItemFavoriteButtonOptions = {},
	)
	{
		this.#item = item;
		this.#tab = tab;
		this.#onFavoriteToggled = options.onFavoriteToggled ?? null;
		this.#favoriteRequests = options.favoriteRequests ?? null;
	}

	canBeFavorited(): boolean
	{
		return this.#tab?.id === MY_TAB_ID && !this.#tab?.extraData?.previewUserId;
	}

	render(): ?HTMLElement
	{
		if (!this.canBeFavorited())
		{
			return null;
		}

		if (this.#node === null)
		{
			this.#node = Tag.render`<button type="button" data-testid="vibecode-catalog-item-favorite-button"></button>`;

			Event.bind(this.#node, 'click', (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				this.toggle();
			});

			Event.bind(this.#node, 'keydown', (event: KeyboardEvent) => {
				if (event.key === 'Enter' || event.key === ' ')
				{
					event.stopPropagation();
				}
			});
		}

		this.#syncNode();

		return this.#node;
	}

	toggle(): Promise<void>
	{
		const pending = this.#pendingRequest();
		if (pending !== null)
		{
			return pending;
		}

		const wasFavorite = this.#item.isFavorite;
		const action = wasFavorite
			? 'vibecodeconnector.Catalog.unfavorite'
			: 'vibecodeconnector.Catalog.favorite';

		this.#item.isFavorite = !wasFavorite;
		this.#syncNode();

		const request = ajax.runAction(action, {
			data: { catalogItemId: this.#item.id },
		}).then(() => {
			this.#settleRequest(this.#item.isFavorite);
			this.#onFavoriteToggled?.(true);
		}).catch((error) => {
			this.#item.isFavorite = wasFavorite;
			this.#settleRequest(wasFavorite);
			this.#syncNode();
			console.error('[vibecodeconnector.catalog] failed to toggle favorite', this.#item.id, error);
			this.#onFavoriteToggled?.(false);
		});

		this.#rememberRequest(request);

		return request;
	}

	#pendingRequest(): Promise<void> | null
	{
		return this.#favoriteRequests ? this.#favoriteRequests.get() : this.#request;
	}

	#rememberRequest(request: Promise<void>): void
	{
		if (this.#favoriteRequests)
		{
			this.#favoriteRequests.track(request, this.#item.isFavorite);

			return;
		}

		this.#request = request;
	}

	#settleRequest(value: boolean): void
	{
		if (this.#favoriteRequests)
		{
			this.#favoriteRequests.settle(value);

			return;
		}

		this.#request = null;
	}

	#syncNode(): void
	{
		if (!(this.#node instanceof HTMLButtonElement))
		{
			return;
		}

		this.#node.className = `vibecode-catalog__item-favorite-button${this.#item.isFavorite ? ' vibecode-catalog__item-favorite-button--favorite' : ''}`;
		const label = Loc.getMessage(
			this.#item.isFavorite
				? 'VIBECODECONNECTOR_CATALOG_FAVORITE_OFF'
				: 'VIBECODECONNECTOR_CATALOG_FAVORITE_ON',
		);
		this.#node.setAttribute('aria-label', label);
		this.#node.setAttribute('title', label);
		this.#node.setAttribute('aria-pressed', this.#item.isFavorite ? 'true' : 'false');

		Dom.clean(this.#node);
		Dom.append(renderIcon(this.#item.isFavorite ? 's-favorite' : 'o-favorite', 16), this.#node);
	}
}
