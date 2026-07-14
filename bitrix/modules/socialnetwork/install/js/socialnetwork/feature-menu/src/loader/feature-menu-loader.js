import { Tag, Cache, Dom } from 'main.core';
import { Popup } from 'main.popup';

import './feature-menu-loader.css';

export class FeatureMenuLoader
{
	#cache = new Cache.MemoryCache();

	constructor(params: Object = {})
	{
		this.#cache.set('params', params);
	}

	show(): void
	{
		this.getPopup().show();
	}

	getPopup(): Popup
	{
		return this.#cache.remember('popup', () => {
			const popup = new Popup({
				autoHide: true,
				id: this.#getParams().id ?? null,
				bindElement: this.#getParams().bindElement,
				width: this.#getParams().width,
				useAngle: this.#getParams().useAngle ?? true,
				angle: this.#getParams().useAngle ?? {
					offset: (this.#getParams().width / 2) - 16,
				},
				className: this.#getParams().className ?? null,
				animation: 'fading-slide',
				closeByEsc: true,
				offsetLeft: this.#getParams().offsetLeft ?? 0,
				offsetTop: this.#getParams().offsetTop ?? 3,
			});

			const container = popup.getPopupContainer();
			this.#cache.set('popup-content', container.querySelector('.popup-window-content'));
			Dom.remove(container.querySelector('.popup-window-content'));
			Dom.addClass(container, 'socnet-feature-menu-skeleton__wrap');

			return popup;
		});
	}

	#getParams(): Object
	{
		return this.#cache.get('params', {});
	}

	createSkeleton(): FeatureMenuLoader
	{
		this.#addHeaderSkeleton();

		this.#addItemsSkeleton(1);
		this.#addItemsSkeleton(1);

		return this;
	}

	clearBeforeInsertContent(): void
	{
		const popupContainer = this.getPopup().getPopupContainer();
		Dom.removeClass(popupContainer, 'socnet-feature-menu-skeleton__wrap');

		const selectors = [
			'.socnet-feature-menu-skeleton',
			'.socnet-feature-menu-skeleton__header',
			'.socnet-feature-menu-skeleton__row',
		].join(', ');

		popupContainer.querySelectorAll(selectors).forEach((node) => Dom.remove(node));

		Dom.prepend(this.#cache.get('popup-content'), popupContainer);
	}

	#addHeaderSkeleton(): FeatureMenuLoader
	{
		Dom.prepend(this.#createHeaderSkeleton(), this.getPopup().getPopupContainer());

		return this;
	}

	#addItemsSkeleton(count: number): FeatureMenuLoader
	{
		Dom.append(this.#createItemsSkeleton(count), this.getPopup().getPopupContainer());

		return this;
	}

	#createItemsSkeleton(count: number): HTMLElement
	{
		const wrapper = Tag.render`
			<div class="socnet-feature-menu-skeleton__row">
				<div class="socnet-feature-menu-skeleton__item --column"></div>
			</div>
		`;

		const classPrefix = 'socnet-feature-menu-skeleton';
		for (let i = 0; i < count; i++)
		{
			const item = Tag.render`
				<div class="socnet-feature-menu-skeleton__nested-item">
					<div class="${classPrefix}__cube ${classPrefix}-column-split-item__cube"></div>
					<div class="${classPrefix}__line ${classPrefix}-column-split-item__line"></div>
					<div class="${classPrefix}__circle ${classPrefix}-column-split-item__circle"></div>
				</div>
			`;
			Dom.append(item, wrapper.querySelector('.socnet-feature-menu-skeleton__item'));
		}

		return wrapper;
	}

	#createHeaderSkeleton(): HTMLElement
	{
		return Tag.render`
			<div class="socnet-feature-menu-skeleton__header">
				${this.#createFeaturesSkeleton()}
			</div>
		`;
	}

	#createFeaturesSkeleton(count: number = 3): HTMLElement
	{
		const wrapper = Tag.render`
			<div class="socnet-feature-menu-skeleton__features">
				<div class="socnet-feature-menu-skeleton__cubes"></div>
			</div>
		`;

		const labelsWrapper = Tag.render`<div class="socnet-feature-menu-skeleton__features-labels"></div>`;

		for (let i = 0; i < count; i++)
		{
			const itemCube = Tag.render`<div class="socnet-feature-menu-skeleton__cube"></div>`;
			Dom.append(itemCube, wrapper.querySelector('.socnet-feature-menu-skeleton__cubes'));

			const itemLabel = Tag.render`
				<div class="socnet-feature-menu-skeleton__line socnet-feature-menu-skeleton__features-label">
				</div>
			`;
			Dom.append(itemLabel, labelsWrapper);
		}

		Dom.append(labelsWrapper, wrapper);

		return wrapper;
	}
}
