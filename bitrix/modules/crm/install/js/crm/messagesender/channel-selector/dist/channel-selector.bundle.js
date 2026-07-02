/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.MessageSender = this.BX.Crm.MessageSender || {};
(function (exports, main_core, main_core_events, main_popup, ui_buttons, ui_iconSet_api_core) {
	'use strict';

	/**
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onShow
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onClose
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onDestroy
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onSave
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onConnectionsSliderClose
	 * @emits BX.Crm.MessageSender.ChannelSelector.Selector:onPromoBannerSliderClose
	 */
	class Selector extends main_core_events.EventEmitter {
		#bindElement;
		#items;
		#banners;
		#itemsSort;
		#analytics;
		#popup;
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Crm.MessageSender.ChannelSelector.Selector');
			this.#items = main_core.Type.isArray(options.items) ? options.items : [];
			this.#banners = main_core.Type.isArray(options.banners) ? options.banners : [];
			this.#itemsSort = main_core.Type.isArray(options.itemsSort) ? options.itemsSort : [];
			this.#normalizeItemsSort(this.#items, this.#itemsSort);
			this.#sortItems(this.#items);
			this.#bindElement = main_core.Type.isDomNode(options.bindElement) ? options.bindElement : null;
			this.#analytics = main_core.Type.isPlainObject(options.analytics) ? options.analytics : null;
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
			const container = main_core.Tag.render`<div class="crm-messagesender-channel-selector"></div>`;
			main_core.Dom.append(this.#renderBody(), container);
			if (main_core.Type.isArrayFilled(this.#banners)) {
				main_core.Dom.append(this.#renderBanners(), container);
			}
			main_core.Dom.append(this.#renderFooter(), container);
			return container;
		}
		#renderBody() {
			return main_core.Tag.render`
			<div class="crm-messagesender-channel-selector-body">
				<div class="crm-messagesender-channel-selector-title">${main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_ALL_CHANNELS')}</div>
				<div class="crm-messagesender-channel-selector-list">${this.#renderVisibleItems()}</div>
			</div>
		`;
		}
		#renderVisibleItems() {
			const visible = this.#items.filter(item => !this.#isHidden(item));
			return visible.map(options => this.#renderItem(options));
		}
		#renderItem(options) {
			const icon = new ui_iconSet_api_core.Icon({
				icon: options.appearance.icon.title,
				color: options.appearance.icon.color
			});
			const onClick = () => {
				options.onclick?.(options);
			};
			const contentContainer = main_core.Tag.render`
			<div class="crm-messagesender-channel-selector-content">
				<div
					class="
						crm-messagesender-channel-selector-item-title
						crm-messagesender-channel-selector-ellipsis
					"
					title="${main_core.Text.encode(options.appearance.title)}"
				>${main_core.Text.encode(options.appearance.title)}</div>
			</div>
		`;
			if (main_core.Type.isStringFilled(options.appearance.subtitle)) {
				main_core.Dom.append(main_core.Tag.render`
					<div
						class="
							crm-messagesender-channel-selector-item-subtitle 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${main_core.Text.encode(options.appearance.subtitle)}"
					>${main_core.Text.encode(options.appearance.subtitle)}</div>
				`, contentContainer);
			}
			return main_core.Tag.render`
			<div class="crm-messagesender-channel-selector-item" onclick="${onClick}">
				<div
					class="crm-messagesender-channel-selector-icon"
					style="background: ${main_core.Text.encode(options.appearance.icon.background)};"
				>${icon.render()}</div>
				${contentContainer}
			</div>
		`;
		}
		#normalizeItemsSort(items, itemsSort) {
			for (const item of items) {
				if (!itemsSort.some(x => x.channelId === item.id)) {
					itemsSort.unshift({
						channelId: item.id,
						isHidden: false
					});
				}
			}
			this.#ensureMaxVisibleChannels(itemsSort);
			this.#ensureMinVisibleChannels(itemsSort);
		}
		#isHidden(item) {
			const position = this.#itemsSort.find(x => x.channelId === item.id);
			if (!position) {
				throw new Error(`Position not found for item: ${item.id}`);
			}
			return position.isHidden;
		}
		#sortItems(items) {
			items.sort((a, b) => {
				const positionA = this.#itemsSort.find(x => x.channelId === a.id);
				const positionB = this.#itemsSort.find(x => x.channelId === b.id);
				if (positionA.isHidden && !positionB.isHidden) {
					return 1;
				}
				if (!positionA.isHidden && positionB.isHidden) {
					return -1;
				}
				const positionIndexA = main_core.Type.isNil(positionA) ? -1 : this.#itemsSort.indexOf(positionA);
				const positionIndexB = main_core.Type.isNil(positionB) ? -1 : this.#itemsSort.indexOf(positionB);
				return positionIndexA - positionIndexB;
			});
		}
		#renderBanners() {
			const banners = this.#banners.map(options => this.#renderSingleBanner(options));
			return main_core.Tag.render`
			<div class="crm-messagesender-channel-selector-banner-container">
				<div class="crm-messagesender-channel-selector-banner-list">${banners}</div>
			</div>
		`;
		}
		#renderSingleBanner(banner) {
			let icon = null;
			if (main_core.Type.isStringFilled(banner.customIconName) && /^[\w-]+$/.test(banner.customIconName)) {
				const url = `/bitrix/js/crm/messagesender/channel-selector/images/custom-icons/${main_core.Text.encode(banner.customIconName)}.svg`;
				icon = main_core.Tag.render`
				<div class="crm-messagesender-channel-selector-icon">
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
					class="crm-messagesender-channel-selector-icon"
					style="background: ${main_core.Text.encode(banner.icon.background)};"
				>${iconApi.render()}</div>
			`;
			} else {
				throw new TypeError('Banner icon is not defined');
			}
			const button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_CONNECT'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.SMALL,
				onclick: async () => {
					const slider = await this.#openSlider(banner.connectionUrl, {
						width: 700
					});
					this.emit('onPromoBannerSliderClose', {
						bannerId: banner.id,
						connectStatus: slider.getData().get('status')
					});
				}
			});
			return main_core.Tag.render`
			<div class="crm-messagesender-channel-selector-item" style="background: ${main_core.Text.encode(banner.background)};">
				${icon}
				<div class="crm-messagesender-channel-selector-content">
					<div
						class="
							crm-messagesender-channel-selector-item-title 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${main_core.Text.encode(banner.title)}"
					>${main_core.Text.encode(banner.title)}</div>
					<div 
						class="
							crm-messagesender-channel-selector-item-subtitle 
							crm-messagesender-channel-selector-ellipsis
						"
						title="${main_core.Text.encode(banner.subtitle)}"
					>${main_core.Text.encode(banner.subtitle)}</div>
				</div>
				<div class="crm-messagesender-channel-selector-banner-link">${button.render()}</div>
			</div>
		`;
		}
		#renderFooter() {
			const addButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_ADD_CHANNEL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.ButtonSize.SMALL,
				icon: ui_iconSet_api_core.Outline.PLUS_L,
				onclick: async () => {
					await this.#openMessageSenderConnectionsSlider();
					this.emit('onConnectionsSliderClose');
				}
			});
			const configureButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CHANNEL_SELECTOR_CONFIGURE'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.ButtonSize.SMALL,
				icon: ui_iconSet_api_core.Outline.SETTINGS,
				onclick: () => {
					this.#enterEditMode();
				}
			});
			return main_core.Tag.render`
			<div class="crm-messagesender-channel-selector-footer">
				${addButton.render()}
				${configureButton.render()}
			</div>
		`;
		}
		async #openMessageSenderConnectionsSlider() {
			const {
				Router
			} = await main_core.Runtime.loadExtension('crm.router');

			/** @see BX.Crm.Router.openMessageSenderConnectionsSlider */
			return Router.Instance.openMessageSenderConnectionsSlider(this.#analytics);
		}

		/**
		 * Resolves when the slider is closed.
		 */
		#openSlider(url, options = null) {
			return main_core.Runtime.loadExtension('crm.router').then(({
				Router
			}) => {
				/** @see BX.Crm.Router.openSlider */
				return Router.openSlider(url, options);
			}).catch(error => {
				console.error('cant load crm.router', error);
				throw error;
			});
		}
		#enterEditMode() {
			const wasShown = this.isShown();
			main_core.Runtime.loadExtension('ui.menu-configurable').then(({
				Menu
			}) => {
				const items = this.#items.map(item => {
					const html = main_core.Tag.render`
						<span>
							<span
								class="crm-messagesender-channel-selector-ellipsis"
								title="${main_core.Text.encode(item.appearance.title)}"
							>${main_core.Text.encode(item.appearance.title)}</span>
						</span>
					`;
					if (main_core.Type.isStringFilled(item.appearance.subtitle)) {
						main_core.Dom.append(main_core.Tag.render`
								<span
									class="
										crm-messagesender-channel-selector-edit-item-subtitle 
										crm-messagesender-channel-selector-ellipsis
									"
									title="${main_core.Text.encode(item.appearance.subtitle)}"
								>${main_core.Text.encode(item.appearance.subtitle)}</span>
							`, html);
					}
					return {
						id: item.id,
						isHidden: this.#isHidden(item),
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
			const settings = main_core.Extension.getSettings('crm.messagesender.channel-selector');
			return main_core.Text.toInteger(settings.get('maxVisibleChannels'));
		}
		#getMinVisibleChannels() {
			const settings = main_core.Extension.getSettings('crm.messagesender.channel-selector');
			return main_core.Text.toInteger(settings.get('minVisibleChannels'));
		}
		#save(editItems) {
			this.#ensureMinVisibleChannels(editItems);
			this.#updateItemsSort(editItems);
			this.#popup?.setContent(this.#renderContent());
			this.emit('onSave', {
				itemsSort: this.#itemsSort
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
		#updateItemsSort(editItems) {
			this.#itemsSort = editItems.map(item => {
				return {
					channelId: item.id,
					isHidden: item.isHidden
				};
			});
			this.#normalizeItemsSort(this.#items, this.#itemsSort);
			this.#sortItems(this.#items);
		}
	}

	exports.Selector = Selector;

})(this.BX.Crm.MessageSender.ChannelSelector = this.BX.Crm.MessageSender.ChannelSelector || {}, BX, BX.Event, BX.Main, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=channel-selector.bundle.js.map
