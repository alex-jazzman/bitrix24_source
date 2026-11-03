import { ajax, Event, Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Center as NotificationCenter } from 'ui.notification';
import { Menu } from 'ui.system.menu';
import { Text as UiText, Headline } from 'ui.system.typography';

import { type TabConfig } from '../catalog';
import { type CatalogItem } from '../tab-controller';
import { sendCatalogAnalytics } from '../utils/analytics';
import { renderItemCounter } from '../utils/counter.js';
import { renderIcon } from '../utils/icons.js';
import {
	hasCatalogAppOpenTarget,
	openCatalogApp,
	openCatalogChat,
	openUrl,
	type OpenAppTarget,
} from '../utils/links';
import { isItemClickOpensChatEnabled } from '../utils/settings';
import { CatalogPopupItemFavoriteButton, type FavoriteRequestRegistry } from './popup-item-favorite-button';
import { CatalogPopupItemPinAction } from './popup-item-pin-action';
import { CatalogPopupItemHideAction } from './popup-item-hide-action';
import { CatalogPopupItemCreateChatAction } from './popup-item-create-chat-action';
import { CatalogPopupItemDeleteAction } from './popup-item-delete-action';
import { CatalogPopupItemRenameAction } from './popup-item-rename-action';
import { CatalogPopupItemShareAction } from './popup-item-share-action';

const KIND_APPLICATION = 'application';

const CATALOG_OPENED_EVENT = 'im:vibe-code-catalog:opened';

const RECORD_OPEN_ACTION = 'vibecodeconnector.Catalog.recordOpen';

const OPEN_CHAT_ACTION = 'vibecodeconnector.Catalog.openChat';

type CatalogPopupItemCallbacks = {
	onPinToggled?: () => void,
	onFavoriteToggled?: (committed: boolean) => void,
	favoriteRequests?: FavoriteRequestRegistry,
	onHiddenToggled?: () => void,
	onHiddenCommitted?: () => void,
	onRenamed?: () => void,
	onChatOpen?: () => void,
	onOpened?: (itemId: number) => void,
	showHiddenBadge?: boolean,
};

export class CatalogPopupItem
{
	#item: CatalogItem;
	#favoriteButton: CatalogPopupItemFavoriteButton;
	#pinAction: CatalogPopupItemPinAction;
	#hideAction: CatalogPopupItemHideAction;
	#createChatAction: CatalogPopupItemCreateChatAction;
	#deleteAction: CatalogPopupItemDeleteAction;
	#renameAction: CatalogPopupItemRenameAction;
	#shareAction: CatalogPopupItemShareAction;
	#callbacks: CatalogPopupItemCallbacks;
	#showHiddenBadge: boolean;
	#node: HTMLElement | null = null;
	#newBadgeNode: HTMLElement | null = null;
	#actionMenu: ?Menu = null;
	#clickOpensChat: boolean;
	#chatOpening: boolean = false;

