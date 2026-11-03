import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { Popup, PopupManager } from 'main.popup';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import 'ui.buttons';
import 'ui.icon-set.outline';
import 'ui.system.highlighter';
import 'ui.system.typography';

import './style.css';

const queuedMenuIds = new Set();

export class CollaborationMenuBalloon
{
	#menuId: ?string;
	#decision: ?string;
	#popup: ?Popup = null;
	#menuElement: ?HTMLElement = null;
	#highlight: ?HTMLElement = null;
	#frameId: ?number = null;
	#resizeObserver: ?ResizeObserver = null;
	#mutationObserver: ?MutationObserver = null;
	#lastPosition = '';
	#lastPopupWidth: ?number = null;
	#lastAngleOffset: ?number = null;
	#scheduleFollowMenu = (): void => {
		if (this.#frameId === null)
		{
			this.#frameId = requestAnimationFrame(() => {
				this.#frameId = null;
				this.#followMenu();
			});
		}
	};

	constructor({ menuId, decision }: { menuId?: string, decision?: string } = {})
	{
		this.#menuId = Type.isStringFilled(menuId) ? menuId : null;
		this.#decision = decision ?? null;
	}

	show(): void
	{
		if (
			!this.#menuId
			|| !['show', 'mark'].includes(this.#decision)
			|| queuedMenuIds.has(this.#menuId)
			|| !this.#getAnchor()
		)
		{
			return;
		}

		if (this.#decision === 'mark')
		{
			BX.userOptions.save('intranet', 'collaboration_menu_balloon_processed', null, 'Y');
			queuedMenuIds.add(this.#menuId);

			return;
		}

		this.#queue();
	}

	#queue(): void
	{
		if (queuedMenuIds.has(this.#menuId))
		{
			return;
		}

		queuedMenuIds.add(this.#menuId);
		BannerDispatcher.normal.toQueue((onDone: () => void) => {
			let finished = false;
			let shown = false;
			const finish = (): void => {
				if (finished)
				{
					return;
				}

				finished = true;
				Event.unbind(window, 'pagehide', leavePage);
				this.#stopHighlight();
				onDone();
			};

			const leavePage = (): void => {
				finish();
				this.#popup?.destroy();
				this.#popup = null;
			};
			const anchor = this.#getAnchor();
			if (
				!anchor
				|| (this.#isMessengerPage() && PopupManager.getPopupById('im-folder-panel-onboarding-tour')?.isShown())
			)
			{
				queuedMenuIds.delete(this.#menuId);
				finish();

				return;
			}

			try
			{
				this.#menuElement = document.getElementById(this.#menuId) ?? anchor;
				const popupWidth = this.#getPopupWidth();
				const angleOffset = this.#getAngleOffset(this.#menuElement.getBoundingClientRect().width, popupWidth);
				this.#popup = new Popup({
					bindElement: this.#menuElement,
					targetContainer: document.body,
					content: this.#createContent(),
					width: popupWidth,
					padding: 0,
					background: 'var(--ui-color-accent-soft-element-blue)',
					borderRadius: '16px',
					contentBorderRadius: '16px',
					autoHide: false,
					closeByEsc: true,
					closeIcon: false,
					offsetTop: 8,
					offsetLeft: 40,
					bindOptions: { position: 'bottom', forceBindPosition: true },
					angle: { position: 'top', offset: angleOffset },
					role: 'dialog',
					ariaLabelledBy: 'intranet-collaboration-menu-balloon-title',
					ariaDescribedBy: 'intranet-collaboration-menu-balloon-text',
					events: {
						onClose: (): void => {
							if (finished)
							{
								return;
							}

							try
							{
								if (shown)
								{
									BX.userOptions.save('intranet', 'collaboration_menu_balloon_processed', null, 'Y');
								}
							}
							finally
							{
								finish();
							}
						},
					},
				});
				this.#lastPopupWidth = popupWidth;
				this.#lastAngleOffset = angleOffset;
				Event.bind(window, 'pagehide', leavePage);
				this.#popup.show();
				shown = true;
				this.#startHighlight();
			}
			catch
			{
				queuedMenuIds.delete(this.#menuId);
				finish();
				this.#popup?.destroy();
				this.#popup = null;
			}
		}, { id: `intranet.collaboration-menu-balloon.${this.#menuId}` });
	}

	#createContent(): HTMLElement
	{
		const content = Tag.render`
			<div class="intranet-collaboration-menu-balloon --ui-context-content-dark" data-testid="intranet-collaboration-menu-balloon">
				<button type="button" class="intranet-collaboration-menu-balloon__close" aria-label="${Loc.getMessage('INTRANET_COLLABORATION_MENU_BALLOON_CLOSE_ARIA')}"><span class="ui-icon-set --cross-l" aria-hidden="true"></span></button>
				<div class="intranet-collaboration-menu-balloon__image"></div>
				<div class="intranet-collaboration-menu-balloon__body">
					<div id="intranet-collaboration-menu-balloon-title" class="intranet-collaboration-menu-balloon__title ui-headline --md">${Loc.getMessage('INTRANET_COLLABORATION_MENU_BALLOON_TITLE')}</div>
					<div id="intranet-collaboration-menu-balloon-text" class="intranet-collaboration-menu-balloon__text ui-text --sm">${Loc.getMessage('INTRANET_COLLABORATION_MENU_BALLOON_TEXT')}</div>
					<div class="intranet-collaboration-menu-balloon__footer">
						<button type="button" class="intranet-collaboration-menu-balloon__button ui-btn --air --style-filled ui-btn-md ui-btn-no-caps">${Loc.getMessage('INTRANET_COLLABORATION_MENU_BALLOON_BUTTON')}</button>
					</div>
				</div>
			</div>
		`;
		Event.bind(content.querySelector('.intranet-collaboration-menu-balloon__close'), 'click', () => this.#popup?.close());
		Event.bind(content.querySelector('.intranet-collaboration-menu-balloon__button'), 'click', () => this.#popup?.close());

		return content;
	}

	#startHighlight(): void
	{
		this.#highlight = document.createElement('div');
		this.#highlight.className = 'intranet-collaboration-menu-balloon__highlight ui-highlighter';
		this.#highlight.dataset.testid = 'intranet-collaboration-menu-balloon-highlight';
		document.body.append(this.#highlight);
		const strip = this.#menuElement?.closest('.main-buttons') ?? this.#menuElement;
		if (strip)
		{
			this.#resizeObserver = new ResizeObserver(this.#scheduleFollowMenu);
			this.#resizeObserver.observe(strip);
			this.#mutationObserver = new MutationObserver(this.#scheduleFollowMenu);
			this.#mutationObserver.observe(strip, {
				attributes: true,
				attributeFilter: ['class', 'style', 'hidden'],
				childList: true,
				subtree: true,
			});
		}
		Event.bind(window, 'resize', this.#scheduleFollowMenu);
		Event.bind(window, 'scroll', this.#scheduleFollowMenu, true);
		this.#scheduleFollowMenu();
	}

	#followMenu(): void
	{
		const menuRect = this.#menuElement?.getBoundingClientRect();
		const frameRect = this.#getFrameRect();
		const popupWidth = this.#getPopupWidth();
		const angleOffset = menuRect ? this.#getAngleOffset(menuRect.width, popupWidth) : null;
		const key = menuRect && frameRect
			? `${menuRect.left}:${menuRect.top}:${menuRect.width}:${menuRect.height}:${frameRect.left}:${frameRect.top}:${frameRect.width}:${frameRect.height}:${popupWidth}`
			: '';
		if (key !== this.#lastPosition)
		{
			this.#lastPosition = key;
			this.#placePopup(popupWidth, angleOffset);
			this.#placeHighlight(frameRect);
		}
	}

	#getFrameRect(): ?{ left: number, top: number, width: number, height: number }
	{
		const strip = this.#menuElement?.closest('.main-buttons') ?? this.#menuElement;
		const items = [
			...(strip?.querySelectorAll(`[data-top-menu-id="${CSS.escape(this.#menuId)}"][data-item]`) ?? []),
			...(strip?.querySelectorAll('.main-buttons-item-more') ?? []),
		].filter((item: HTMLElement) => item.getClientRects().length > 0);
		if (items.length === 0)
		{
			return null;
		}

		const rects = items.map((item: HTMLElement) => item.getBoundingClientRect());
		const left = Math.min(...rects.map((rect) => rect.left)) - 14;
		const right = Math.max(...rects.map((rect) => rect.right)) + 14;
		const top = Math.min(...rects.map((rect) => rect.top)) + 9;

		return { left, top, width: right - left, height: 38 };
	}

	#placeHighlight(rect: ?{ left: number, top: number, width: number, height: number }): void
	{
		if (!this.#highlight)
		{
			return;
		}

		Dom.style(this.#highlight, 'display', rect ? '' : 'none');
		if (!rect)
		{
			return;
		}

		Object.assign(this.#highlight.style, {
			left: `${rect.left}px`,
			top: `${rect.top}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			zIndex: String((this.#popup?.getZindex() ?? 1001) - 1),
		});
	}

	#placePopup(popupWidth: number, angleOffset: ?number): void
	{
		if (popupWidth !== this.#lastPopupWidth)
		{
			this.#popup?.setWidth(popupWidth);
			this.#lastPopupWidth = popupWidth;
		}

		if (angleOffset !== null && angleOffset !== this.#lastAngleOffset)
		{
			this.#popup?.setAngle({ position: 'top', offset: angleOffset });
			this.#lastAngleOffset = angleOffset;
		}
		this.#popup?.adjustPosition({ position: 'bottom', forceBindPosition: true });
	}

	#stopHighlight(): void
	{
		if (this.#frameId !== null)
		{
			cancelAnimationFrame(this.#frameId);
			this.#frameId = null;
		}

		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.#mutationObserver?.disconnect();
		this.#mutationObserver = null;
		Event.unbind(window, 'resize', this.#scheduleFollowMenu);
		Event.unbind(window, 'scroll', this.#scheduleFollowMenu, true);
		this.#lastPosition = '';
		this.#lastPopupWidth = null;
		this.#lastAngleOffset = null;
		this.#highlight?.remove();
		this.#highlight = null;
	}

	#getPopupWidth(): number
	{
		return Math.min(448, Math.max(0, document.documentElement.clientWidth - 32));
	}

	#getAngleOffset(menuWidth: number, popupWidth: number): number
	{
		const offset = Math.round(menuWidth / 2) - 16;

		return Math.max(0, Math.min(Math.max(offset, 24), popupWidth - 56));
	}

	#isMessengerPage(): boolean
	{
		return /(?:^|\/)online(?:\/|$)/.test(window.location.pathname);
	}

	#getAnchor(): ?HTMLElement
	{
		const selector = `[data-top-menu-id="${CSS.escape(this.#menuId)}"][data-item]`;

		return [...document.querySelectorAll(selector)]
			.find((item: HTMLElement) => item.getClientRects().length > 0) ?? null;
	}
}
