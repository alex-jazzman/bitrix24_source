import { Dom, Tag, Loc } from 'main.core';

import './css/style.css';

export class MailboxSelector
{
	constructor(config = {
		root: null,
		popupMenuId: 'mail-msg-list-mailbox-menu',
		selectorConfig: null,
	})
	{
		this.mailboxPopupMenuId = config.popupMenuId || 'mail-msg-list-mailbox-menu';
		this.isAllMailMode = (config.selectorConfig && config.selectorConfig.isAllMailMode === true);
		this.virtualFolderKey = (config.selectorConfig && config.selectorConfig.virtualFolderKey) || 'all_messages';
		this.hideClassName = 'main-ui-hide';
		this.mailboxMenuToggle = null;
		this.unreadMarker = null;

		this.#renderTitleButton(config.root, config.selectorConfig);
		this.initMailboxes(config.selectorConfig);
		this.bindToggle();
		this.subscribeToOpenMessage();
	}

	#renderTitleButton(root, selectorConfig)
	{
		if (!root || !selectorConfig)
		{
			return;
		}

		const titleText = this.isAllMailMode
			? Loc.getMessage('MAIL_CLIENT_ALL_MAIL')
			: (selectorConfig.titleText || '');
		const hoverText = this.isAllMailMode
			? Loc.getMessage('MAIL_CLIENT_ALL_MAIL')
			: (selectorConfig.titleHoverText || '');
		const mailboxId = Number(selectorConfig.currentMailboxId) || 0;
		const unseenInOthers = Number(selectorConfig.unseenCountInOtherMailboxes) || 0;
		const markerHidden = (this.isAllMailMode || unseenInOthers <= 0) ? 'mail-hidden-element' : '';

		const button = Tag.render`
			<button class="mailbox-panel ui-btn ui-btn-light-border --air ui-btn-no-caps --style-outline mail-btn-dropdown"
				data-role="mailbox-current-title"
				data-mailbox-id="${mailboxId}"
				data-test-id="mail_sync-panel__mailbox-select"
				title="${hoverText}">
				<span class="mail-btn-dropdown-title">
					<span class="mail-btn-dropdown-title-mail-name" title="${titleText}">${titleText}</span>
				</span>
				<span class="ui-icon-set --chevron-down-m mail-btn-dropdown-arrow" aria-hidden="true"></span>
				<span class="unread-message-marker-for-all-mailboxes ${markerHidden}" data-role="unreadMessageMailboxesMarker" aria-hidden="true"></span>
			</button>
		`;

		root.replaceChildren(button);
		this.mailboxMenuToggle = button;
		this.unreadMarker = button.querySelector('[data-role="unreadMessageMailboxesMarker"]');
	}

	subscribeToOpenMessage()
	{
		BX.addCustomEvent('mail:openMessageForView', (event) => {
			const messageId = event && event['id'];
			if (!messageId)
			{
				return;
			}
			const cell = document.querySelector('.mail-msg-list-cell-' + messageId);
			if (!cell)
			{
				return;
			}
			const row = BX.findParent(cell, { tagName: 'tr' });
			if (!row || !row.dataset || !row.dataset.id)
			{
				return;
			}
			if (row.getElementsByClassName('mail-msg-list-cell-unseen').length === 0)
			{
				return;
			}
			this.handleMessagesAction([row.dataset.id], 'markAsSeen');
		});
	}

