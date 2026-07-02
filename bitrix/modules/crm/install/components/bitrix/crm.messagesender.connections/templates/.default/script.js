/* eslint-disable */
(function (crm_integration_analytics, main_core, main_sidepanel, ui_analytics, ui_buttons, ui_iconSet_api_core) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm');
	class MessageSenderConnectionsComponent {
		#pages;
		#currentPage;
		#targetNodeId;
		#container;
		#contactCenterUrl;
		#analytics;
		constructor(params) {
			this.#pages = new Map(params.slider.pages.map(item => [item.id, item]));
			this.#currentPage = params.currentPage;
			this.#targetNodeId = params.targetNodeId;
			this.#contactCenterUrl = params.contactCenterUrl;
			this.#analytics = params.analytics ?? {};
		}
		init() {
			this.#container = document.getElementById(this.#targetNodeId);
			if (this.#container) {
				this.#draw();
			}
		}
		#draw() {
			main_core.Dom.append(this.#getContent(), this.#container);
		}
		#redraw() {
			main_core.Dom.clean(this.#container);
			this.#draw();
		}
		#getContent() {
			return main_core.Tag.render`
			<div>
				${this.#getNavBar()}
				${this.#getPage(this.#getCurrentPage())}
				${this.#getFooter()}
			</div>
		`;
		}
		#getCurrentPage() {
			return this.#pages.get(this.#currentPage);
		}
		#getNavBar() {
			const navBar = main_core.Tag.render`
			<div class="crm-message-sender-connections-tab-navigation"></div>
		`;
			this.#addNavBarButtons(navBar);
			return navBar;
		}
		#addNavBarButtons(node) {
			this.#pages.forEach((page, id) => {
				new ui_buttons.Button({
					size: ui_buttons.ButtonSize.SMALL,
					style: id === this.#currentPage ? ui_buttons.AirButtonStyle.SELECTION : ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					useAirDesign: true,
					text: page.title,
					onclick: () => {
						if (id === this.#currentPage) {
							return;
						}
						this.#currentPage = page.id;
						this.#redraw();
					}
				}).renderTo(node);
			});
			new ui_buttons.Button({
				size: ui_buttons.ButtonSize.SMALL,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_TAB_NAV_ALL_CONNECTION'),
				onclick: () => {
					main_sidepanel.SidePanel.Instance.open(this.#contactCenterUrl);
					this.#sendConnectEvent('contactCenter');
				}
			}).renderTo(node);
			new ui_buttons.Button({
				size: ui_buttons.ButtonSize.SMALL,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_TAB_NAV_MARKET'),
				onclick: () => {
					main_sidepanel.SidePanel.Instance.open('/market/category/crm_robot_sms/');
				}
			}).renderTo(node);
		}
		#getPage(page) {
			if (page.id === 'recommendations') {
				return main_core.Tag.render`
				<div class="crm-message-sender-connections-page-recommendation">
					${page.sections.map(section => this.#getRecommendationSection(section))}
				</div>
			`;
			}
			const pageHtml = main_core.Tag.render`
			<div class="crm-message-sender-connections-page"></div>
		`;
			for (let i = 0; i < page.sections.length; i++) {
				const section = page.sections[i];
				for (let j = 0; j < section.channels.length; j++) {
					const channel = section.channels[j];
					main_core.Dom.append(this.#getSection(section, channel), pageHtml);
				}
			}
			return pageHtml;
		}
		#getSection(section, channel) {
			const sectionHtml = main_core.Tag.render`
			<div class="crm-message-sender-connections-section-default" style="background: ${main_core.Text.encode(section.color)}">
				${channel.isConnected ? this.#getChannelStatusConnected() : ''}
				<div class="crm-message-sender-connections-section-default-image">
					<div><img alt="${main_core.Text.encode(section.title)}" src="${main_core.Text.encode(section.iconPath)}"></div>
				</div>
				<div class="crm-message-sender-connections-section-channel-default-title" style="${channel.isConnected ? 'color: var(--ui-color-base-8)' : ''}">
					${main_core.Text.encode(section.title)}
				</div>
			</div>
		`;
			main_core.Event.bind(sectionHtml, 'click', () => this.#openConnectionSlider(channel));
			return sectionHtml;
		}
		#getChannelStatusConnected() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.CHECK,
				size: 16,
				color: '#fff'
			}).render();
			return main_core.Tag.render`
			<div class="crm-message-sender-connections-section-channel-status-connected">${icon}</div>
		`;
		}
		#getRecommendationSection(section) {
			return main_core.Tag.render`
			<div class="crm-message-sender-connections-section" style="background: ${section.color}">
				${this.#getSectionHeader(section)}
				<div class="crm-message-sender-connections-section-channel-container">
					${section.channels.map(channel => this.#getChanel(channel))}
				</div>
			</div>
		`;
		}
		#getSectionHeader(section) {
			const title = section.iconPath ? main_core.Tag.render`<img src="${section.iconPath}">` : section.title;
			if (!section.description) {
				return main_core.Tag.render`
				<header class="crm-message-sender-connections-section-header">
					<div class="crm-message-sender-connections-section-icon">${main_core.Text.encode(title)}</div>
				</header>
			`;
			}
			return main_core.Tag.render`
			<header class="crm-message-sender-connections-section-header">
				<div class="crm-message-sender-connections-section-title">${main_core.Text.encode(title)}</div>
				<div class="crm-message-sender-connections-section-description">${main_core.Text.encode(section.description)}</div>
			</header>
		`;
		}
		#getChanel(channel) {
			return main_core.Tag.render`
			<div class="crm-message-sender-connections-channel">
				<div class="crm-message-sender-connections-channel-header">
					<div class="crm-message-sender-connections-channel-header-icon" style="background: ${main_core.Text.encode(channel.appearance.icon.background)}">
						${this.#getChanelIcon(channel.appearance.icon)}
					</div>
					${this.#getConnectionButton(channel)}
				</div>
				<div class="crm-message-sender-connections-channel-content">
					<div class="crm-message-sender-connections-channel-content-title">
						<div class="crm-message-sender-connections-channel-content-title-text" title="${main_core.Text.encode(channel.appearance.title)}">
							${main_core.Text.encode(channel.appearance.title)}
						</div>
						${this.#getChannelStatus(channel)}
					</div>
					<div class="crm-message-sender-connections-channel-content-description">${main_core.Text.encode(channel.appearance.description)}</div>
				</div>
			</div>
		`;
		}
		#getChannelStatus(channel) {
			if (!channel.isConnected) {
				return null;
			}
			return main_core.Tag.render`
			<div class="crm-message-sender-connections-channel-status">
				${main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_STATUS')}
			</div>
		`;
		}
		#getChanelIcon(icon) {
			return new ui_iconSet_api_core.Icon({
				icon: icon.title,
				size: 62,
				color: icon.color
			}).render();
		}
		#getConnectionButton(channel) {
			return new ui_buttons.Button({
				size: ui_buttons.ButtonSize.LARGE,
				style: channel.isConnected ? ui_buttons.AirButtonStyle.OUTLINE : ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				text: channel.isConnected ? main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_SETTING_BUTTON') : main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_CONNECTION_BUTTON'),
				onclick: () => {
					this.#openConnectionSlider(channel);
				}
			}).getContainer();
		}
		#openConnectionSlider(channel) {
			let promise = null;
			if (channel.isLocked) {
				promise = main_core.Runtime.loadExtension('ui.info-helper').then(({
					FeaturePromotersRegistry
				}) => {
					FeaturePromotersRegistry.getPromoter({
						code: channel.sliderCode
					}).show();
					return {
						status: 'locked'
					};
				});
			} else {
				promise = main_core.Runtime.loadExtension('crm.router').then(({
					Router
				}) => {
					return Router.openSlider(channel.connectionUrl).then().catch().finally(() => window.location.reload());
				}).then(slider => {
					return {
						status: slider.getData().get('status')
					};
				});
			}
			if (!channel.isConnected) {
				void promise.then(({
					status
				}) => {
					this.#sendConnectEvent(channel.id, status);
				});
			}
		}
		#sendConnectEvent(channelId, connectStatus) {
			const analyticsData = new crm_integration_analytics.Builder.Communication.Channel.ConnectEvent().setChannelId(channelId).setConnectStatus(connectStatus).setSubSection(crm_integration_analytics.Dictionary.SUB_SECTION_CONNECTION_SLIDER).setSection(this.#analytics.c_section).buildData();
			ui_analytics.sendData(analyticsData);
		}
		#getFooter() {
			const button = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.EXTRA_LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_FOOTER_BUTTON_ALL_CONNECTION'),
				onclick: () => {
					main_sidepanel.SidePanel.Instance.open(this.#contactCenterUrl);
					this.#sendConnectEvent('contactCenter');
				}
			}).getContainer();
			return main_core.Tag.render`
			<div class="crm-message-sender-connections-footer">${button}</div>
		`;
		}
	}
	namespace.MessageSenderConnectionsComponent = MessageSenderConnectionsComponent;

})(BX.Crm.Integration.Analytics, BX, BX.SidePanel, BX.UI.Analytics, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=script.js.map
