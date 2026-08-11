/* eslint-disable */
this.BX = this.BX || {};
this.BX.MessageService = this.BX.MessageService || {};
this.BX.MessageService.Channel = this.BX.MessageService.Channel || {};
(function (exports, main_core, main_core_events, main_popup, ui_buttons, ui_iconSet_api_core) {
	'use strict';

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
	class Selector extends main_core_events.EventEmitter {
		#bindElement;
		#channels;
		#promoBanners;
		#channelsSort;
		#popup;
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.MessageService.Channel.Selector.Selector');
			this.#channels = main_core.Type.isArray(options.channels) ? options.channels : [];
			this.#promoBanners = main_core.Type.isArray(options.promoBanners) ? options.promoBanners : [];
			this.#channelsSort = main_core.Type.isArray(options.channelsSort) ? options.channelsSort : [];
			this.#normalizeChannelsSort(this.#channels, this.#channelsSort);
			this.#sortChannels(this.#channels);
			this.#bindElement = this.#resolveBindElement(options.bindElement);
			this.subscribeFromOptions(options.events ?? {});
		}
		isShown() {
			return Boolean(this.#popup?.isShown());
		}
		show() {
			this.#popup ??= this.#buildPopup();
			this.#popup.show();
		}
		close() {
			this.#popup?.close();
		}
		destroy() {
			this.#popup?.destroy();
			this.unsubscribeAll();
			this.#popup = null;
			main_core.Runtime.destroy(this);
		}
		#resolveBindElement(bindElement) {
			if (main_core.Type.isDomNode(bindElement)) {
				return bindElement;
			}
			if (main_core.Type.isStringFilled(bindElement)) {
				return document.querySelector(bindElement);
			}
			return null;
		}
		#buildPopup() {
			return new main_popup.Popup({
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
					}
				}
			});
		}
		#renderContent() {
			const container = main_core.Tag.render`<div class="messageservice-channel-selector"></div>`;
			main_core.Dom.append(this.#renderBody(), container);
			if (main_core.Type.isArrayFilled(this.#promoBanners)) {
				main_core.Dom.append(this.#renderBanners(), container);
			}
			main_core.Dom.append(this.#renderFooter(), container);
			return container;
		}
		#renderBody() {
			return main_core.Tag.render`
			<div class="messageservice-channel-selector-body">
				<div class="messageservice-channel-selector-title">${main_core.Loc.getMessage('MESSAGESERVICE_CHANNEL_SELECTOR_ALL_CHANNELS')}</div>
				<div class="messageservice-channel-selector-list">${this.#renderVisibleChannels()}</div>
			</div>
		`;
		}
		#renderVisibleChannels() {
			const visible = this.#channels.filter(channel => !this.#isHidden(channel));
			return visible.map(channel => this.#renderChannel(channel));
		}
		#renderChannel(channel) {
			const icon = new ui_iconSet_api_core.Icon({
				icon: channel.appearance.icon.title,
				color: channel.appearance.icon.color
			});
			const onClick = () => {
				channel.onclick?.(channel);
			};
			const contentContainer = main_core.Tag.render`
			<div class="messageservice-channel-selector-content">
				<div
					class="
						messageservice-channel-selector-item-title
						messageservice-channel-selector-ellipsis
					"
					title="${main_core.Text.encode(channel.appearance.title)}"
				>${main_core.Text.encode(channel.appearance.title)}</div>
			</div>
		`;
			if (main_core.Type.isStringFilled(channel.appearance.subtitle)) {
				main_core.Dom.append(main_core.Tag.render`
					<div
						class="
							messageservice-channel-selector-item-subtitle
							messageservice-channel-selector-ellipsis
						"
						title="${main_core.Text.encode(channel.appearance.subtitle)}"
					>${main_core.Text.encode(channel.appearance.subtitle)}</div>
				`, contentContainer);
			}
			return main_core.Tag.render`
			<div class="messageservice-channel-selector-item" onclick="${onClick}">
				<div
					class="messageservice-channel-selector-icon"
					style="background: ${main_core.Text.encode(channel.appearance.icon.background)};"
				>${icon.render()}</div>
				${contentContainer}
			</div>
		`;
		}
		#normalizeChannelsSort(channels, channelsSort) {
			for (const channel of channels) {
				if (!channelsSort.some(x => x.channelId === channel.id)) {
					channelsSort.unshift({
						channelId: channel.id,
						isHidden: false
					});
				}
			}
			this.#ensureMaxVisibleChannels(channelsSort);
			this.#ensureMinVisibleChannels(channelsSort);
		}
		#isHidden(channel) {
			const position = this.#channelsSort.find(x => x.channelId === channel.id);
			if (!position) {
				throw new Error(`Position not found for channel: ${channel.id}`);
			}
			return position.isHidden;
		}
		#sortChannels(channels) {
			// unknown channels go up, assuming they are new
			channels.sort((a, b) => {
				const positionA = this.#channelsSort.find(x => x.channelId === a.id);
				const positionB = this.#channelsSort.find(x => x.channelId === b.id);
				if (!positionA && !positionB) {
					return 0;
				}
				if (!positionA && positionB) {
					return -1;
				}
				if (positionA && !positionB) {
					return 1;
				}
				if (!positionA.isHidden && positionB.isHidden) {
					return -1;
				}
				if (positionA.isHidden && !positionB.isHidden) {
					return 1;
				}
				return this.#channelsSort.indexOf(positionA) - this.#channelsSort.indexOf(positionB);
			});
		}
		#renderBanners() {
			const banners = this.#promoBanners.map(options => this.#renderSingleBanner(options));
			return main_core.Tag.render`
			<div class="messageservice-channel-selector-banner-container">
				<div class="messageservice-channel-selector-banner-list">${banners}</div>
			</div>
		`;
		}
		#renderSingleBanner(banner) {
			let icon = null;
			if (main_core.Type.isStringFilled(banner.customIconName) && /^[\w-]+$/.test(banner.customIconName)) {
				const url = `/bitrix/js/messageservice/channel/selector/images/custom-icons/${main_core.Text.encode(banner.customIconName)}.svg`;
				icon = main_core.Tag.render`
				<div class="messageservice-channel-selector-icon">
					<img alt="${main_core.Text.encode(banner.title)}" src="${url}">
				</div>
			`;
			} else if (main_core.Type.isPlainObject(banner.icon)) {
				const iconApi = new ui_iconSet_api_core.Icon({
					icon: banner.icon.title,
					color: banner.icon.color
				});
				icon = main_core.Tag.render`
				<div
					class="messageservice-channel-selector-icon"
					style="background: ${main_core.Text.encode(banner.icon.background)};"
				>${iconApi.render()}</div>
			`;
			} else {
				throw new TypeError('Banner icon is not defined');
			}
			const button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('MESSAGESERVICE_CHANNEL_SELECTOR_CONNECT'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.SMALL,
				onclick: () => {
					void this.#openPromoBanner(banner);
				}
			});
			return main_core.Tag.render`
			<div class="messageservice-channel-selector-item" style="background: ${main_core.Text.encode(banner.background)};">
				${icon}
				<div class="messageservice-channel-selector-content">
					<div
						class="
							messageservice-channel-selector-item-title
							messageservice-channel-selector-ellipsis
						"
						title="${main_core.Text.encode(banner.title)}"
					>${main_core.Text.encode(banner.title)}</div>
					<div
						class="
							messageservice-channel-selector-item-subtitle
							messageservice-channel-selector-ellipsis
						"
						title="${main_core.Text.encode(banner.subtitle)}"
					>${main_core.Text.encode(banner.subtitle)}</div>
				</div>
				<div class="messageservice-channel-selector-banner-link">${button.render()}</div>
			</div>
		`;
		}
		#renderFooter() {
			const addButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('MESSAGESERVICE_CHANNEL_SELECTOR_ADD_CHANNEL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.ButtonSize.SMALL,
				icon: ui_iconSet_api_core.Outline.PLUS_L,
				onclick: () => {
					void this.#openAddChannel();
				}
			});
			const configureButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('MESSAGESERVICE_CHANNEL_SELECTOR_CONFIGURE'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.ButtonSize.SMALL,
				icon: ui_iconSet_api_core.Outline.SETTINGS,
				onclick: () => {
					this.#enterEditMode();
				}
			});
			return main_core.Tag.render`
			<div class="messageservice-channel-selector-footer">
				${addButton.render()}
				${configureButton.render()}
			</div>
		`;
		}
		async #openAddChannel() {
			const event = new main_core_events.BaseEvent();
			// maybe caller will want to do something else
			// wait until caller is done
			await this.emitAsync('onBeforeAddChannelOpen', event);
			if (event.isDefaultPrevented()) {
				return;
			}
			const url = main_core.Extension.getSettings(EXTENSION_NAME).get('contactCenterUrl');
			if (!main_core.Type.isStringFilled(url)) {
				return;
			}
			await this.#openSlider(url);
			this.emit('onAfterAddChannelClose');
		}
		async #openPromoBanner(banner) {
			const eventData = {
				banner
			};
			const event = new main_core_events.BaseEvent({
				data: eventData
			});
			// maybe caller will want to do something else
			// wait until caller is done
			await this.emitAsync('onBeforePromoBannerSliderOpen', event);
			if (event.isDefaultPrevented()) {
				return;
			}
			const slider = await this.#openSlider(banner.connectionUrl, {
				width: 700
			});
			this.emit('onAfterPromoBannerSliderClose', {
				...eventData,
				connectStatus: slider.getData().get('status')
			});
		}
		#openSlider(url, options = null) {
			const preparedUrl = String(url);
			if (!main_core.Type.isStringFilled(preparedUrl)) {
				return Promise.resolve();
			}
			let preparedOptions = main_core.Type.isPlainObject(options) ? options : {};
			preparedOptions = {
				cacheable: false,
				allowChangeHistory: true,
				events: {},
				...preparedOptions
			};
			return main_core.Runtime.loadExtension('main.sidepanel').then(({
				SidePanel
			}) => {
				return new Promise(resolve => {
					preparedOptions.events.onClose = event => resolve(event.getSlider());
					SidePanel.Instance.open(preparedUrl, preparedOptions);
				});
			});
		}
		#enterEditMode() {
			const wasShown = this.isShown();
			main_core.Runtime.loadExtension('ui.menu-configurable').then(({
				Menu
			}) => {
				const items = this.#channels.map(channel => {
					const html = main_core.Tag.render`
						<span>
							<span
								class="messageservice-channel-selector-ellipsis"
								title="${main_core.Text.encode(channel.appearance.title)}"
							>${main_core.Text.encode(channel.appearance.title)}</span>
						</span>
					`;
					if (main_core.Type.isStringFilled(channel.appearance.subtitle)) {
						main_core.Dom.append(main_core.Tag.render`
								<span
									class="
										messageservice-channel-selector-edit-item-subtitle
										messageservice-channel-selector-ellipsis
									"
									title="${main_core.Text.encode(channel.appearance.subtitle)}"
								>${main_core.Text.encode(channel.appearance.subtitle)}</span>
							`, html);
					}
					return {
						id: channel.id,
						isHidden: this.#isHidden(channel),
						html
					};
				});

				/** @see BX.UI.MenuConfigurable.Menu */
				const menu = new Menu({
					items,
					bindElement: this.#bindElement,
					maxVisibleItems: this.#getMaxVisibleChannels(),
					maxWidth: 600
				});
				this.close();
				return menu.open();
			}).then(openResult => {
				if (!openResult.isCanceled && main_core.Type.isArray(openResult?.items)) {
					this.#save(openResult.items);
				}
				if (wasShown) {
					this.show();
				}
			}).catch(error => {
				console.error('cant load ui.menu-configurable', error);
			});
		}
		#getMaxVisibleChannels() {
			const settings = main_core.Extension.getSettings(EXTENSION_NAME);
			return main_core.Text.toInteger(settings.get('maxVisibleChannels'));
		}
		#getMinVisibleChannels() {
			const settings = main_core.Extension.getSettings(EXTENSION_NAME);
			return main_core.Text.toInteger(settings.get('minVisibleChannels'));
		}
		#save(editItems) {
			this.#ensureMinVisibleChannels(editItems);
			this.#updateChannelsSort(editItems);
			this.#popup?.setContent(this.#renderContent());
			this.emit('onSave', {
				channelsSort: this.#channelsSort
			});
		}
		#ensureMinVisibleChannels(positions) {
			const visibleCount = positions.filter(item => !item.isHidden).length;
			if (visibleCount >= this.#getMinVisibleChannels()) {
				return;
			}
			const toShow = this.#getMinVisibleChannels() - visibleCount;
			let shown = 0;
			for (const item of positions) {
				if (item.isHidden) {
					item.isHidden = false;
					shown += 1;
				}
				if (shown >= toShow) {
					return;
				}
			}
		}
		#ensureMaxVisibleChannels(positions) {
			const visible = positions.filter(item => !item.isHidden);
			if (visible.length <= this.#getMaxVisibleChannels()) {
				return;
			}
			const toHide = visible.slice(this.#getMaxVisibleChannels(), visible.length);
			for (const item of toHide) {
				item.isHidden = true;
			}
		}
		#updateChannelsSort(editItems) {
			this.#channelsSort = editItems.map(item => {
				return {
					channelId: item.id,
					isHidden: item.isHidden
				};
			});
			this.#normalizeChannelsSort(this.#channels, this.#channelsSort);
			this.#sortChannels(this.#channels);
		}
	}

	exports.Selector = Selector;

})(this.BX.MessageService.Channel.Selector = this.BX.MessageService.Channel.Selector || {}, BX, BX.Event, BX.Main, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=selector.bundle.js.map
