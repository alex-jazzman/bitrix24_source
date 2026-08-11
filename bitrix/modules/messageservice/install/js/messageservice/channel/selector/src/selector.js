import { Dom, Extension, Loc, Runtime, Tag, Text, Type, Uri } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Icon, Outline } from 'ui.icon-set.api.core';

import './selector.css';

export type SelectorOptions = {
	channels: SelectorChannel[],
	promoBanners: PromoBanner[],
	bindElement: HTMLElement | string,
	channelsSort: ChannelPosition[],
	events: ?Object,
};

export type SelectorChannel = {
	id: string,
	appearance: {
		icon: IconOptions,
		title: string,
		subtitle: string | null,
	},
	onclick: (SelectorChannel) => void,
}

export type IconOptions = {
	title: string,
	color: string,
	background: string,
}

export type PromoBanner = {
	id: string,
	title: string,
	subtitle: string,
	background: string,
	icon: ?IconOptions,
	customIconName: ?string,
	connectionUrl: string,
}

export type ChannelPosition = {
	channelId: string,
	isHidden: boolean,
};

const EXTENSION_NAME = 'messageservice.channel.selector';

/**
 * @emits BX.MessageService.Channel.Selector.Selector:onShow
 * @emits BX.MessageService.Channel.Selector.Selector:onClose
 * @emits BX.MessageService.Channel.Selector.Selector:onDestroy
 * @emits BX.MessageService.Channel.Selector.Selector:onSave
 * @emits BX.MessageService.Channel.Selector.Selector:onBeforeAddChannelOpen
 * @emits BX.MessageService.Channel.Selector.Selector:onAfterAddChannelClose
 * @emits BX.MessageService.Channel.Selector.Selector:onBeforePromoBannerSliderOpen
 * @emits BX.MessageService.Channel.Selector.Selector:onAfterPromoBannerSliderClose
 */
export class Selector extends EventEmitter
{
	#bindElement: ?HTMLElement;
	#channels: SelectorChannel[];
	#promoBanners: PromoBanner[];
	#channelsSort: ChannelPosition[];
	#popup: Popup | null;

