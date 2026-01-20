import { Builder, Dictionary } from 'crm.integration.analytics';
import { Dom, Event, Loc, Reflection, Runtime, Tag, Text } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { sendData } from 'ui.analytics';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Icon, Main } from 'ui.icon-set.api.core';

const namespace = Reflection.namespace('BX.Crm');

type Page = {
	id: string,
	title: string,
	sections: Section[],
}

type Section = {
	title: string,
	description: string,
	color: string,
	channels: Channel[],
	iconPath: string,
}

type Channel = {
	id: string,
	type: string,
	appearance: Appearance,
	isConnected: boolean,
	connectionUrl: string,
	isPromo: boolean,
	isTemplatesBased: boolean,
	isLocked: boolean,
	sliderCode: string,
}

type Appearance = {
	icon: ChannelIcon,
	title: string,
	subtitle: string,
	description: string,
}

type ChannelIcon = {
	title: string,
	color: string,
	background: string,
}

class MessageSenderConnectionsComponent
{
	#pages: Map<string, Page>;
	#currentPage: string;
	#targetNodeId: string;
	#container: HTMLElement;
	#contactCenterUrl: string;
	#analytics: Object;

	constructor(params)
	{
		this.#pages = new Map(params.slider.pages.map((item) => [item.id, item]));
		this.#currentPage = params.currentPage;
		this.#targetNodeId = params.targetNodeId;
		this.#contactCenterUrl = params.contactCenterUrl;
		this.#analytics = params.analytics ?? {};
	}

