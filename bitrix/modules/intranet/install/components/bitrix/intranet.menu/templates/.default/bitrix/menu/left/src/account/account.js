import { Dom, Text, Event, Loc, Tag } from 'main.core';
import { DesktopApi, DesktopAccount } from 'im.v2.lib.desktop-api';
import { showDesktopDeleteConfirm } from 'im.v2.lib.confirm';
import {Menu, Popup} from 'main.popup';
import { PopupManager } from 'main.popup';
import { PopupType } from 'im.v2.const';
export class Account
{
	static defaultAvatar = '/bitrix/js/im/images/blank.gif';
	static defaultAvatarDesctop = '/bitrix/js/ui/icons/b24/images/ui-user.svg?v2';
	accounts: DesktopAccount[] = [];
	currentUser: ?Object = null;
	contextPopup: BX.Main.Popup[] = [];
	popup: BX.Main.Popup = null;
	allCounters: Object = {};
	wrapper: HTMLElement = null;

	constructor(allCounters: Object)
	{
		this.wrapper = document.getElementById("history-items");

		this.checkCounters(allCounters);
		this.reload();

		this.viewDesktopUser();
		this.initPopup();
	}

	checkCounters(allCounters: Object): void
	{
		for (let counterId of Object.keys(allCounters))
		{
			let key = counterId;
			if (counterId === '**') {
				key = 'live-feed';
			}
			this.allCounters[key] = allCounters[counterId];
		}
	}

	getSumCounters(): number
	{
		let sum = 0;
		for (const counterId of Object.keys(this.allCounters))
		{
			if (counterId === 'tasks_effective' || counterId === 'invited_users')
			{
				continue;
			}
			const val = this.allCounters[counterId] ? parseInt(this.allCounters[counterId], 10) : 0;
			sum += val;
		}

		return sum;
	}

	reload(): void
	{
		const currentUserId = Loc.getMessage('USER_ID');
		this.accounts = ('undefined' !== typeof BXDesktopSystem) ? DesktopApi.getAccountList() : [];
		this.currentUser = this.accounts.find((account) => account.id === currentUserId && account.portal === location.hostname);

		this.viewPopupAccounts();
	}

	initPopup(): void
	{
		const userNode = document.querySelector('.intranet__desktop-menu_user-block');
		this.popup = new Popup({
			content: document.querySelector('.intranet__desktop-menu_popup'),
			bindElement: userNode,
			width: 320,
			background: '#282e39',
			closeIcon: true,
			closeByEsc: true,
		});

		Event.bind(userNode, 'click', () => {
			if (this.popup.isShown())
			{
				this.popup.close();
			}
			else
			{
				this.popup.show();
				this.reload();
			}
		});
	}

	setCounters(counters: Object): void
	{
		let newCounters = counters;
		if (counters['data'])
		{
			newCounters = counters.data;
			if (newCounters[0] && typeof newCounters[0] === 'object')
			{
				newCounters = newCounters[0];
			}
		}

		for (let counterId of Object.keys(newCounters))
		{
			let cId = counterId
			if (counterId === '**') {
				cId = 'live-feed';
			}
			this.allCounters[cId] = newCounters[counterId];
		}

		const sumCounters = this.getSumCounters();
		const block = document.getElementsByClassName('intranet__desktop-menu_user-block')[0];
		const counterNode = block.querySelector('[data-role="counter"]');
		if (sumCounters > 0)
		{
			counterNode.innerHTML = sumCounters > 99 ? '99+' : sumCounters;
			if (!Dom.hasClass(block, 'intranet__desktop-menu_item_counters'))
			{
				Dom.addClass(block, 'intranet__desktop-menu_item_counters');
			}
		}
		else
		{
			counterNode.innerHTML = '';
			Dom.addClass(block, 'intranet__desktop-menu_item_counters');
		}
	}

	removeElements(className: string): void
	{
		const elements = document.getElementsByClassName(className);

		[...elements].forEach(element => {
			element.remove();
		});
	}

	viewDesktopUser(): void
	{
		const block = document.getElementsByClassName('intranet__desktop-menu_user')[0];
		const counters = this.getSumCounters();
		const countersView = counters > 99 ? '99+' : counters;
		this.removeElements('intranet__desktop-menu_user-block');

		let userData = Tag.render`<div class="intranet__desktop-menu_user-block ${ counters > 0 ? 'intranet__desktop-menu_item_counters' : ''}">
				<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-desktop">
					<i></i>
					<div class="intranet__desktop-menu_user-counter ui-counter ui-counter-md ui-counter-danger">
						<div class="ui-counter-inner" data-role="counter">${countersView}</div>
					</div>
				</span>
				<span class="intranet__desktop-menu_user-inner">
					<span class="intranet__desktop-menu_user-name">${this.currentUser.portal}</span>
					<span class="intranet__desktop-menu_user-post">${this.currentUser.work_position}</span>
				</span>
			</div>`;

		Dom.append(userData, block);

		const avatar = document.getElementsByClassName('ui-icon-common-user-desktop')[0];
		const previewImage = this.getAvatarUrl(this.currentUser);
		Dom.style(avatar, '--ui-icon-service-bg-image', previewImage);
	}

