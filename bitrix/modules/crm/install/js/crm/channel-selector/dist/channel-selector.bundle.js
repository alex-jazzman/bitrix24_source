/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_router, main_core, main_core_events, main_loader, main_popup, ui_icons_service, ui_buttons, ui_iconSet_api_core, ui_menuConfigurable) {
	'use strict';

	const CrmActivityEditor = main_core.Reflection.namespace('BX.CrmActivityEditor');
	const UserOptions = main_core.Reflection.namespace('BX.userOptions');
	const NotificationCenter = main_core.Reflection.namespace('BX.UI.Notification.Center');
	const CHANNEL_TYPE_PHONE = 'PHONE';
	const CHANNEL_TYPE_EMAIL = 'EMAIL';
	const CHANNEL_TYPE_IM = 'IM';
	const MAX_VISIBLE_ITEMS = 4;
	const MARKET_LINK = 'category/crm_robot_sms/';
	const LINK_IN_MESSAGE_PLACEHOLDER = '#LINK#';
	const items = new Map();

	/**
	 * @memberof BX.Crm.ChannelSelector
	 */
	class List extends main_core_events.EventEmitter {
		#link;
		isCombineMessageWithLink = true;
		#isInsertLinkInMessage = false;
		#loader;
		#getLinkPromise;
		#menu;
		#menuConfigurable;
		#analytics;
		constructor(parameters) {
			super();
			this.title = main_core.Type.isStringFilled(parameters.title) ? parameters.title : main_core.Loc.getMessage('CRM_CHANNEL_SELECTOR_DEFAULT_TITLE_MSGVER_1');
			this.documentTitle = String(parameters.documentTitle);
			this.body = String(parameters.body);
			this.fullBody = String(parameters.fullBody);
			this.#link = String(parameters.link);
			this.isLinkObtainable = main_core.Text.toBoolean(parameters.isLinkObtainable);
			this.entityTypeId = main_core.Text.toInteger(parameters.entityTypeId);
			this.entityId = main_core.Text.toInteger(parameters.entityId);
			this.id = main_core.Type.isStringFilled(parameters.id) ? parameters.id : this.entityTypeId + '_' + this.entityId + '_' + Math.random().toString().substring(2);
			this.storageTypeId = main_core.Text.toInteger(parameters.storageTypeId);
			this.files = main_core.Type.isArray(parameters.files) ? parameters.files : [];
			this.activityEditorId = String(parameters.activityEditorId);
			this.smsUrl = String(parameters.smsUrl);
			this.isCombineMessageWithLink = main_core.Type.isBoolean(parameters.isCombineMessageWithLink) ? parameters.isCombineMessageWithLink : true;
			this.#isInsertLinkInMessage = main_core.Type.isBoolean(parameters.isInsertLinkInMessage) ? parameters.isInsertLinkInMessage : false;
			this.setChannels(parameters.channels);
			this.communications = main_core.Type.isPlainObject(parameters.communications) ? parameters.communications : {};
			this.hasVisibleChannels = main_core.Text.toBoolean(parameters.hasVisibleChannels);
			this.channelIcons = main_core.Type.isArray(parameters.channelIcons) ? parameters.channelIcons : [];
			this.contactCenterUrl = main_core.Type.isStringFilled(parameters.contactCenterUrl) ? parameters.contactCenterUrl : '/contact_center/';
			this.layout = {
				channels: {}
			};
			this.messageSenderSceneId = String(parameters.messageSenderSceneId);
			this.#analytics = parameters.analytics;
			this.setEventNamespace('BX.Crm.ChannelSelector.List');
			if (items.size === 0) {
				items.set('default', this);
			}
			items.set(this.id, this);
		}
		setChannels(channels) {
			this.channels = [];
			if (main_core.Type.isArray(channels)) {
				channels.forEach(channel => {
					this.channels.push(channel);
				});
			}
			return this;
		}
		render() {
			if (this.layout.container) {
				return this.layout.container;
			}
			this.layout.title = main_core.Tag.render`<div class="crm__channel-selector--title">${main_core.Text.encode(this.title)}</div>`;
			if (this.#link || this.isLinkObtainable) {
				this.layout.link = main_core.Tag.render`<input type="text" class="crm__channel-selector--footer-link-hidden" value="${main_core.Text.encode(this.#link)}" />`;
				const copyLinkButton = new ui_buttons.Button({
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					useAirDesign: true,
					icon: ui_buttons.ButtonIcon.COPY,
					wide: true,
					text: main_core.Loc.getMessage('CRM_CHANNEL_FOOTER_TITLE'),
					onclick: () => this.#handleFooterClick()
				}).getContainer();
				this.layout.footer = main_core.Tag.render`
				<div class="crm__channel-selector--footer">
					${copyLinkButton}
				</div>
			`;
			} else {
				this.layout.footer = null;
			}
			this.layout.settings = null;
			if (this.hasVisibleChannels) {
				const icon = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Outline.SETTINGS,
					size: 19
				}).render();
				this.layout.settings = main_core.Tag.render`<div class="crm__channel-selector--setting-btn" onclick="${this.#handleSettingsClick.bind(this)}">${icon}</div>`;
				this.layout.list = main_core.Tag.render`<div class="crm__channel-selector--list"></div>`;
				this.channels.forEach(channel => {
					const channelNode = this.renderChannel(channel);
					if (channelNode) {
						this.layout.channels[channel.id] = channelNode;
					}
				});
			} else {
				this.layout.list = main_core.Tag.render`<div class="crm__channel-selector--body">
			<div class="crm__channel-selector--networks">
				<div class="crm__channel-selector--networks-title">${main_core.Loc.getMessage('CRM_CHANNEL_SELECTOR_NO_ACTIVE_CHANNELS_TEXT')}</div>
				<div class="crm__channel-selector--networks-block">
					${this.channelIcons.map(icon => main_core.Tag.render`<span class="crm__channel-selector--network-link --${icon}" onclick="${this.#openContactCenter.bind(this)}"></span>`)}
					<span class="crm__channel-selector--network-link --link" onclick="${this.#openContactCenter.bind(this)}">+ 15</span>
				</div>
				<span class="ui-btn ui-btn-xs ui-btn-primary ui-btn-no-caps ui-btn-round" onclick="${this.#openContactCenter.bind(this)};">${main_core.Loc.getMessage('CRM_CHANNEL_SELECTOR_ACTIVATE_CHANNELS')}</span>
			</div>
		</div>`;
			}
			this.layout.container = main_core.Tag.render`<div class="crm__channel-selector--container">
			<div class="crm__channel-selector--header">
				${this.layout.title}
				${this.layout.settings}
			</div>
			${this.layout.list}
		</div>`;
			if (this.layout.footer) {
				this.layout.container.appendChild(this.layout.footer);
			}
			this.adjustAppearance();
			return this.layout.container;
		}
		renderChannel(channel) {
			const channelHandler = () => {
				this.#handleChannelClick(channel);
			};
			const chevronIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CHEVRON_RIGHT_M,
				size: 24,
				color: 'var(--crm-channel-selector-chevron-color)'
			}).render();
			const icon = List.getChannelIcon(channel);
			return main_core.Tag.render`<div 
			class="crm__channel-selector--channel"
			onclick="${channelHandler}"
		>
			${icon ? main_core.Tag.render`<div class="crm__channel-selector--channel-icon ${icon}"></div>` : ''}
			<div class="crm__channel-selector--channel-content">
				${this.renderChannelMainTitle(channel)}
				${this.renderChannelTitle(channel)}
			</div>
			<div class="crm__channel-selector--channel-helper">${chevronIcon}</div>
		</div>`;
		}
		renderChannelMainTitle(channel) {
			return main_core.Tag.render`<div class="crm__channel-selector--channel-main-title">
			${main_core.Text.encode(channel.categoryTitle ?? channel.title)}
		</div>`;
		}
		renderChannelTitle(channel) {
			const text = channel.categoryTitle ? channel.title : channel.status;
			if (!text) {
				return null;
			}
			return main_core.Tag.render`
			<div 
				class="crm__channel-selector--channel-title" 
				style="${channel.type === 'IM' && channel.isAvailable ? 'color: var(--ui-color-accent-main-primary);' : ''}"
			>
				${main_core.Text.encode(text)}
			</div>
		`;
		}
		adjustAppearance() {
			if (this.hasVisibleChannels) {
				main_core.Dom.clean(this.layout.list);
				let allChannelsAreHidden = true;
				this.channels.forEach(channel => {
					const node = this.layout.channels[channel.id];
					if (node) {
						this.layout.list.append(node);
						if (this.#isChannelAvailable(channel)) {
							main_core.Dom.removeClass(node, 'crm__channel-selector--channel-disabled');
						} else {
							main_core.Dom.addClass(node, 'crm__channel-selector--channel-disabled');
						}
						if (channel.isHidden) {
							main_core.Dom.addClass(node, 'crm__channel-selector--channel-hidden');
						} else {
							main_core.Dom.removeClass(node, 'crm__channel-selector--channel-hidden');
							allChannelsAreHidden = false;
						}
					}
				});
				if (allChannelsAreHidden) {
					main_core.Dom.addClass(this.layout.list, '--empty');
				} else {
					main_core.Dom.removeClass(this.layout.list, '--empty');
				}
			}
		}
		#getChannelById(id) {
			return this.channels.find(channel => channel.id === id);
		}
		#isChannelAvailable(channel) {
			if (!channel.isAvailable) {
				return false;
			}
			const hasLink = this.isLinkObtainable || Boolean(this.#link);
			const hasFiles = CrmActivityEditor && this.storageTypeId > 0 && this.files.length > 0;
			if (channel.type === CHANNEL_TYPE_PHONE || channel.type === CHANNEL_TYPE_IM) {
				return hasLink;
			}
			if (channel.type === CHANNEL_TYPE_EMAIL) {
				return hasLink || hasFiles;
			}
			if (channel.type === CHANNEL_TYPE_EMAIL && !CrmActivityEditor?.items[this.activityEditorId]) {
				console.log('Email channel is disabled because the CrmActivityEditor instance is not found');
				return false;
			}
			return channel.isAvailable;
		}
		#getLink() {
			if (this.#link) {
				return Promise.resolve(this.#link);
			}
			if (!this.isLinkObtainable) {
				return Promise.reject();
			}
			if (this.#getLinkPromise) {
				return this.#getLinkPromise;
			}
			this.#getLinkPromise = new Promise((resolve, reject) => {
				this.#showLoader();
				this.emitAsync('getLink').then(result => {
					result.forEach(link => {
						this.setLink(link);
					});
					if (!this.#link) {
						reject();
					} else {
						resolve(this.#link);
					}
				}).catch(reject).finally(() => {
					this.#getLinkPromise = null;
					this.#hideLoader();
				});
			});
			return this.#getLinkPromise;
		}
		#getSignedTemplate(channel) {
			if (channel.signedTemplate) {
				return Promise.resolve(channel.signedTemplate);
			}
			return new Promise((resolve, reject) => {
				this.#showLoader();
				this.emitAsync('getSignedTemplate').then(result => {
					const signedParams = result[0];
					if (!signedParams) {
						reject();
					} else {
						resolve(signedParams);
					}
				}).catch(reject).finally(() => {
					this.#hideLoader();
				});
			});
		}
		#handleFooterClick() {
			this.#getLink().then(link => {
				if (BX.clipboard.isCopySupported() && this.#link) {
					BX.clipboard.copy(link);
				}
				this.#showNotice(main_core.Loc.getMessage('CRM_CHANNEL_PUBLIC_LINK_COPIED_NOTIFICATION_MESSAGE'));
			}).catch(reason => {
				this.#showGetLinkErrorNotification(this.layout.footer, reason);
			});
		}
		#handleSettingsClick() {
			const event = new main_core_events.BaseEvent();
			this.emit('onSettingsClick', event);
			if (event.isDefaultPrevented()) {
				return;
			}
			this.#openMenu();
		}
		#openMenu() {
			this.#getMenu().show();
		}
		#getMenuItemsInViewMode() {
			const settingsItems = [];
			this.channels.forEach(channel => {
				if (channel.isHidden) {
					settingsItems.push({
						text: channel.title,
						id: channel.id,
						onclick: () => {
							this.#handleChannelClick(channel);
						}
					});
				}
			});
			settingsItems.push({
				delimiter: true
			});
			settingsItems.push({
				text: main_core.Loc.getMessage('CRM_CHANNEL_SELECTOR_CHOOSE_FROM_MARKET'),
				id: 'market',
				href: main_core.Loc.getMessage('MARKET_BASE_PATH') + MARKET_LINK,
				onclick: (event, item) => {
					const menu = item.getMenuWindow()?.getRootMenuWindow() || item.getMenuWindow();
					menu?.close();
				}
			});
			settingsItems.push({
				delimiter: true
			});
			settingsItems.push({
				text: main_core.Loc.getMessage('CRM_COMMON_ACTION_CONFIG'),
				id: 'configure',
				onclick: this.#switchMenuToEditMode.bind(this)
			});
			return settingsItems;
		}
		#getMenu() {
			if (!this.#menu) {
				this.#menu = main_popup.MenuManager.create({
					id: this.id + '-settings-popup',
					bindElement: this.layout.settings,
					items: this.#getMenuItemsInViewMode()
				});
			}
			return this.#menu;
		}
		#switchMenuToEditMode() {
			this.#getMenu().close();
			this.#getMenuConfigurable().open().then(result => {
				if (result.isCanceled) {
					return;
				}
				if (main_core.Type.isArray(result.items)) {
					this.#saveSettings(result.items);
					this.#openMenu();
				}
			});
		}
		#saveSettings(items) {
			const channels = [];
			items.forEach(item => {
				const channel = this.#getChannelById(item.id);
				if (channel) {
					channel.isHidden = item.isHidden;
					channels.push(channel);
				}
			});
			this.setChannels(channels);
			this.adjustAppearance();
			this.#menu.destroy();
			this.#menu = null;
			UserOptions.save("crm", "channel-selector", "items", JSON.stringify(items));
		}
		#switchMenuToViewMode() {
			this.#menuConfigurable?.close();
			this.#getMenu().show();
		}
		#getMenuItemsInEditMode() {
			const items = [];
			this.channels.forEach(channel => {
				items.push({
					text: channel.title,
					id: channel.id,
					isHidden: channel.isHidden
				});
			});
			return items;
		}
		#getMenuConfigurable() {
			const items = this.#getMenuItemsInEditMode();
			if (!this.#menuConfigurable) {
				this.#menuConfigurable = new ui_menuConfigurable.Menu({
					items,
					bindElement: this.layout.settings,
					maxVisibleItems: MAX_VISIBLE_ITEMS
				});
				this.#menuConfigurable.subscribe('Cancel', () => {
					this.#openMenu();
				});
			} else {
				this.#menuConfigurable.setItems(items);
			}
			return this.#menuConfigurable;
		}
		#showGetLinkErrorNotification(bindElement, text) {
			if (!main_core.Type.isStringFilled(text)) {
				text = main_core.Loc.getMessage('CRM_CHANNEL_PUBLIC_LINK_NOT_AVAILABLE_NOTIFICATION_MESSAGE');
			}
			this.#showNotice(text);
		}
		#showNotice(content) {
			if (NotificationCenter) {
				NotificationCenter.notify({
					content
				});
			}
		}
		#handleChannelClick(channel) {
			const event = new main_core_events.BaseEvent();
			event.setData({
				channel,
				communications: this.communications[channel.type]
			});
			this.emit('onChannelClick', event);
			if (event.isDefaultPrevented()) {
				return;
			}
			if (!this.#isChannelAvailable(channel)) {
				return;
			}
			if (channel.type === CHANNEL_TYPE_EMAIL) {
				this.sendEmail(channel);
				return;
			}
			if (channel.type === CHANNEL_TYPE_PHONE) {
				this.sendSms(channel);
				return;
			}
			if (channel.type === CHANNEL_TYPE_IM) {
				this.openMessenger(channel);
			}
		}
		setFiles(files) {
			this.files = main_core.Type.isArray(files) ? files : [];
			this.adjustAppearance();
			return this;
		}
		setLink(link) {
			this.#link = link ?? null;
			this.adjustAppearance();
			return this;
		}
		sendEmail(channel) {
			if (this.files.length <= 0 || Number(this.storageTypeId) <= 0) {
				const channelNode = this.layout.channels[channel.id];
				this.#getLink().then(link => {
					CrmActivityEditor?.items[this.activityEditorId]?.addEmail({
						subject: this.documentTitle,
						body: main_core.Loc.getMessage('CRM_CHANNEL_SELECTOR_MESSAGE_WITH_LINK', {
							'#MESSAGE#': this.documentTitle,
							'#LINK#': link
						})
					});
				}).catch(reason => {
					this.#showGetLinkErrorNotification(channelNode, reason);
				});
			} else {
				CrmActivityEditor?.items[this.activityEditorId]?.addEmail({
					subject: this.documentTitle,
					diskfiles: this.files,
					storageTypeID: this.storageTypeId
				});
			}
		}
		sendSms(channel) {
			const channelNode = this.layout.channels[channel.id];
			if (!this.smsUrl) {
				this.#showGetLinkErrorNotification(channelNode, 'No sms url');
				return;
			}
			this.#getLink().then(link => {
				const requestParams = {
					entityTypeId: this.entityTypeId,
					entityId: this.entityId,
					text: this.#getSmsText(channel, link),
					providerId: channel.id,
					isProviderFixed: 'N',
					canUseBitrix24Provider: 'Y',
					messageSenderSceneId: this.messageSenderSceneId,
					analytics: this.#analytics
				};
				this.#getSignedTemplate(channel).then(signedTemplate => {
					if (signedTemplate) {
						requestParams.signedTemplate = signedTemplate;
						requestParams.isEditable = 'N';
					}
				}).catch().finally(() => {
					crm_router.Router.openSlider(this.smsUrl, {
						width: 900,
						requestMethod: 'post',
						requestParams
					});
				});
			}).catch(reason => {
				this.#showGetLinkErrorNotification(channelNode, reason);
			});
		}
		#getSmsText(channel, link) {
			const message = channel.id === 'bitrix24' && this.fullBody ? this.fullBody : this.body;
			if (this.isCombineMessageWithLink) {
				return main_core.Loc.getMessage('CRM_CHANNEL_SELECTOR_MESSAGE_WITH_LINK', {
					'#MESSAGE#': message,
					'#LINK#': link
				});
			}
			if (this.#isInsertLinkInMessage) {
				return message.replace(LINK_IN_MESSAGE_PLACEHOLDER, link);
			}
			return message;
		}
		openMessenger(channel) {
			if (!top.BXIM) {
				return;
			}
			if (!this.communications[channel.type]) {
				return;
			}
			top.BXIM.openMessenger(this.communications[channel.type].VALUE, {
				RECENT: "N",
				MENU: "N"
			});
		}
		#openContactCenter() {
			crm_router.Router.openSlider(this.contactCenterUrl).then(() => {
				location.reload();
			});
		}
		getId() {
			return this.id;
		}
		static getDefault() {
			return items.get('default');
		}
		static getById(id) {
			return items.get(id);
		}
		#showLoader() {
			const loader = this.#getLoader();
			if (loader) {
				loader.show(this.layout.container);
			}
		}
		#hideLoader() {
			const loader = this.#getLoader();
			if (loader) {
				loader.hide();
			}
		}
		#getLoader() {
			if (!this.#loader && main_loader.Loader) {
				this.#loader = new main_loader.Loader({
					size: 100,
					offset: {
						left: "35%",
						top: "-25%"
					}
				});
			}
			return this.#loader;
		}
		static getChannelIcon(channel) {
			return channel.icon || List.getIconByChannelId(channel.id);
		}
		static getIconByChannelId(id) {
			if (id === 'bitrix24') {
				return '--service-bitrix24';
			}
			if (id === CHANNEL_TYPE_EMAIL) {
				return '--service-email';
			}
			if (id === CHANNEL_TYPE_IM) {
				return '--service-livechat';
			}
			if (id === 'twilio') {
				return '--service-whatsapp';
			}
			if (id === 'ednaru' || id === 'ednaruimhpx') {
				return '--service-edna';
			}
			return '--service-sms';
		}
	}

	exports.List = List;

})(this.BX.Crm.ChannelSelector = this.BX.Crm.ChannelSelector || {}, BX.Crm, BX, BX.Event, BX, BX.Main, BX, BX.UI, BX.UI.IconSet, BX.UI.MenuConfigurable);
//# sourceMappingURL=channel-selector.bundle.js.map
