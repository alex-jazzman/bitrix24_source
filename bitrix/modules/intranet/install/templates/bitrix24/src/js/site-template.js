import { Type, Reflection, Runtime, Dom, Browser } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { ChatMenu } from './chat-menu';
import { Composite } from './composite';
import { LeftMenu } from './left-menu';
import { RightBar, type BackgroundStyle } from './right-bar';
import { Header } from './header/header';
import { Footer } from './footer';
import { GoTopButton } from './go-top-button';
import { CollaborationMenu } from './collaboration-menu';
import { RightPanel } from './right-panel';

export class SiteTemplate
{
	#leftMenu: LeftMenu | null = null;
	#rightBar: RightBar | null = null;
	#header: Header | null = null;
	#footer: Footer | null = null;
	#composite: Composite | null = null;
	#chatMenu: ChatMenu | null = null;
	#goTopButton: GoTopButton | null = null;
	#collaborationMenu: CollaborationMenu | null = null;
	#rightPanel: RightPanel | null = null;

	constructor()
	{
		this.#preventFromIframe();

		this.#patchPopupMenu();
		this.#patchRestAPI();
		this.#patchJSClock();

		this.#goTopButton = new GoTopButton();
		this.#leftMenu = new LeftMenu();
		this.#rightBar = new RightBar({
			goTopButton: this.#goTopButton,
		});
		this.#header = new Header();
		this.#footer = new Footer();
		this.#composite = new Composite();
		this.#chatMenu = new ChatMenu();
		this.#collaborationMenu = new CollaborationMenu();
		this.#rightPanel = new RightPanel();

		this.#applyUserAgentRules();
	}

	getLeftMenu(): LeftMenu
	{
		return this.#leftMenu;
	}

	getRightBar(): RightBar
	{
		return this.#rightBar;
	}

	getHeader(): Header
	{
		return this.#header;
	}

	getFooter(): Footer
	{
		return this.#footer;
	}

	getComposite(): Composite
	{
		return this.#composite;
	}

	getChatMenu(): ChatMenu
	{
		return this.#chatMenu;
	}

	getCollaborationMenu(): CollaborationMenu
	{
		return this.#collaborationMenu;
	}

	getRightPanel(): RightPanel
	{
		return this.#rightPanel;
	}

	enterFullscreen(): void
	{
		if (this.isFullscreen())
		{
			return;
		}

		if (!this.#supportViewTransition())
		{
			this.#enterFullscreen();
			this.#dispatchResizeEvent();

			return;
		}

		const transition = document.startViewTransition(() => {
			this.#enterFullscreen();
		});

		transition.finished.then(() => {
			this.#dispatchResizeEvent();
		}).catch(() => {
			// fail silently
		});
	}

	exitFullscreen(): void
	{
		if (!this.isFullscreen())
		{
			return;
		}

		if (!this.#supportViewTransition())
		{
			this.#exitFullscreen();
			this.#dispatchResizeEvent();

			return;
		}

		const transition = document.startViewTransition(() => {
			this.#exitFullscreen();
		});

		transition.finished.then(() => {
			this.#dispatchResizeEvent();
		}).catch(() => {
			// fail silently
		});
	}

	toggleFullscreen(): void
	{
		if (this.isFullscreen())
		{
			this.exitFullscreen();
		}
		else
		{
			this.enterFullscreen();
		}
	}

	isFullscreen(): boolean
	{
		return Dom.hasClass(document.body, 'air-fullscreen-mode');
	}

	setAvatarBlockBackground(background: BackgroundStyle): void
	{
		Dom.style(document.getElementById('avatar-area'), {
			backgroundImage: background?.backgroundImage ?? null,
			backgroundColor: background?.backgroundColor ?? null,
			backgroundPosition: background?.backgroundPosition ?? null,
			backgroundRepeat: background?.backgroundRepeat ?? null,
			backgroundSize: background?.backgroundSize ?? null,
		});
	}

	resetAvatarBlockBackground(): void
	{
		Dom.style(document.getElementById('avatar-area'), {
			backgroundImage: null,
			backgroundColor: null,
			backgroundPosition: null,
			backgroundRepeat: null,
			backgroundSize: null,
		});
	}

	#supportViewTransition(): boolean
	{
		return Type.isFunction(document.startViewTransition) && !Browser.isSafari();
	}

	#enterFullscreen(): void
	{
		Dom.addClass(document.body, 'air-fullscreen-mode');

		this.getLeftMenu().hide();
		this.getHeader().hide();
		this.getFooter().hide();
		this.getRightBar().hide();
	}

	#exitFullscreen(): void
	{
		Dom.removeClass(document.body, 'air-fullscreen-mode');

		this.getLeftMenu().show();
		this.getHeader().show();
		this.getFooter().show();
		this.getRightBar().show();
	}

	#dispatchResizeEvent(): void
	{
		window.dispatchEvent(new Event('resize'));
	}

	#patchPopupMenu(): void
	{
		EventEmitter.subscribe('BX.Main.Menu:onInit', (event: BaseEvent) => {
			const { params } = event.getData();
			if (params && Type.isNumber(params.maxWidth))
			{
				// We increased menu-item's font-size that's why we increase max-width
				params.maxWidth += 10;
			}
		});
	}

	#patchJSClock(): void
	{
		EventEmitter.subscribe('onJCClockInit', (config) => {
			window.JCClock.setOptions({
				centerXInline: 83,
				centerX: 83,
				centerYInline: 67,
				centerY: 79,
				minuteLength: 31,
				hourLength: 26,
				popupHeight: 229,
				inaccuracy: 15,
				cancelCheckClick: true,
			});
		});
	}

	#preventFromIframe(): void
	{
		const iframeMode = window !== window.top;
		if (iframeMode)
		{
			window.top.location = window.location.href;
		}
	}

	#applyUserAgentRules(): void
	{
		if (!Browser.isMobile() && document.referrer !== '' && document.referrer.startsWith(location.origin) === false)
		{
			Runtime.loadExtension('intranet.recognize-links');
		}
	}

	#patchRestAPI(): void
	{
		const AppLayout = Reflection.getClass('BX.rest.AppLayout');
		if (!AppLayout)
		{
			return;
		}

		const placementInterface = AppLayout.initializePlacement('DEFAULT');
		placementInterface.prototype.showHelper = async function(params, cb)
		{
			let query = '';
			if (Type.isNumber(params))
			{
				query = `redirect=detail&code=${params}`;
			}
			else if (Type.isStringFilled(params))
			{
				query = params;
			}
			else if (Type.isPlainObject(params))
			{
				for (const param of Object.keys(params))
				{
					if (query.length > 0)
					{
						query += '&';
					}

					query += `${param}=${params[param]}`;
				}
			}

			if (query.length > 0)
			{
				await Runtime.loadExtension('helper');
				const Helper = Reflection.getClass('BX.Helper');
				Helper.show(query);
			}
		};
	}
}
