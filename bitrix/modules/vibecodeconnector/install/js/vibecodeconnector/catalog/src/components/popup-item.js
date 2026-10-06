import { ajax, Event, Loc, Tag, Text } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Menu } from 'ui.system.menu';
import { Text as UiText, Headline } from 'ui.system.typography';
import { Messenger } from 'im.public';

import { type TabConfig } from '../catalog';
import { type CatalogItem } from '../tab-controller';
import { sendCatalogAnalytics } from '../utils/analytics';
import { renderItemCounter } from '../utils/counter.js';
import { renderIcon } from '../utils/icons.js';
import { hasCatalogAppOpenTarget, openCatalogApp, openUrl, type OpenAppTarget } from '../utils/links';
import { CatalogPopupItemPinButton } from './popup-item-pin-button';
import { CatalogPopupItemHideAction } from './popup-item-hide-action';
import { CatalogPopupItemDeleteAction } from './popup-item-delete-action';
import { CatalogPopupItemRenameAction } from './popup-item-rename-action';
import { CatalogPopupItemShareAction } from './popup-item-share-action';

const KIND_APPLICATION = 'application';
const KIND_BOT = 'bot';

const CATALOG_OPENED_EVENT = 'im:vibe-code-catalog:opened';

type CatalogPopupItemCallbacks = {
	onPinToggled?: () => void,
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
	#pinButton: CatalogPopupItemPinButton;
	#hideAction: CatalogPopupItemHideAction;
	#deleteAction: CatalogPopupItemDeleteAction;
	#renameAction: CatalogPopupItemRenameAction;
	#shareAction: CatalogPopupItemShareAction;
	#callbacks: CatalogPopupItemCallbacks;
	#showHiddenBadge: boolean;
	#node: HTMLElement | null = null;
	#newBadgeNode: HTMLElement | null = null;
	#actionMenu: ?Menu = null;

	constructor(item: CatalogItem, tab: TabConfig | null = null, callbacks: CatalogPopupItemCallbacks = {})
	{
		this.#item = item;
		this.#callbacks = callbacks;
		this.#showHiddenBadge = callbacks.showHiddenBadge === true;
		this.#pinButton = new CatalogPopupItemPinButton(item, tab, {
			onPinToggled: callbacks.onPinToggled,
		});
		this.#hideAction = new CatalogPopupItemHideAction(item, tab, {
			onHiddenToggled: callbacks.onHiddenToggled,
			onHiddenCommitted: callbacks.onHiddenCommitted,
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
		const pinButtonNode = this.#pinButton.render();
		const actionControlsNode = (pinButtonNode || actionButtonNode) && Tag.render`
			<div class="vibecode-catalog__item-action-button-wrap">
				${pinButtonNode}
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
		if (this.#isBotWithChat())
		{
			return true;
		}

		return hasCatalogAppOpenTarget(this.#item.id, this.#item.viewUrl, this.#isApplication(), this.#item.externalId);
	}

	#isApplication(): boolean
	{
		return this.#item.kind === KIND_APPLICATION;
	}

	#isBotWithChat(): boolean
	{
		return this.#item.kind === KIND_BOT && this.#item.chatId !== null;
	}

	#recordOpen(): void
	{
		const wasNew = this.#item.isNew === true && this.#item.isOpened !== true;
		this.#markOpened();
		ajax.runAction('vibecodeconnector.Catalog.recordOpen', { data: { catalogItemId: this.#item.id } })
			.then(() => {
				if (wasNew)
				{
					EventEmitter.emit(CATALOG_OPENED_EVENT, { catalogItemId: this.#item.id });
				}
			})
			.catch(console.error);
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
		this.#recordOpen();

		if (this.#isBotWithChat())
		{
			void Messenger.openChat(String(this.#item.chatId));
			// the chat opens on the page behind the modal catalog, which would block it
			this.#callbacks.onChatOpen?.();

			return;
		}

		openCatalogApp(this.#buildOpenAppTarget());
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
		};
	}

	#getActionMenuItems(trigger: HTMLElement): Array<{
		title: string,
		dataset?: { [string]: string },
		onClick?: () => void,
	}>
	{
		const items = [];

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

		const pinMenuItem = this.#pinButton.getMenuItem();

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