	initMailboxes(selectorConfig)
	{
		this.mailboxesUnseen = {};
		this.allMailMenuIndex = -1;

		if (!selectorConfig)
		{
			this.mailboxMenu = [];
			if (BX.Main && BX.Main.MenuManager)
			{
				BX.Main.MenuManager.destroy(this.mailboxPopupMenuId);
			}
			return;
		}

		this.isAllMailMode = selectorConfig.isAllMailMode === true;
		this.virtualFolderKey = selectorConfig.virtualFolderKey || this.virtualFolderKey;

		const items = [];

		items.push(this.#renderAllMailItem(selectorConfig));
		this.allMailMenuIndex = items.length - 1;

		items.push({ delimiter: true });

		for (const mailbox of (selectorConfig.mailboxes || []))
		{
			items.push(this.#renderMailboxItem(mailbox));
			this.mailboxesUnseen[mailbox.id] = Number(mailbox.unseen) || 0;
		}

		items.push({ delimiter: true });
		items.push(this.#renderAddMailboxItem(selectorConfig.addMailbox));

		this.mailboxMenu = items;

		if (BX.Main && BX.Main.MenuManager)
		{
			BX.Main.MenuManager.destroy(this.mailboxPopupMenuId);
		}
	}

	#renderAllMailItem(config)
	{
		const count = Number(config.globalUnseenCounter) || 0;
		const counterClass = count > 0 ? 'js-unseen-mailbox' : this.hideClassName;
		const wrapper = Tag.render`
			<span class="mail-menu-popup-item-text-wrapper">
				<span class="main-buttons-item-text">${Loc.getMessage('MAIL_CLIENT_ALL_MAIL')}</span>
			</span>
		`;
		const counter = Tag.render`<span class="main-buttons-item-counter ${counterClass}">${count}</span>`;

		return {
			html: wrapper.outerHTML + ' ' + counter.outerHTML,
			dataset: {
				isAllMail: true,
				unseen: count,
				sliderIgnoreAutobinding: 'true',
			},
			className: this.isAllMailMode ? 'menu-popup-item-take' : 'dummy',
			href: config.allMailHref,
		};
	}

	#renderMailboxItem(mailbox)
	{
		const count = Number(mailbox.unseen) || 0;
		const counterClass = count > 0 ? 'js-unseen-mailbox' : this.hideClassName;

		const wrapper = Tag.render`
			<span class="mail-menu-popup-item-text-wrapper">
				<span class="main-buttons-item-text">${mailbox.name}</span>
			</span>
		`;
		if (mailbox.isLocked)
		{
			Dom.append(Tag.render`<span class="mail-connect-lock-icon"></span>`, wrapper);
		}
		const counter = Tag.render`<span class="main-buttons-item-counter ${counterClass}">${count}</span>`;

		return {
			html: wrapper.outerHTML + ' ' + counter.outerHTML,
			dataset: {
				/*
				 * Stringify so item.dataset.mailboxId === mailboxId works against the string keys
				 * we get from `for (const id in this.mailboxesUnseen)` and from DOM dataset reads.
				 */
				mailboxId: String(mailbox.id),
				unseen: count,
				sliderIgnoreAutobinding: 'true',
			},
			className: (!this.isAllMailMode && mailbox.isCurrent) ? 'menu-popup-item-take' : 'dummy',
			href: mailbox.href,
		};
	}

	#renderAddMailboxItem(addMailbox)
	{
		if (!addMailbox)
		{
			return { delimiter: true };
		}

		if (addMailbox.isLocked)
		{
			const lockNode = Tag.render`
				<div id="mail-connect-mailbox-add-lock-item">
					<span class="mail-connect-lock-text">${Loc.getMessage('MAIL_CLIENT_MAILBOX_ADD')}</span>
					<span class="mail-connect-lock-icon"></span>
				</div>
			`;
			return {
				html: lockNode.outerHTML,
				className: 'dummy',
				dataset: { isLocked: true },
				onclick: 'showMailboxLimitSlider()',
			};
		}

		const textNode = Tag.render`<span class="main-buttons-item-text">${Loc.getMessage('MAIL_CLIENT_MAILBOX_ADD')}</span>`;
		return {
			text: Loc.getMessage('MAIL_CLIENT_MAILBOX_ADD'),
			html: textNode.outerHTML,
			className: 'dummy',
			href: addMailbox.href,
		};
	}

	bindToggle()
	{
		if (this.mailboxMenuToggle)
		{
			BX.bind(this.mailboxMenuToggle, 'click', this.onMailboxMenuClick.bind(this));
		}
	}

	onMailboxMenuClick()
	{
		const popup = BX.Main.MenuManager.create(
			this.mailboxPopupMenuId,
			this.mailboxMenuToggle,
			this.mailboxMenu,
			{
				events: {
					onPopupFirstShow: () => {
						popup.getMenuItems().forEach((menuItem) => {
							if (menuItem.options.dataset?.isLocked !== true)
							{
								BX.Event.bind(menuItem.getContainer(), 'click', () => {
									popup.close();
								});
							}
						});
					},
				},
			},
		);

		const menuContainer = popup.getMenuContainer?.();
		if (menuContainer)
		{
			Dom.attr(menuContainer, 'data-test-id', 'mail_sync-panel__mailbox-menu');
		}

		popup.popupWindow.isShown() ? popup.close() : popup.show();
	}

	getCurrentMailboxId()
	{
		return this.mailboxMenuToggle && this.mailboxMenuToggle.dataset && this.mailboxMenuToggle.dataset.mailboxId
			? this.mailboxMenuToggle.dataset.mailboxId
			: null;
	}

	handleMessagesAction(rowIds, action)
	{
		if (rowIds && rowIds['for_all_user_mailboxes'] && action === 'markAsSeen')
		{
			this.#zeroAllMailboxesUnseen();
			return;
		}
		this.#applyCountersDeltas(this.#groupDeltasByMailbox(rowIds, action));
	}

	#zeroAllMailboxesUnseen()
	{
		const deltas = {};
		for (const mailboxId in this.mailboxesUnseen)
		{
			if (!Object.prototype.hasOwnProperty.call(this.mailboxesUnseen, mailboxId))
			{
				continue;
			}
			const oldCount = Number(this.mailboxesUnseen[mailboxId]) || 0;
			if (oldCount > 0)
			{
				deltas[mailboxId] = -oldCount;
			}
		}
		this.#applyCountersDeltas(deltas);
	}

	#groupDeltasByMailbox(rowIds, action)
	{
		if (!Array.isArray(rowIds))
		{
			return {};
		}
		const deltas = {};
		const sign = action === 'markAsUnseen' ? 1 : -1;
		for (const compositeId of rowIds)
		{
			const id = String(compositeId);
			const dashAt = id.lastIndexOf('-');
			if (dashAt < 0 || dashAt === id.length - 1)
			{
				continue;
			}
			const mailboxId = id.substring(dashAt + 1);
			deltas[mailboxId] = (deltas[mailboxId] || 0) + sign;
		}
		return deltas;
	}

	#applyCountersDeltas(deltas)
	{
		if (!deltas)
		{
			return;
		}

		let totalDelta = 0;
		for (const mailboxId in deltas)
		{
			if (!Object.prototype.hasOwnProperty.call(deltas, mailboxId))
			{
				continue;
			}
			const delta = Number(deltas[mailboxId]) || 0;
			if (!delta)
			{
				continue;
			}
			totalDelta += delta;
			const oldCount = Number(this.mailboxesUnseen[mailboxId] || 0);
			const newCount = Math.max(0, oldCount + delta);
			this.mailboxesUnseen[mailboxId] = newCount;
			this.#updateMailboxMenuItemHtml(mailboxId, newCount);
		}

		if (totalDelta !== 0)
		{
			const newTotal = this.#sumMailboxesUnseen();
			this.updateAllMailBadge(newTotal);

			if (this.isAllMailMode)
			{
				BX.Mail.Home.Counters.setCounters([
					{ path: this.virtualFolderKey, count: newTotal }
				]);
				BX.Mail.Home.mailboxCounters.setCounters([
					{ path: 'unseenCountInAllMailboxes', count: newTotal }
				]);
			}
		}

		BX.Main.MenuManager.destroy(this.mailboxPopupMenuId);
		this.syncTopLevelCounter();
	}

	#sumMailboxesUnseen()
	{
		let sum = 0;
		for (const id in this.mailboxesUnseen)
		{
			if (Object.prototype.hasOwnProperty.call(this.mailboxesUnseen, id))
			{
				sum += Number(this.mailboxesUnseen[id]) || 0;
			}
		}
		return sum;
	}

	updatePerMailboxBadges(mailboxesUnseen)
	{
		if (!mailboxesUnseen)
		{
			return;
		}

		for (let i = 0; i < this.mailboxMenu.length; i++)
		{
			const item = this.mailboxMenu[i];
			if (!item || !item.dataset || !item.dataset.mailboxId)
			{
				continue;
			}
			const id = item.dataset.mailboxId;
			if (mailboxesUnseen[id] === undefined)
			{
				continue;
			}
			this.mailboxMenu[i] = this.setMailboxTitleMenuUnseenCounter(item, Number(mailboxesUnseen[id]));
			this.mailboxesUnseen[id] = mailboxesUnseen[id];
		}

		BX.Main.MenuManager.destroy(this.mailboxPopupMenuId);
		this.syncTopLevelCounter();
	}

	updateAllMailBadge(count)
	{
		if (this.allMailMenuIndex < 0 || !this.mailboxMenu[this.allMailMenuIndex])
		{
			return;
		}
		this.mailboxMenu[this.allMailMenuIndex] = this.setMailboxTitleMenuUnseenCounter(
			this.mailboxMenu[this.allMailMenuIndex],
			count
		);
		BX.Main.MenuManager.destroy(this.mailboxPopupMenuId);
	}

	setMailboxTitleMenuUnseenCounter(mailboxMenuItem, count)
	{
		let className = this.hideClassName;
		if (count > 0)
		{
			className = '';
			if (typeof mailboxMenuItem.dataset.path !== 'undefined')
			{
				if (mailboxMenuItem.unseen == 0)
				{
					className += ' mail-msg-list-menu-child-counter';
				}
				if (!mailboxMenuItem.dataset.isCounted)
				{
					className += ' mail-msg-list-menu-fake-counter';
				}
			}
		}

		const counterClass = className
			? `main-buttons-item-counter ${className}`
			: 'main-buttons-item-counter';
		const counterHtml = Tag.render`<span class="${counterClass}">${count}</span>`.outerHTML;
		const existingCounterPattern = /<span class="main-buttons-item-counter[\w -]*">[0-9]+<\/span>/;

		if (existingCounterPattern.test(mailboxMenuItem.html))
		{
			mailboxMenuItem.html = mailboxMenuItem.html.replace(existingCounterPattern, counterHtml);
		}
		else
		{
			mailboxMenuItem.html += '&nbsp;' + counterHtml;
		}

		mailboxMenuItem.dataset.unseen = count;

		return mailboxMenuItem;
	}

	updateUnreadMessageMailboxesMarker(totalNumberOfUnreadLetters)
	{
		if (!this.unreadMarker)
		{
			return;
		}
		if (totalNumberOfUnreadLetters)
		{
			this.unreadMarker.classList.remove('mail-hidden-element');
		}
		else
		{
			this.unreadMarker.classList.add('mail-hidden-element');
		}
	}

	setInitialState(unseenCountInOtherMailboxes)
	{
		const count = Number(unseenCountInOtherMailboxes) || 0;
		this.updateUnreadMessageMailboxesMarker(count);

		/*
		 * In all-mail mode the parameter doesn't carry per-mailbox unseen for the current mailbox —
		 * writing it would clobber the cache seeded from selectorConfig and undercount the badge.
		 */
		if (!this.isAllMailMode)
		{
			const currentMailboxId = this.getCurrentMailboxId();
			if (currentMailboxId)
			{
				this.mailboxesUnseen[currentMailboxId] = count;
			}
		}

		this.syncTopLevelCounter();
	}

	syncTopLevelCounter()
	{
		const unseen = (BX.Mail.Home && BX.Mail.Home.mailboxCounters)
			? BX.Mail.Home.mailboxCounters.getTotalCounter()
			: 0;

		if (typeof top.B24 === 'object' && typeof top.B24.updateCounters === 'function')
		{
			top.B24.updateCounters({ mail_unseen: unseen });
		}

		if (typeof top.BXIM === 'object' && typeof top.BXIM.notify === 'object')
		{
			if (typeof top.BXIM.notify.counters === 'object')
			{
				top.BXIM.notify.counters.mail_unseen = unseen;
			}
			if (typeof top.BXIM.notify.updateNotifyMailCount === 'function')
			{
				top.BXIM.notify.updateNotifyMailCount(unseen);
			}
		}
	}

	#updateMailboxMenuItemHtml(mailboxId, newCount)
	{
		for (let i = 0; i < this.mailboxMenu.length; i++)
		{
			const item = this.mailboxMenu[i];
			if (item && item.dataset && item.dataset.mailboxId === mailboxId)
			{
				this.mailboxMenu[i] = this.setMailboxTitleMenuUnseenCounter(item, newCount);
				return;
			}
		}
	}
}