	constructor(options: SelectorOptions = {})
	{
		super();

		this.setEventNamespace('BX.MessageService.Channel.Selector.Selector');

		this.#channels = Type.isArray(options.channels) ? options.channels : [];
		this.#promoBanners = Type.isArray(options.promoBanners) ? options.promoBanners : [];
		this.#channelsSort = Type.isArray(options.channelsSort) ? options.channelsSort : [];

		this.#normalizeChannelsSort(this.#channels, this.#channelsSort);
		this.#sortChannels(this.#channels);

		this.#bindElement = this.#resolveBindElement(options.bindElement);
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

	#resolveBindElement(bindElement: mixed): ?HTMLElement
	{
		if (Type.isDomNode(bindElement))
		{
			return bindElement;
		}

		if (Type.isStringFilled(bindElement))
		{
			return document.querySelector(bindElement);
		}

		return null;
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
		const container = Tag.render`<div class="messageservice-channel-selector"></div>`;

		Dom.append(this.#renderBody(), container);

		if (Type.isArrayFilled(this.#promoBanners))
		{
			Dom.append(this.#renderBanners(), container);
		}

		Dom.append(this.#renderFooter(), container);

		return container;
	}

	#renderBody(): HTMLElement
	{
		return Tag.render`
			<div class="messageservice-channel-selector-body">
				<div class="messageservice-channel-selector-title">${Loc.getMessage('MESSAGESERVICE_CHANNEL_SELECTOR_ALL_CHANNELS')}</div>
				<div class="messageservice-channel-selector-list">${this.#renderVisibleChannels()}</div>
			</div>
		`;
	}

	#renderVisibleChannels(): HTMLElement[]
	{
		const visible = this.#channels.filter((channel: SelectorChannel) => !this.#isHidden(channel));

		return visible.map((channel: SelectorChannel) => this.#renderChannel(channel));
	}

	#renderChannel(channel: SelectorChannel): HTMLElement
	{
		const icon = new Icon({
			icon: channel.appearance.icon.title,
			color: channel.appearance.icon.color,
		});

		const onClick = () => {
			channel.onclick?.(channel);
		};

		const contentContainer = Tag.render`
			<div class="messageservice-channel-selector-content">
				<div
					class="
						messageservice-channel-selector-item-title
						messageservice-channel-selector-ellipsis
					"
					title="${Text.encode(channel.appearance.title)}"
				>${Text.encode(channel.appearance.title)}</div>
			</div>
		`;

		if (Type.isStringFilled(channel.appearance.subtitle))
		{
			Dom.append(
				Tag.render`
					<div
						class="
							messageservice-channel-selector-item-subtitle
							messageservice-channel-selector-ellipsis
						"
						title="${Text.encode(channel.appearance.subtitle)}"
					>${Text.encode(channel.appearance.subtitle)}</div>
				`,
				contentContainer,
			);
		}

		return Tag.render`
			<div class="messageservice-channel-selector-item" onclick="${onClick}">
				<div
					class="messageservice-channel-selector-icon"
					style="background: ${Text.encode(channel.appearance.icon.background)};"
				>${icon.render()}</div>
				${contentContainer}
			</div>
		`;
	}

	#normalizeChannelsSort(channels: SelectorChannel[], channelsSort: ChannelPosition[]): void
	{
		for (const channel of channels)
		{
			if (!channelsSort.some((x) => x.channelId === channel.id))
			{
				channelsSort.unshift({
					channelId: channel.id,
					isHidden: false,
				});
			}
		}

		this.#ensureMaxVisibleChannels(channelsSort);
		this.#ensureMinVisibleChannels(channelsSort);
	}

	#isHidden(channel: SelectorChannel): boolean
	{
		const position: ?ChannelPosition = this.#channelsSort.find((x) => x.channelId === channel.id);
		if (!position)
		{
			throw new Error(`Position not found for channel: ${channel.id}`);
		}

		return position.isHidden;
	}

	#sortChannels(channels: {id: string}[]): void
	{
		// unknown channels go up, assuming they are new
		channels.sort((a: SelectorChannel, b: SelectorChannel) => {
			const positionA: ?ChannelPosition = this.#channelsSort.find((x) => x.channelId === a.id);
			const positionB: ?ChannelPosition = this.#channelsSort.find((x) => x.channelId === b.id);

			if (!positionA && !positionB)
			{
				return 0;
			}

			if (!positionA && positionB)
			{
				return -1;
			}

			if (positionA && !positionB)
			{
				return 1;
			}

			if (!positionA.isHidden && positionB.isHidden)
			{
				return -1;
			}

			if (positionA.isHidden && !positionB.isHidden)
			{
				return 1;
			}

			return this.#channelsSort.indexOf(positionA) - this.#channelsSort.indexOf(positionB);
		});
	}

	#renderBanners(): HTMLElement
	{
		const banners = this.#promoBanners.map((options: PromoBanner) => this.#renderSingleBanner(options));

		return Tag.render`
			<div class="messageservice-channel-selector-banner-container">
				<div class="messageservice-channel-selector-banner-list">${banners}</div>
			</div>
		`;
	}

	#renderSingleBanner(banner: PromoBanner): HTMLElement
	{
		let icon: HTMLElement = null;
		if (Type.isStringFilled(banner.customIconName) && /^[\w-]+$/.test(banner.customIconName))
		{
			const url = `/bitrix/js/messageservice/channel/selector/images/custom-icons/${
				Text.encode(banner.customIconName)
			}.svg`;

			icon = Tag.render`
				<div class="messageservice-channel-selector-icon">
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
					class="messageservice-channel-selector-icon"
					style="background: ${Text.encode(banner.icon.background)};"
				>${iconApi.render()}</div>
			`;
		}
		else
		{
			throw new TypeError('Banner icon is not defined');
		}

		const button = new Button({
			text: Loc.getMessage('MESSAGESERVICE_CHANNEL_SELECTOR_CONNECT'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.SMALL,
			onclick: () => {
				void this.#openPromoBanner(banner);
			},
		});

		return Tag.render`
			<div class="messageservice-channel-selector-item" style="background: ${Text.encode(banner.background)};">
				${icon}
				<div class="messageservice-channel-selector-content">
					<div
						class="
							messageservice-channel-selector-item-title
							messageservice-channel-selector-ellipsis
						"
						title="${Text.encode(banner.title)}"
					>${Text.encode(banner.title)}</div>
					<div
						class="
							messageservice-channel-selector-item-subtitle
							messageservice-channel-selector-ellipsis
						"
						title="${Text.encode(banner.subtitle)}"
					>${Text.encode(banner.subtitle)}</div>
				</div>
				<div class="messageservice-channel-selector-banner-link">${
					button.render()
				}</div>
			</div>
		`;
	}

	#renderFooter(): HTMLElement
	{
		const addButton = new Button({
			text: Loc.getMessage('MESSAGESERVICE_CHANNEL_SELECTOR_ADD_CHANNEL'),
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			size: ButtonSize.SMALL,
			icon: Outline.PLUS_L,
			onclick: () => {
				void this.#openAddChannel();
			},
		});

		const configureButton = new Button({
			text: Loc.getMessage('MESSAGESERVICE_CHANNEL_SELECTOR_CONFIGURE'),
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			size: ButtonSize.SMALL,
			icon: Outline.SETTINGS,
			onclick: () => {
				this.#enterEditMode();
			},
		});

		return Tag.render`
			<div class="messageservice-channel-selector-footer">
				${addButton.render()}
				${configureButton.render()}
			</div>
		`;
	}

	async #openAddChannel(): Promise<void>
	{
		const event = new BaseEvent();
		// maybe caller will want to do something else
		// wait until caller is done
		await this.emitAsync('onBeforeAddChannelOpen', event);
		if (event.isDefaultPrevented())
		{
			return;
		}

		const url = Extension.getSettings(EXTENSION_NAME).get('contactCenterUrl');
		if (!Type.isStringFilled(url))
		{
			return;
		}

		await this.#openSlider(url);

		this.emit('onAfterAddChannelClose');
	}

	async #openPromoBanner(banner: PromoBanner): Promise<void>
	{
		const eventData = {
			banner,
		};

		const event = new BaseEvent({
			data: eventData,
		});
		// maybe caller will want to do something else
		// wait until caller is done
		await this.emitAsync('onBeforePromoBannerSliderOpen', event);
		if (event.isDefaultPrevented())
		{
			return;
		}

		const slider = await this.#openSlider(banner.connectionUrl, {
			width: 700,
		});

		this.emit('onAfterPromoBannerSliderClose', {
			...eventData,
			connectStatus: slider.getData().get('status'),
		});
	}

	#openSlider(url: string | Uri, options: ?Object = null): Promise<?BX.SidePanel.Slider>
	{
		const preparedUrl = String(url);
		if (!Type.isStringFilled(preparedUrl))
		{
			return Promise.resolve();
		}

		let preparedOptions = Type.isPlainObject(options) ? options : {};
		preparedOptions = { cacheable: false, allowChangeHistory: true, events: {}, ...preparedOptions };

		return Runtime.loadExtension('main.sidepanel').then(({ SidePanel }) => {
			return new Promise((resolve) => {
				preparedOptions.events.onClose = (event) => resolve(event.getSlider());

				SidePanel.Instance.open(preparedUrl, preparedOptions);
			});
		});
	}

	#enterEditMode(): void
	{
		const wasShown = this.isShown();

		Runtime.loadExtension('ui.menu-configurable')
			.then(({ Menu }) => {
				const items = this.#channels.map((channel: SelectorChannel) => {
					const html = Tag.render`
						<span>
							<span
								class="messageservice-channel-selector-ellipsis"
								title="${Text.encode(channel.appearance.title)}"
							>${Text.encode(channel.appearance.title)}</span>
						</span>
					`;

					if (Type.isStringFilled(channel.appearance.subtitle))
					{
						Dom.append(
							Tag.render`
								<span
									class="
										messageservice-channel-selector-edit-item-subtitle
										messageservice-channel-selector-ellipsis
									"
									title="${Text.encode(channel.appearance.subtitle)}"
								>${Text.encode(channel.appearance.subtitle)}</span>
							`,
							html,
						);
					}

					return {
						id: channel.id,
						isHidden: this.#isHidden(channel),
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
		const settings = Extension.getSettings(EXTENSION_NAME);

		return Text.toInteger(settings.get('maxVisibleChannels'));
	}

	#getMinVisibleChannels(): number
	{
		const settings = Extension.getSettings(EXTENSION_NAME);

		return Text.toInteger(settings.get('minVisibleChannels'));
	}

	#save(editItems: Array): void
	{
		this.#ensureMinVisibleChannels(editItems);
		this.#updateChannelsSort(editItems);

		this.#popup?.setContent(this.#renderContent());

		this.emit('onSave', { channelsSort: this.#channelsSort });
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

	#updateChannelsSort(editItems: Array): void
	{
		this.#channelsSort = editItems
			.map((item) => {
				return {
					channelId: item.id,
					isHidden: item.isHidden,
				};
			})
		;
		this.#normalizeChannelsSort(this.#channels, this.#channelsSort);
		this.#sortChannels(this.#channels);
	}
}
