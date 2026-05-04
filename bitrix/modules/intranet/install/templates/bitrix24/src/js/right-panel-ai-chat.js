import { Dom, Tag, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';

import type { RightPanel } from './right-panel';
import type { RightBar } from './right-bar';
import type { SiteTemplate } from './site-template';

export class RightPanelAiChat extends EventEmitter
{
	#rightPanel: RightPanel;
	#rightBar: RightBar;
	#siteTemplate: SiteTemplate;

	#container: HTMLElement | null = null;
	#contentContainer: HTMLElement | null = null;
	#vueApp: Object | null = null;
	#isExpanded: boolean = false;
	#chatExtensionPromise: Promise | null = null;

	constructor(rightPanel: RightPanel, rightBar: RightBar, siteTemplate: SiteTemplate)
	{
		super();
		this.setEventNamespace('BX.Intranet.Bitrix24.Template.RightPanelAiChat');

		this.#rightPanel = rightPanel;
		this.#rightBar = rightBar;
		this.#siteTemplate = siteTemplate;
	}

	isExpanded(): boolean
	{
		return this.#isExpanded;
	}

	expand(params: { chatId: number }): void
	{
		if (this.#isExpanded)
		{
			return;
		}

		this.#isExpanded = true;

		this.#loadTheme()
			.then(({ ThemeManager, SpecialBackground }) => {
				if (!this.#isExpanded)
				{
					return;
				}

				const chatBackground = ThemeManager.getBackgroundStyleById(SpecialBackground.martaAI);

				if (!this.#container)
				{
					this.#initContainer(chatBackground);
				}

				this.#showSidebar();
				this.#mountVueApp(params.chatId);

				this.emit('onExpand');

				EventEmitter.subscribeOnce('IM.AiAssistantWidget:minimize', () => {
					this.collapse();
				});
			})
			.catch((error) => {
				console.error('RightPanelAiChat: Failed to load theme:', error);
				this.#isExpanded = false;
			});
	}

	collapse(): void
	{
		if (!this.#isExpanded)
		{
			return;
		}

		this.#isExpanded = false;

		this.emit('onCollapse');

		this.#rightPanel.subscribeOnce('onCollapseComplete', () => {
			this.#rightBar.resetBackground();
			this.#siteTemplate.resetAvatarBlockBackground();
			this.#destroy();
		});

		this.#rightPanel.collapse();
	}

	preload(): Promise
	{
		return this.#loadChatExtension();
	}

	#showSidebar(): void
	{
		const sidebarContainer = this.#rightPanel.getContainer();
		if (!sidebarContainer)
		{
			console.error('RightPanelAiChat: Sidebar container #app__right-panel not found');

			return;
		}

		this.#rightPanel.expand();
		Dom.append(this.#container, sidebarContainer);
	}

	#initContainer(chatBackground: Object): void
	{
		this.#contentContainer = Tag.render`
			<div class="right-panel-ai-chat__content"></div>
		`;

		const loader = new Loader({
			size: 144,
			color: 'rgba(255, 255, 255, 0.6)',
			target: this.#contentContainer,
			offset: {
				top: '-50px',
			},
		});

		loader.show();

		this.#container = Tag.render`
			<div class="right-panel-ai-chat --ui-context-content-light">
				${this.#contentContainer}
				<div class="right-panel-ai-chat__background"
					style="
						background-color: ${chatBackground.backgroundColor};
						background-image: ${chatBackground.backgroundImage};
						background-position: ${chatBackground.backgroundPosition};
						background-repeat: ${chatBackground.backgroundRepeat};
						background-size: ${chatBackground.backgroundSize};
					"
				></div>
			</div>
		`;
	}

	async #mountVueApp(chatId: number): void
	{
		try
		{
			const application = await this.#loadChatExtension();

			if (!this.#isExpanded)
			{
				return;
			}

			this.#vueApp = application;

			application.mount({
				aiAssistantBotId: chatId,
				rootContainer: this.#contentContainer,
			});

			this.#siteTemplate.setAvatarBlockBackground({
				backgroundColor: '#fff',
			});
		}
		catch (error)
		{
			console.error('RightPanelAiChat: Failed to mount chat widget:', error);
		}
	}

	#loadChatExtension(): Promise
	{
		if (!this.#chatExtensionPromise)
		{
			this.#chatExtensionPromise = Runtime.loadExtension('im.v2.application.integration.ai-assistant-widget')
				.then(() => {
					const LaunchApplication = BX.Messenger.v2.Application.Launch;
					const ChatEmbeddedApplication = BX.Messenger.v2.Application.ChatEmbeddedApplication;

					return LaunchApplication(ChatEmbeddedApplication.aiAssistantWidget);
				})
				.catch((error) => {
					console.error('RightPanelAiChat: Failed to preload chat extension:', error);
					this.#chatExtensionPromise = null;
					throw error;
				});
		}

		return this.#chatExtensionPromise;
	}

	#loadTheme(): Promise
	{
		return Runtime.loadExtension('im.v2.lib.theme')
			.then((exports) => {
				return {
					ThemeManager: exports.ThemeManager,
					SpecialBackground: exports.SpecialBackground,
				};
			});
	}

	#destroy(): void
	{
		if (this.#vueApp)
		{
			this.#vueApp.bitrixVue.unmount();
			this.#vueApp = null;
		}

		Dom.remove(this.#container);

		this.#container = null;
		this.#contentContainer = null;
	}
}