	getAvatarUrl(account): string
	{
		let avatarUrl = '';
		if (account.avatar.includes('http://') || account.avatar.includes('https://'))
		{
			avatarUrl = account.avatar;
		}
		else
		{
			avatarUrl = account.protocol + '://' + account.portal + account.avatar;
		}

		return `url('${Text.encode(account.avatar === Account.defaultAvatar ? Account.defaultAvatarDesctop : avatarUrl)}')`;
	}

	viewPopupAccounts(): void
	{
		const menuPopup = document.getElementsByClassName('intranet__desktop-menu_popup')[0];
		let position = '';
		if (this.currentUser.work_position !== '')
		{
			position = `<span class="intranet__desktop-menu_popup-post">${this.currentUser.work_position}</span>`;
		}

		this.removeElements('intranet__desktop-menu_popup-header');

		let item = Tag.render`<div class="intranet__desktop-menu_popup-header">
			<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-popup">
				<i></i>
			</span>
			<span class="intranet__desktop-menu_popup-label">${this.currentUser.portal}</span>
			<div class="intranet__desktop-menu_popup-header-user">
				<span class="intranet__desktop-menu_popup-name">${this.currentUser.first_name + ' ' + this.currentUser.last_name}</span>
				${position}
			</div>
		</div>`;

		Dom.insertBefore(item, menuPopup.firstElementChild);

		const avatar = document.getElementsByClassName('ui-icon-common-user-popup')[0];
		const previewImage = this.getAvatarUrl(this.currentUser);
		Dom.style(avatar, '--ui-icon-service-bg-image', previewImage);

		const block = document.getElementsByClassName('intranet__desktop-menu_popup-list')[0];

		this.removeElements('intranet__desktop-menu_popup-item-account');

		let index = 0;
		for (let account of this.accounts)
		{
			let currentUserClass = '';
			let counters = 0;
			if (account.id === this.currentUser.id && account.portal === this.currentUser.portal)
			{
				counters = this.getSumCounters();
				currentUserClass = '--selected';
			}
			const countersView = counters > 99 ? '99+' : counters;

			let item = Tag.render`<li class="intranet__desktop-menu_popup-item intranet__desktop-menu_popup-item-account ${ counters > 0 ? 'intranet__desktop-menu_item_counters' : ''} ${currentUserClass}">
					<span class="intranet__desktop-menu_user-avatar ui-icon ui-icon-common-user ui-icon-common-user-${index}">
						<i></i>
						<div class="intranet__desktop-menu_user-counter ui-counter ui-counter-md ui-counter-danger">
							<div class="ui-counter-inner">${countersView}</div>
						</div>	
					</span>
					<span class="intranet__desktop-menu_popup-user">
						<span class="intranet__desktop-menu_popup-name">${account.portal}</span>
						<span class="intranet__desktop-menu_popup-post">${account.login}</span>
					</span>
					<span class="intranet__desktop-menu_popup-btn ui-icon-set --more" id="ui-icon-set-${index}"></span>
				</li>`;

			Dom.insertBefore(item, block.children[index]);

			this.addContextMenu(account, index);

			let userAvatar = document.getElementsByClassName('ui-icon-common-user-' + index)[0];
			let previewUserImage = this.getAvatarUrl(account);
			Dom.style(userAvatar, '--ui-icon-service-bg-image', previewUserImage);

			index++;
		}
	}

	addContextMenu(account: DesktopAccount, index: number): void
	{
		const button = document.getElementById(`ui-icon-set-${index}`);
		const popup = this.popup;
		const contextPopup = this.contextPopup;
		if (contextPopup[index])
		{
			contextPopup[index].destroy();
		}
		contextPopup[index] = new Menu({
			bindElement: button,
			className: 'intranet__desktop-menu_context',
			items: [
				account.id === this.currentUser.id && account.portal === this.currentUser.portal ?
					{
						text: Loc.getMessage('MENU_ACCOUNT_POPUP_DISCONNECT'),
						onclick: function(event, item) {
							const { host } = account;
							BXDesktopSystem?.AccountDisconnect(host);
							if (contextPopup[index])
							{
								contextPopup[index].close();
							}
							popup.close();
						},
					}
					:
					{
						text: Loc.getMessage('MENU_ACCOUNT_POPUP_CONNECT'),
						onclick: function(event, item) {
							const { host, login, protocol } = account;
							const userLang = navigator.language;
							DesktopApi.connectAccount(host, login, protocol, userLang);
							if (contextPopup[index])
							{
								contextPopup[index].close();
							}
							popup.close();
						},
					},
				{
					text: Loc.getMessage('MENU_ACCOUNT_POPUP_REMOVE'),
					onclick: async function(event, item) {
						const userChoice = await showDesktopDeleteConfirm();
						if (userChoice === true)
						{
							const { host, login } = account;
							DesktopApi.deleteAccount(host, login);

							PopupManager.getPopupById(PopupType.userProfile)?.close();
						}

						if (contextPopup[index])
						{
							contextPopup[index].close();
						}
						popup.close();
					},
				},
			],
		});

		Event.bind(button, 'click', (event) => {
			const index: number = parseInt(event.target.id.replace('ui-icon-set-', ''));
			if (contextPopup[index])
			{
				contextPopup[index].show();
			}
		});
	}

	openLoginTab(): void
	{
		DesktopApi.openAddAccountTab();
	}
}