	init()
	{
		this.#container = document.getElementById(this.#targetNodeId);

		if (this.#container)
		{
			this.#draw();
		}
	}

	#draw()
	{
		Dom.append(this.#getContent(), this.#container);
	}

	#redraw()
	{
		Dom.clean(this.#container);
		this.#draw();
	}

	#getContent(): HTMLElement
	{
		return Tag.render`
			<div>
				${this.#getNavBar()}
				${this.#getPage(this.#getCurrentPage())}
				${this.#getFooter()}
			</div>
		`;
	}

	#getCurrentPage(): Page
	{
		return this.#pages.get(this.#currentPage);
	}

	#getNavBar(): HTMLElement
	{
		const navBar = Tag.render`
			<div class="crm-message-sender-connections-tab-navigation"></div>
		`;

		this.#addNavBarButtons(navBar);

		return navBar;
	}

	#addNavBarButtons(node: HTMLElement): HTMLElement
	{
		this.#pages.forEach((page, id) => {
			(new Button({
				size: ButtonSize.SMALL,
				style: id === this.#currentPage ? AirButtonStyle.SELECTION : AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				text: page.title,
				onclick: () => {
					if (id === this.#currentPage)
					{
						return;
					}

					this.#currentPage = page.id;
					this.#redraw();
				},
			})).renderTo(node);
		});

		(new Button({
			size: ButtonSize.SMALL,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			useAirDesign: true,
			text: Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_TAB_NAV_ALL_CONNECTION'),
			onclick: () => {
				SidePanel.Instance.open(this.#contactCenterUrl);
				this.#sendConnectEvent('contactCenter');
			},
		})).renderTo(node);

		(new Button({
			size: ButtonSize.SMALL,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			useAirDesign: true,
			text: Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_TAB_NAV_MARKET'),
			onclick: () => {
				SidePanel.Instance.open('/market/category/crm_robot_sms/');
			},
		})).renderTo(node);
	}

	#getPage(page: Page): HTMLElement
	{
		if (page.id === 'recommendations')
		{
			return Tag.render`
				<div class="crm-message-sender-connections-page-recommendation">
					${page.sections.map((section) => this.#getRecommendationSection(section))}
				</div>
			`;
		}

		const pageHtml = Tag.render`
			<div class="crm-message-sender-connections-page"></div>
		`;

		for (let i = 0; i < page.sections.length; i++)
		{
			const section = page.sections[i];

			for (let j = 0; j < section.channels.length; j++)
			{
				const channel = section.channels[j];

				Dom.append(this.#getSection(section, channel), pageHtml);
			}
		}

		return pageHtml;
	}

	#getSection(section: Section, channel: Channel): HTMLElement
	{
		const sectionHtml = Tag.render`
			<div class="crm-message-sender-connections-section-default" style="background: ${Text.encode(section.color)}">
				${channel.isConnected ? this.#getChannelStatusConnected() : ''}
				<div class="crm-message-sender-connections-section-default-image">
					<div><img alt="${Text.encode(section.title)}" src="${Text.encode(section.iconPath)}"></div>
				</div>
				<div class="crm-message-sender-connections-section-channel-default-title" style="${channel.isConnected ? 'color: var(--ui-color-base-8)' : ''}">
					${Text.encode(section.title)}
				</div>
			</div>
		`;
		Event.bind(sectionHtml, 'click', () => this.#openConnectionSlider(channel));

		return sectionHtml;
	}

	#getChannelStatusConnected(): HTMLElement
	{
		const icon = (new Icon({
			icon: Main.CHECK,
			size: 16,
			color: '#fff',
		})).render();

		return Tag.render`
			<div class="crm-message-sender-connections-section-channel-status-connected">${icon}</div>
		`;
	}

	#getRecommendationSection(section: Section): HTMLElement
	{
		return Tag.render`
			<div class="crm-message-sender-connections-section" style="background: ${section.color}">
				${this.#getSectionHeader(section)}
				<div class="crm-message-sender-connections-section-channel-container">
					${section.channels.map((channel) => this.#getChanel(channel))}
				</div>
			</div>
		`;
	}

	#getSectionHeader(section: Section): HTMLElement
	{
		const title = section.iconPath
			? Tag.render`<img src="${section.iconPath}">`
			: section.title;

		if (!section.description)
		{
			return Tag.render`
				<header class="crm-message-sender-connections-section-header">
					<div class="crm-message-sender-connections-section-icon">${Text.encode(title)}</div>
				</header>
			`;
		}

		return Tag.render`
			<header class="crm-message-sender-connections-section-header">
				<div class="crm-message-sender-connections-section-title">${Text.encode(title)}</div>
				<div class="crm-message-sender-connections-section-description">${Text.encode(section.description)}</div>
			</header>
		`;
	}

	#getChanel(channel: Channel): HTMLElement
	{
		return Tag.render`
			<div class="crm-message-sender-connections-channel">
				<div class="crm-message-sender-connections-channel-header">
					<div class="crm-message-sender-connections-channel-header-icon" style="background: ${
						Text.encode(channel.appearance.icon.background)
					}">
						${this.#getChanelIcon(channel.appearance.icon)}
					</div>
					${this.#getConnectionButton(channel)}
				</div>
				<div class="crm-message-sender-connections-channel-content">
					<div class="crm-message-sender-connections-channel-content-title">
						<div class="crm-message-sender-connections-channel-content-title-text" title="${
							Text.encode(channel.appearance.title)
						}">
							${Text.encode(channel.appearance.title)}
						</div>
						${this.#getChannelStatus(channel)}
					</div>
					<div class="crm-message-sender-connections-channel-content-description">${Text.encode(channel.appearance.description)}</div>
				</div>
			</div>
		`;
	}

	#getChannelStatus(channel: Channel): ?HTMLElement
	{
		if (!channel.isConnected)
		{
			return null;
		}

		return Tag.render`
			<div class="crm-message-sender-connections-channel-status">
				${Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_STATUS')}
			</div>
		`;
	}

	#getChanelIcon(icon: ChannelIcon): HTMLElement
	{
		return (new Icon({
			icon: icon.title,
			size: 62,
			color: icon.color,
		})).render();
	}

	#getConnectionButton(channel: Channel): HTMLElement
	{
		return (new Button({
			size: ButtonSize.LARGE,
			style: channel.isConnected ? AirButtonStyle.OUTLINE : AirButtonStyle.FILLED,
			useAirDesign: true,
			text: channel.isConnected
				? Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_SETTING_BUTTON')
				: Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_CONNECTION_BUTTON'),
			onclick: () => {
				this.#openConnectionSlider(channel);
			},
		})).getContainer();
	}

	#openConnectionSlider(channel): void
	{
		let promise = null;

		if (channel.isLocked)
		{
			promise = Runtime.loadExtension('ui.info-helper').then(({ FeaturePromotersRegistry }) => {
				FeaturePromotersRegistry.getPromoter({ code: channel.sliderCode }).show();

				return { status: 'locked' };
			});
		}
		else
		{
			promise = Runtime.loadExtension('crm.router').then(({ Router }) => {
				return Router.openSlider(channel.connectionUrl).then().catch().finally(() => window.location.reload());
			}).then((slider: BX.SidePanel.Slider) => {
				return {
					status: slider.getData().get('status'),
				};
			});
		}

		if (!channel.isConnected)
		{
			void promise.then(({ status }) => {
				this.#sendConnectEvent(channel.id, status);
			});
		}
	}

	#sendConnectEvent(channelId: string, connectStatus: string)
	{
		const analyticsData = (new Builder.Communication.Channel.ConnectEvent())
			.setChannelId(channelId)
			.setConnectStatus(connectStatus)
			.setSubSection(Dictionary.SUB_SECTION_CONNECTION_SLIDER)
			.setSection(this.#analytics.c_section)
			.buildData();

		sendData(analyticsData);
	}

	#getFooter(): HTMLElement
	{
		const button = (new Button({
			size: ButtonSize.EXTRA_LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			text: Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_FOOTER_BUTTON_ALL_CONNECTION'),
			onclick: () => {
				SidePanel.Instance.open(this.#contactCenterUrl);
				this.#sendConnectEvent('contactCenter');
			},
		})).getContainer();

		return Tag.render`
			<div class="crm-message-sender-connections-footer">${button}</div>
		`;
	}
}

namespace.MessageSenderConnectionsComponent = MessageSenderConnectionsComponent;