	constructor(item: CatalogItem, tab: TabConfig | null = null, callbacks: CatalogPopupItemCallbacks = {})
	{
		this.#item = item;
		this.#callbacks = callbacks;
		this.#clickOpensChat = isItemClickOpensChatEnabled();
		this.#showHiddenBadge = callbacks.showHiddenBadge === true;
		this.#favoriteButton = new CatalogPopupItemFavoriteButton(item, tab, {
			onFavoriteToggled: callbacks.onFavoriteToggled,
			favoriteRequests: callbacks.favoriteRequests,
		});
		this.#pinAction = new CatalogPopupItemPinAction(item, tab, {
			onPinToggled: callbacks.onPinToggled,
		});
		this.#hideAction = new CatalogPopupItemHideAction(item, tab, {
			onHiddenToggled: callbacks.onHiddenToggled,
			onHiddenCommitted: callbacks.onHiddenCommitted,
		});
		this.#createChatAction = new CatalogPopupItemCreateChatAction(item, {
			onChatOpen: callbacks.onChatOpen,
		});
		this.#deleteAction = new CatalogPopupItemDeleteAction(item, tab);
		this.#renameAction = new CatalogPopupItemRenameAction(item, tab, {
			onRenamed: callbacks.onRenamed,
		});
		this.#shareAction = new CatalogPopupItemShareAction(item);
	}

	render(): HTMLElement
	{
		if (this.#node)
		{
			return this.#node;
		}

		const isClickable = this.#hasOpenTarget();
		const counterNode = this.#item.counter !== null && this.#item.counter > 0
			? renderItemCounter(this.#item.counter)
			: '';
		const subtitleNode = this.#item.description !== null && this.#item.description !== ''
			? Tag.render`<p class="vibecode-catalog__item-subtitle ui-text --xs">${Text.encode(this.#item.description)}</p>`
			: '';
		const authorText = this.#item.isMine === true
			? Loc.getMessage('VIBECODECONNECTOR_CATALOG_ITEM_AUTHOR_YOU')
			: (this.#item.ownerName ?? Loc.getMessage('VIBECODECONNECTOR_CATALOG_ITEM_AUTHOR_UNKNOWN'));
		const authorNode = UiText.render(authorText, {
			tag: 'p',
			size: 'xs',
			className: 'vibecode-catalog__item-author',
		});
		authorNode.dataset.testid = 'vibecode-catalog-item-author';
		authorNode.title = authorText;
		const titleNode = Headline.render(this.#item.title, {
			tag: 'h4',
			size: 'xs',
			className: 'vibecode-catalog__item-title',
		});
		titleNode.dataset.testid = 'vibecode-catalog-item-title';
		const showBadge = this.#showHiddenBadge && this.#item.isHidden === true;
		const hiddenBadgeNode = showBadge
			? Tag.render`
				<span class="vibecode-catalog__item-badge ui-text --2xs" data-testid="vibecode-catalog-item-hidden-badge">
					${Loc.getMessage('VIBECODECONNECTOR_CATALOG_BADGE_HIDDEN')}
				</span>
			`
			: '';
		const pinnedMarkNode = this.#item.isPinned === true
			? Tag.render`
				<span
					class="vibecode-catalog__item-pinned-mark"
					data-testid="vibecode-catalog-item-pinned-mark"
					role="img"
					title="${Loc.getMessage('VIBECODECONNECTOR_CATALOG_BADGE_PINNED')}"
					aria-label="${Loc.getMessage('VIBECODECONNECTOR_CATALOG_BADGE_PINNED')}"
				>${renderIcon('s-pin', 14)}</span>
			`
			: '';
		const showNewBadge = this.#item.isNew === true && this.#item.isOpened !== true;
		const newBadgeNode = showNewBadge
			? Tag.render`
				<span class="vibecode-catalog__item-badge vibecode-catalog__item-badge--new ui-text --2xs" data-testid="vibecode-catalog-item-new-badge">
					${Loc.getMessage('VIBECODECONNECTOR_CATALOG_BADGE_NEW')}
				</span>
			`
			: '';
		this.#newBadgeNode = showNewBadge ? newBadgeNode : null;
		const actionButtonNode = this.#renderActionButton();
		const favoriteButtonNode = this.#favoriteButton.render();
		const actionControlsNode = (favoriteButtonNode || actionButtonNode) && Tag.render`
			<div class="vibecode-catalog__item-action-button-wrap">
				${favoriteButtonNode}
				${actionButtonNode}
			</div>
		`;

		this.#node = Tag.render`
			<li
				class="vibecode-catalog__item${isClickable ? ' vibecode-catalog__item--clickable' : ''}${this.#item.isPinned ? ' vibecode-catalog__item--pinned' : ''}${showBadge ? ' vibecode-catalog__item--hidden' : ''}"
				data-id="${this.#item.id}"
				data-testid="vibecode-catalog-item"
			>
				${this.#renderItemIcon()}
				<div class="vibecode-catalog__item-content">
					<div class="vibecode-catalog__item-title-row">
						${titleNode}
						${pinnedMarkNode}
						${hiddenBadgeNode}
						${newBadgeNode}
					</div>
					${authorNode}
					${subtitleNode}
				</div>
				<div class="vibecode-catalog__item-actions">
					${counterNode}
					${actionControlsNode}
				</div>
			</li>
		`;

		if (isClickable)
		{
			this.#bindLink(this.#node);
		}

		return this.#node;
	}

	#hasOpenTarget(): boolean
	{
		if (this.#clickOpensChat && this.#hasAppChat())
		{
			return true;
		}

		return hasCatalogAppOpenTarget(this.#item.id, this.#item.viewUrl, this.#isApplication(), this.#item.externalId);
	}

	#isApplication(): boolean
	{
		return this.#item.kind === KIND_APPLICATION;
	}

	#hasAppChat(): boolean
	{
		return Type.isNumber(this.#item.appChatId) && this.#item.appChatId > 0;
	}

	#recordOpen(): void
	{
		const wasNew = this.#isNewUnopened();
		this.#markOpened();
		ajax.runAction(RECORD_OPEN_ACTION, { data: { catalogItemId: this.#item.id } })
			.then(() => this.#emitOpened(wasNew))
			.catch(console.error);
	}

	#isNewUnopened(): boolean
	{
		return this.#item.isNew === true && this.#item.isOpened !== true;
	}

	#emitOpened(wasNew: boolean): void
	{
		if (wasNew)
		{
			EventEmitter.emit(CATALOG_OPENED_EVENT, { catalogItemId: this.#item.id });
		}
	}

	// the badge goes, the isNew flag stays: the New slice is filtered by it, and the item must
	// hold its place in the open catalog until the user closes it
	#markOpened(): void
	{
		if (this.#item.isNew !== true || this.#item.isOpened === true)
		{
			return;
		}

		this.#item.isOpened = true;
		this.#callbacks.onOpened?.(this.#item.id);

		if (this.#newBadgeNode !== null)
		{
			this.#newBadgeNode.remove();
			this.#newBadgeNode = null;
		}
	}

	#openTarget(): void
	{
		if (this.#clickOpensChat && this.#hasAppChat())
		{
			this.#openAppChat();

			return;
		}

		this.#recordOpen();

		openCatalogApp(this.#buildOpenAppTarget());
	}

	#openAppChat(): void
	{
		if (this.#chatOpening)
		{
			return;
		}

		if (this.#item.appChatAccessible !== true)
		{
			this.#notify('VIBECODECONNECTOR_CATALOG_APP_CHAT_UNAVAILABLE');

			return;
		}

		this.#chatOpening = true;
		void openCatalogChat(this.#item.appChatId)
			.then((opened) => {
				if (!opened)
				{
					this.#notify('VIBECODECONNECTOR_CATALOG_APP_CHAT_UNAVAILABLE');

					return;
				}

				this.#recordOpen();
				this.#callbacks.onChatOpen?.();
			})
			.finally(() => {
				this.#chatOpening = false;
			});
	}

	#notify(messageId: string): void
	{
		NotificationCenter.notify({ content: Loc.getMessage(messageId) });
	}

	#buildOpenAppTarget(): OpenAppTarget
	{
		return {
			id: this.#item.id,
			title: this.#item.title,
			viewUrl: this.#item.viewUrl,
			externalId: this.#item.externalId,
			canOpenInIframe: this.#isApplication(),
			ownerId: this.#item.ownerId,
			ownerName: this.#item.ownerName,
			isMine: this.#item.isMine === true,
			iconUrl: this.#item.iconUrl,
			color: this.#item.color,
		};
	}

	#getAppChatMenuItem(): ?{ title: string, onClick: () => void }
	{
		if (this.#clickOpensChat || !this.#hasAppChat() || this.#item.appChatAccessible !== true)
		{
			return null;
		}

		return {
			title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_OPEN_APP_CHAT'),
			onClick: () => {
				sendCatalogAnalytics({ event: 'open_app', c_section: 'item' });
				void this.#openAppChatThroughEndpoint();
			},
		};
	}

	async #openAppChatThroughEndpoint(): Promise<void>
	{
		if (this.#chatOpening)
		{
			return;
		}

		this.#chatOpening = true;

		try
		{
			const response = await ajax.runAction(OPEN_CHAT_ACTION, { data: { catalogItemId: this.#item.id } });
			const chatId = Text.toInteger(response?.data?.chatId);

			if (response?.data?.ok !== true || chatId <= 0)
			{
				this.#notify('VIBECODECONNECTOR_CATALOG_APP_CHAT_UNAVAILABLE');

				return;
			}

			this.#item.appChatId = chatId;

			const opened = await openCatalogChat(chatId);

			if (!opened)
			{
				this.#notify('VIBECODECONNECTOR_CATALOG_APP_CHAT_UNAVAILABLE');

				return;
			}

			this.#recordOpen();
			this.#callbacks.onChatOpen?.();
		}
		catch (error)
		{
			this.#notify('VIBECODECONNECTOR_CATALOG_APP_CHAT_UNAVAILABLE');
			console.error('[vibecodeconnector.catalog] failed to open the app chat', this.#item.id, error);
		}
		finally
		{
			this.#chatOpening = false;
		}
	}

	#getActionMenuItems(trigger: HTMLElement): Array<{
		title: string,
		dataset?: { [string]: string },
		onClick?: () => void,
	}>
	{
		const items = [];
		const appChatMenuItem = this.#getAppChatMenuItem();

		if (appChatMenuItem)
		{
			items.push(appChatMenuItem);
		}

		const createChatMenuItem = this.#createChatAction.getMenuItem();

		if (createChatMenuItem)
		{
			items.push(createChatMenuItem);
		}

		if (this.#item.editUrl !== null && this.#item.isMine === true)
		{
			items.push({
				title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_EDIT_IN_VIBE'),
				onClick: () => openUrl(this.#item.editUrl),
			});
		}

		const shareMenuItem = this.#shareAction.getMenuItem(trigger);

		if (shareMenuItem)
		{
			items.push(shareMenuItem);
		}

		const renameMenuItem = this.#renameAction.getMenuItem();

		if (renameMenuItem)
		{
			items.push(renameMenuItem);
		}

		const pinMenuItem = this.#pinAction.getMenuItem();

		if (pinMenuItem)
		{
			items.push(pinMenuItem);
		}

		const hideMenuItem = this.#hideAction.getMenuItem();

		if (hideMenuItem)
		{
			items.push(hideMenuItem);
		}

		const deleteMenuItem = this.#deleteAction.getMenuItem();

		if (deleteMenuItem)
		{
			items.push(deleteMenuItem);
		}

		return items;
	}

	#renderActionButton(): ?HTMLElement
	{
		const actionButtonNode = Tag.render`
			<button
				class="vibecode-catalog__item-action-button"
				type="button"
				aria-label="${Loc.getMessage('VIBECODECONNECTOR_CATALOG_ACTIONS_LABEL')}"
				data-testid="vibecode-catalog-item-action-btn"
			>
				${renderIcon('dots', 24)}
			</button>
		`;
		const menuItems = this.#getActionMenuItems(actionButtonNode) ?? [];

		if (menuItems.length <= 0)
		{
			return null;
		}

		Event.bind(actionButtonNode, 'click', (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();

			this.#actionMenu ??= new Menu({
				items: menuItems,
				events: {
					onShow: () => {
						const menuButtons = this.#actionMenu?.getPopup()?.getPopupContainer()
							?.querySelectorAll('.ui-popup-menu-item-action') ?? [];
						menuItems.forEach((item, index) => {
							if (menuButtons[index] && item.dataset)
							{
								Object.assign(menuButtons[index].dataset, item.dataset);
							}
						});
						this.#bindMenuFollowScroll();
						this.#bindHeadPopupAdjust();
					},
					onClose: () => {
						this.#unbindMenuFollowScroll();
						this.#unbindHeadPopupAdjust();
					},
				},
			});

			this.#actionMenu.show(actionButtonNode);
		});

		return actionButtonNode;
	}

	#followScrollHandler = (): void => {
		const popup = this.#actionMenu?.getPopup();
		if (!popup || !this.#node)
		{
			return;
		}

		const body = this.#node.closest('.vibecode-catalog__body');
		if (!body)
		{
			return;
		}

		const itemRect = this.#node.getBoundingClientRect();
		const bodyRect = body.getBoundingClientRect();

		if (itemRect.bottom <= bodyRect.top
			|| itemRect.top >= bodyRect.bottom - this.#node.offsetHeight
		)
		{
			this.#actionMenu.close();

			return;
		}

		popup.adjustPosition();
	};

	#bindMenuFollowScroll(): void
	{
		const body = this.#node?.closest('.vibecode-catalog__body');
		if (!body)
		{
			return;
		}

		Event.bind(body, 'scroll', this.#followScrollHandler, { passive: true });
	}

	#unbindMenuFollowScroll(): void
	{
		const body = this.#node?.closest('.vibecode-catalog__body');
		if (!body)
		{
			return;
		}

		Event.unbind(body, 'scroll', this.#followScrollHandler);
	}

	#headPopupAdjustHandler = (event: BaseEvent): void => {
		const headContainer = this.#node?.closest('.popup-window');
		if (!headContainer)
		{
			return;
		}

		const adjustingPopup = event.getTarget();
		if (adjustingPopup?.getPopupContainer?.() === headContainer)
		{
			this.#actionMenu?.close();
		}
	};

	#bindHeadPopupAdjust(): void
	{
		EventEmitter.subscribe('BX.Main.Popup:onBeforeAdjustPosition', this.#headPopupAdjustHandler);
	}

	#unbindHeadPopupAdjust(): void
	{
		EventEmitter.unsubscribe('BX.Main.Popup:onBeforeAdjustPosition', this.#headPopupAdjustHandler);
	}

	#renderItemIcon(): HTMLElement
	{
		const iconNode = this.#item.iconUrl === null
			? renderIcon('apps', 45)
			: Tag.render`<img class="vibecode-catalog__item-icon-img" src="${this.#item.iconUrl}" alt="" />`;
		const colorStyle = this.#item.color === null
			? ''
			: `--vibecode-catalog-item-icon-background: ${this.#item.color};`;

		return Tag.render`
			<span
				class="vibecode-catalog__item-icon"
				aria-hidden="true"
				style="${colorStyle}"
			>${iconNode}</span>
		`;
	}

	#bindLink(node: HTMLElement): void
	{
		const itemNode = node;

		itemNode.tabIndex = 0;
		itemNode.setAttribute('role', 'link');

		Event.bind(itemNode, 'click', () => {
			sendCatalogAnalytics({ event: 'open_app', c_section: 'item' });
			this.#openTarget();
		});

		Event.bind(itemNode, 'keydown', (event: KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				sendCatalogAnalytics({ event: 'open_app', c_section: 'item' });
				this.#openTarget();
			}
		});
	}
}
