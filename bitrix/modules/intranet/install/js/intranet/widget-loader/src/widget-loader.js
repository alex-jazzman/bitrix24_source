import './style.css';
import { Tag, Cache, Dom, Event } from 'main.core';
import { Popup } from 'main.popup';

export class WidgetLoader
{
	#cache = new Cache.MemoryCache();

	constructor(options = {})
	{
		this.#setOptions(options);
		Event.bind(this.#getOptions().bindElement, 'click', () => {
			this.show();
		});
	}

	show(): void
	{
		this.getPopup().show();
	}

	clearBeforeInsertContent(): void
	{
		const popupContainer = this.getPopup().getPopupContainer();
		Dom.removeClass(popupContainer, 'intranet-widget-skeleton__wrap');
		popupContainer.querySelectorAll('.intranet-widget-skeleton__row').forEach(
			(row) => Dom.remove(row),
		);
		popupContainer.querySelectorAll('.intranet-widget-skeleton__header').forEach(
			(row) => Dom.remove(row),
		);
		popupContainer.querySelectorAll('.intranet-widget-skeleton__footer').forEach(
			(row) => Dom.remove(row),
		);
		Dom.prepend(this.#cache.get('popup-content'), popupContainer);
	}

	getPopup(): Popup
	{
		return this.#cache.remember('popup', () => {
			const offsetLeft = (-(this.#getOptions().width / 2)
				+ (this.#getOptions().bindElement ? this.#getOptions().bindElement.offsetWidth / 2 : 0)
				+ 40);
			const popup = new Popup({
				autoHide: true,
				id: this.#getOptions().id ?? null,
				bindElement: this.#getOptions().bindElement,
				width: this.#getOptions().width,
				offsetLeft: this.#getOptions().offsetLeft ?? offsetLeft,
				useAngle: this.#getOptions().useAngle ?? true,
				angle: this.#getOptions().useAngle ?? {
					offset: (this.#getOptions().width / 2) - 16,
				},
				offsetTop: this.#getOptions().offsetTop ?? 3,
				animation: 'fading-slide',
				closeByEsc: true,
			});
			const container = popup.getPopupContainer();
			this.#cache.set('popup-content', container.querySelector('.popup-window-content'));
			Dom.remove(container.querySelector('.popup-window-content'));
			Dom.addClass(container, 'intranet-widget-skeleton__wrap');

			return popup;
		});
	}

	#setOptions(options): WidgetLoader
	{
		this.#cache.set('options', options);

		return this;
	}

	#getOptions(): Object
	{
		return this.#cache.get('options', {});
	}

	createSkeletonFromConfig(config = {}): WidgetLoader
	{
		if (config.header)
		{
			this.addHeaderSkeleton();
		}

		if (Array.isArray(config.items))
		{
			config.items.forEach((item) => {
				if (item.type === 'item')
				{
					this.addItemSkeleton(item.height);
				}
				else if (item.type === 'split')
				{
					this.addSplitItemSkeleton(item.height);
				}
			});
		}

		if (config.footer)
		{
			this.addFooterSkeleton();
		}

		return this;
	}

	addItemSkeleton(height: number): WidgetLoader
	{
		Dom.append(this.#createItemSkeleton(height), this.getPopup().getPopupContainer());

		return this;
	}

	addSplitItemSkeleton(height: number): WidgetLoader
	{
		Dom.append(this.#createSplitItemSkeleton(height), this.getPopup().getPopupContainer());

		return this;
	}

	addHeaderSkeleton(): WidgetLoader
	{
		Dom.prepend(this.#createHeaderSkeleton(), this.getPopup().getPopupContainer());

		return this;
	}

	addFooterSkeleton(): WidgetLoader
	{
		Dom.append(this.#createFooterSkeleton(), this.getPopup().getPopupContainer());

		return this;
	}

	#createHeaderSkeleton(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-widget-skeleton__header">
				<div style="max-width: 95px; height: 8px;" class="intranet-widget-skeleton__line"></div>
			</div>
		`;
	}

	#createItemSkeleton(height: number): HTMLElement
	{
		return Tag.render`
			<div class="intranet-widget-skeleton__row">
				<div style="height: ${height}px" class="intranet-widget-skeleton__item">
					<div class="intranet-widget-skeleton__circle"></div>
					<div style="max-width: 130px;" class="intranet-widget-skeleton__line"></div>
					<div style="width: 12px; height: 12px; margin-left: auto;" class="intranet-widget-skeleton__circle"></div>
				</div>
			</div>
		`;
	}

	#createSplitItemSkeleton(height: number): HTMLElement
	{
		return  Tag.render`
			<div class="intranet-widget-skeleton__row">
				<div style="height: ${height}px" class="intranet-widget-skeleton__item">
					<div class="intranet-widget-skeleton__circle"></div>
					<div style="max-width: 75px;" class="intranet-widget-skeleton__line"></div>
					<div style="width: 12px; height: 12px; margin-left: auto;" class="intranet-widget-skeleton__circle"></div>
				</div>
				<div style="height: ${height}px" class="intranet-widget-skeleton__item">
					<div class="intranet-widget-skeleton__circle"></div>
					<div style="max-width: 75px;" class="intranet-widget-skeleton__line"></div>
					<div style="width: 12px; height: 12px; margin-left: auto;" class="intranet-widget-skeleton__circle"></div>
				</div>
			</div>
		`;
	}

	#createFooterSkeleton(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-widget-skeleton__footer">
				<div style="max-width: 40px;" class="intranet-widget-skeleton__line"></div>
				<div style="max-width: 40px;" class="intranet-widget-skeleton__line"></div>
				<div style="max-width: 40px;" class="intranet-widget-skeleton__line"></div>
			</div>
		`;
	}
}
