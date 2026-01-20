import { type Appearance, type ChannelPosition, type PromoBanner } from 'crm.messagesender.editor';
import { Dom, Extension, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import './selector.css';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';

export type SelectorOptions = {
	items: SelectorItem[],
	banners: PromoBanner[],
	bindElement: HTMLElement,
	itemsSort: ChannelPosition[],
	events: ?Object,
	analytics: ?Object,
};

export type SelectorItem = {
	id: string,
	appearance: Appearance,
	onclick: (SelectorItem) => void,
}

/**
 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onShow
 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onClose
 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onDestroy
 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onSave
 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onConnectionsSliderClose
 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onPromoBannerSliderClose
 */
export class Selector extends EventEmitter
{
	#bindElement: ?HTMLElement;
	#items: SelectorItem[];
	#banners: PromoBanner[];
	#itemsSort: ChannelPosition[];
	#analytics: ?Object;
	#popup: Popup | null;

	constructor(options: SelectorOptions = {})
	{
		super();

		this.setEventNamespace('BX.Crm.MessageSender.ChannelSelector.Selector');

		this.#items = Type.isArray(options.items) ? options.items : [];
		this.#banners = Type.isArray(options.banners) ? options.banners : [];
		this.#itemsSort = Type.isArray(options.itemsSort) ? options.itemsSort : [];

		this.#normalizeItemsSort(this.#items, this.#itemsSort);
		this.#sortItems(this.#items);

		this.#bindElement = Type.isDomNode(options.bindElement) ? options.bindElement : null;
		this.#analytics = Type.isPlainObject(options.analytics) ? options.analytics : null;
		this.subscribeFromOptions(options.events ?? {});
	}

	isShown(): boolean
	{
		return Boolean(this.#popup?.isShown());
	}

	show(): void
	{
		this.#popup ??= this.#buildPopup();

		this.#popup.show();
	}

	close(): void
	{
		this.#popup?.close();
	}

	destroy(): void
	{
		this.#popup?.destroy();
		this.unsubscribeAll();
		this.#popup = null;
		Runtime.destroy(this);
	}

	#buildPopup(): Popup
	{
		return new Popup({
			bindElement: this.#bindElement,
			content: this.#renderContent(),
			autoHide: true,
			closeByEsc: true,
			padding: 0,
			borderRadius: '24px',
			minWidth: 350,
			maxWidth: 650,
			events: {
				onShow: () => {
					this.emit('onShow');
				},
				onClose: () => {
					this.emit('onClose');
				},
				onDestroy: () => {
					this.emit('onDestroy');
				},
			},
		});
	}

	#renderContent(): HTMLElement
	{
		const container = Tag.render`<div class="crm-messagesender-channel-selector"></div>`;

		Dom.append(this.#renderBody(), container);

		if (Type.isArrayFilled(this.#banners))
		{
			Dom.append(this.#renderBanners(), container);
		}

		Dom.append(this.#renderFooter(), container);

		return container;
	}

	#renderBody(): HTMLElement
	{
		return Tag.render`
			<div class="crm-messagesender-channel-selector-body">
				<div class="crm-messagesender-channel-selector-title">${Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_ALL_CHANNELS')}</div>
				<div class="crm-messagesender-channel-selector-list">${this.#renderVisibleItems()}</div>
			</div>
		`;
	}

	#renderVisibleItems(): HTMLElement[]
	{
		const visible = this.#items.filter((item: SelectorItem) => !this.#isHidden(item));

		return visible.map((options: SelectorItem) => this.#renderItem(options));
	}

	#renderItem(options: SelectorItem): HTMLElement
	{
		const icon = new Icon({
			icon: options.appearance.icon.title,
			color: options.appearance.icon.color,
		});

		const onClick = () => {
			options.onclick?.(options);
		};

		const contentContainer = Tag.render`
			<div class="crm-messagesender-channel-selector-content">
				<div
					class="
						crm-messagesender-channel-selector-item-title
						crm-messagesender-channel-selector-ellipsis
					"
					title="${Text.encode(options.appearance.title)}"
				>${Text.encode(options.appearance.title)}</div>
			</div>
		`;

		if (Type.isStringFilled(options.appearance.subtitle))
		{
			Dom.append(
				Tag.render`
					<div
						class="
							crm-messagesender-channel-selector-item-subtitle 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${Text.encode(options.appearance.subtitle)}"
					>${Text.encode(options.appearance.subtitle)}</div>
				`,
				contentContainer,
			);
		}

		return Tag.render`
			<div class="crm-messagesender-channel-selector-item" onclick="${onClick}">
				<div
					class="crm-messagesender-channel-selector-icon"
					style="background: ${Text.encode(options.appearance.icon.background)};"
				>${icon.render()}</div>
				${contentContainer}
			</div>
		`;
	}

	#normalizeItemsSort(items: SelectorItem[], itemsSort: ChannelPosition[]): void
	{
		for (const item of items)
		{
			if (!itemsSort.some((x) => x.channelId === item.id))
			{
				itemsSort.unshift({
					channelId: item.id,
					isHidden: false,
				});
			}
		}

		this.#ensureMaxVisibleChannels(itemsSort);
		this.#ensureMinVisibleChannels(itemsSort);
	}

	#isHidden(item: SelectorItem): boolean
	{
		const position: ?ChannelPosition = this.#itemsSort.find((x) => x.channelId === item.id);
		if (!position)
		{
			throw new Error(`Position not found for item: ${item.id}`);
		}

		return position.isHidden;
	}

	#sortItems(items: {id: string}[]): void
	{
		items.sort((a: SelectorItem, b: SelectorItem) => {
			const positionA: ?ChannelPosition = this.#itemsSort.find((x) => x.channelId === a.id);
			const positionB: ?ChannelPosition = this.#itemsSort.find((x) => x.channelId === b.id);

			if (positionA.isHidden && !positionB.isHidden)
			{
				return 1;
			}

			if (!positionA.isHidden && positionB.isHidden)
			{
				return -1;
			}

			const positionIndexA = Type.isNil(positionA) ? -1 : this.#itemsSort.indexOf(positionA);
			const positionIndexB = Type.isNil(positionB) ? -1 : this.#itemsSort.indexOf(positionB);

			return positionIndexA - positionIndexB;
		});
	}

	#renderBanners(): HTMLElement
	{
		const banners = this.#banners.map((options: PromoBanner) => this.#renderSingleBanner(options));

		return Tag.render`
			<div class="crm-messagesender-channel-selector-banner-container">
				<div class="crm-messagesender-channel-selector-banner-title">${
					Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_RECOMMENDED')
				}</div>
				<div class="crm-messagesender-channel-selector-banner-list">${banners}</div>
			</div>
		`;
	}

	#renderSingleBanner(banner: PromoBanner): HTMLElement
	{
		let icon: HTMLElement = null;
		if (Type.isStringFilled(banner.customIconName) && /^[\w-]+$/.test(banner.customIconName))
		{
			const url = `/bitrix/js/crm/messagesender/channel-selector/images/custom-icons/${
				Text.encode(banner.customIconName)
			}.svg`;

			icon = Tag.render`
				<div class="crm-messagesender-channel-selector-icon">
					<img alt="${Text.encode(banner.title)}" src="${url}">
				</div>
			`;
		}
		else if (Type.isPlainObject(banner.icon))
		{
			const iconApi = new Icon({
				icon: banner.icon.title,
				color: banner.icon.color,
			});

			icon = Tag.render`
				<div
					class="crm-messagesender-channel-selector-icon"
					style="background: ${Text.encode(banner.icon.background)};"
				>${iconApi.render()}</div>
			`;
		}
		else
		{
			throw new TypeError('Banner icon is not defined');
		}

		const button = new Button({
			text: Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_CONNECT'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.SMALL,
			onclick: async () => {
				const slider = await this.#openSlider(banner.connectionUrl, {
					width: 700,
				});

				this.emit('onPromoBannerSliderClose', {
					bannerId: banner.id,
					connectStatus: slider.getData().get('status'),
				});
			},
		});

		return Tag.render`
			<div class="crm-messagesender-channel-selector-item" style="background: ${Text.encode(banner.background)};">
				${icon}
				<div class="crm-messagesender-channel-selector-content">
					<div
						class="
							crm-messagesender-channel-selector-item-title 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${Text.encode(banner.title)}"
					>${Text.encode(banner.title)}</div>
					<div 
						class="
							crm-messagesender-channel-selector-item-subtitle 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${Text.encode(banner.subtitle)}"
					>${Text.encode(banner.subtitle)}</div>
				</div>
				<div class="crm-messagesender-channel-selector-banner-link">${
					button.render()
				}</div>
			</div>
		`;
	}

	#renderFooter(): HTMLElement
	{
		const addButton = new Button({
			text: Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_ADD_CHANNEL'),
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			size: ButtonSize.SMALL,
			icon: Outline.PLUS_L,
			onclick: async () => {
				await this.#openMessageSenderConnectionsSlider();

				this.emit('onConnectionsSliderClose');
			},
		});

		const configureButton = new Button({
			text: Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_CONFIGURE'),
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			size: ButtonSize.SMALL,
			icon: Outline.SETTINGS,
			onclick: () => {
				this.#enterEditMode();
			},
		});

		return Tag.render`
			<div class="crm-messagesender-channel-selector-footer">
				${addButton.render()}
				${configureButton.render()}
			</div>
		`;
	}

	async #openMessageSenderConnectionsSlider(): Promise<?BX.SidePanel.Slider>
	{
		const { Router } = await Runtime.loadExtension('crm.router');

		/** @see BX.Crm.Router.openMessageSenderConnectionsSlider */
		return Router.Instance.openMessageSenderConnectionsSlider(this.#analytics);
	}

	/**
	 * Resolves when the slider is closed.
	 */
	#openSlider(url: string, options: ?Object = null): Promise<?BX.SidePanel.Slider>
	{
		return Runtime.loadExtension('crm.router')
			.then(({ Router }) => {
				/** @see BX.Crm.Router.openSlider */
				return Router.openSlider(url, options);
			}).catch((error) => {
				console.error('cant load crm.router', error);

				throw error;
			})
		;
	}

	#enterEditMode(): void
	{
		const wasShown = this.isShown();

		Runtime.loadExtension('ui.menu-configurable')
			.then(({ Menu }) => {
				const items = this.#items.map((item: SelectorItem) => {
					const html = Tag.render`
						<span>
							<span
								class="crm-messagesender-channel-selector-ellipsis"
								title="${Text.encode(item.appearance.title)}"
							>${Text.encode(item.appearance.title)}</span>
						</span>
					`;

					if (Type.isStringFilled(item.appearance.subtitle))
					{
						Dom.append(
							Tag.render`
								<span
									class="
										crm-messagesender-channel-selector-edit-item-subtitle 
										crm-messagesender-channel-selector-ellipsis
									"
									title="${Text.encode(item.appearance.subtitle)}"
								>${Text.encode(item.appearance.subtitle)}</span>
							`,
							html,
						);
					}

					return {
						id: item.id,
						isHidden: this.#isHidden(item),
						html,
					};
				});

				/** @see BX.UI.MenuConfigurable.Menu */
				const menu = new Menu({
					items,
					bindElement: this.#bindElement,
					maxVisibleItems: this.#getMaxVisibleChannels(),
					maxWidth: 600,
				});

				this.close();

				return menu.open();
			})
			.then((openResult) => {
				if (!openResult.isCanceled && Type.isArray(openResult?.items))
				{
					this.#save(openResult.items);
				}

				if (wasShown)
				{
					this.show();
				}
			})
			.catch((error) => {
				console.error('cant load ui.menu-configurable', error);
			});
	}

	#getMaxVisibleChannels(): number
	{
		const settings = Extension.getSettings('crm.messagesender.channel-selector');

		return Text.toInteger(settings.get('maxVisibleChannels'));
	}

	#getMinVisibleChannels(): number
	{
		const settings = Extension.getSettings('crm.messagesender.channel-selector');

		return Text.toInteger(settings.get('minVisibleChannels'));
	}

	#save(editItems: Array): void
	{
		this.#ensureMinVisibleChannels(editItems);
		this.#updateItemsSort(editItems);

		this.#popup?.setContent(this.#renderContent());

		this.emit('onSave', { itemsSort: this.#itemsSort });
	}

	#ensureMinVisibleChannels(positions: Array<{isHidden: boolean}>): void
	{
		const visibleCount = positions.filter((item) => !item.isHidden).length;
		if (visibleCount >= this.#getMinVisibleChannels())
		{
			return;
		}

		const toShow = this.#getMinVisibleChannels() - visibleCount;

		let shown = 0;
		for (const item of positions)
		{
			if (item.isHidden)
			{
				item.isHidden = false;
				shown += 1;
			}

			if (shown >= toShow)
			{
				return;
			}
		}
	}

	#ensureMaxVisibleChannels(positions: Array<{isHidden: boolean}>): void
	{
		const visible = positions.filter((item) => !item.isHidden);
		if (visible.length <= this.#getMaxVisibleChannels())
		{
			return;
		}

		const toHide = visible.slice(this.#getMaxVisibleChannels(), visible.length);
		for (const item of toHide)
		{
			item.isHidden = true;
		}
	}

	#updateItemsSort(editItems: Array): void
	{
		this.#itemsSort = editItems
			.map((item) => {
				return {
					channelId: item.id,
					isHidden: item.isHidden,
				};
			})
		;
		this.#normalizeItemsSort(this.#items, this.#itemsSort);
		this.#sortItems(this.#items);
	}
}
