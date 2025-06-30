import { Tag, Event, ajax, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu } from 'main.popup';
import { AvatarRound, AvatarRoundExtranet, AvatarRoundGuest, AvatarBase } from 'ui.avatar';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { WorkTimeButton } from 'timeman.work-time-button';
import { Content } from './content';
import { Analytics } from '../analytics';
import type { MainContentOptions } from '../types';
import { DesktopAccountList } from 'intranet.desktop-account-list';

export class MainContent extends Content
{
	#activeOnclick: boolean = true;

	getOptions(): MainContentOptions
	{
		return super.getOptions();
	}

	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			this.#setEventHandlers();
			const onclick = () => {
				if (this.#activeOnclick)
				{
					BX.SidePanel.Instance.open(this.getOptions().url);
					Analytics.sendOpenProfile();
				}
			};

			return Tag.render`
				<div onclick="${onclick}" class="intranet-avatar-widget-item__wrapper --column-format" data-id="bx-avatar-widget-content-main">
					<div class="intranet-avatar-widget-item-main__wrapper-head">
						<div class="intranet-avatar-widget-item__avatar">
							${this.#getAvatar().getContainer()}
						</div>
						<div class="intranet-avatar-widget-item__info-wrapper">
							${this.#getFullName()}
							${this.#getStatus()}
						</div>
						<i class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>
						${this.#getMoreMenuElement()}
					</div>
					${this.#getWorkTime()}
				</div>
			`;
		});
	}

	#getFullName(): HTMLElement
	{
		return this.cache.remember('title', () => {
			return Tag.render`
				<span class="intranet-avatar-widget-item__title">${this.getOptions().fullName}</span>
			`;
		});
	}

	#getStatus(): HTMLElement
	{
		return this.cache.remember('status', () => {
			return Tag.render`
				<span class="intranet-avatar-widget-item__description">${this.getOptions().status}</span>
			`;
		});
	}

	#getAvatar(): AvatarBase
	{
		return this.cache.remember('avatar', () => {
			const options = {
				size: 36,
				userpicPath: encodeURI(this.getOptions().userPhotoSrc),
			};
			let avatar = null;

			if (this.getOptions().role === 'extranet')
			{
				avatar = new AvatarRoundExtranet(options);
			}
			else if (this.getOptions().role === 'collaber')
			{
				avatar = new AvatarRoundGuest(options);
			}
			else
			{
				avatar = new AvatarRound(options);
			}

			return avatar;
		});
	}

	#getMoreMenuElement(): HTMLElement
	{
		return this.cache.remember('moreMenuElement', () => {
			const element = Tag.render`
				<i class="ui-icon-set --more-l intranet-avatar-widget-item__more"/>
			`;
			Event.bind(element, 'click', (event) => {
				event.preventDefault();
				event.stopPropagation();
				if (this.#activeOnclick)
				{
					this.#getMoreMenu(event.target).toggle();
				}
			});

			return element;
		});
	}

	#getMoreMenu(target: HTMLElement): Menu
	{
		return this.cache.remember('moreMenu', () => {
			const items = [];

			this.getOptions().menuItems.forEach((item) => {
				items.push({
					html: `
						<div class="intranet-avatar-widget-item-more-menu__wrapper" data-id="bx-avatar-widget-more-menu-item-${item.type}">
							<span class="intranet-avatar-widget-item-more-menu__title">${item.title}</span>
							<i class="intranet-avatar-widget-item-more-menu__icon ui-icon-set ${item.icon}"></i>
						</div>
					`,
					onclick: () => {
						this.#getMoreMenuActionByItem(item, target);
						this.#getMoreMenu(target).close();
						EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
					},
				});
			});

			return new Menu({
				bindElement: target,
				items,
				fixed: true,
			});
		});
	}

	#getMoreMenuActionByItem(item: Object): void
	{
		// eslint-disable-next-line default-case
		switch (item.type)
		{
			case 'settings': {
				Analytics.sendOpenCommonSecurity();
				BX.SidePanel.Instance.open(item.url, { width: 1100 });

				break;
			}
			case 'admin':
			case 'network': {
				Analytics.send(Analytics.EVENT_CLICK_NETWORK);
				window.open(item.url, '_blank');

				break;
			}

			case 'desktop': {
				Analytics.send(Analytics.EVENT_CLICK_ACTIVITY_PORTAL_LIST);
				(new DesktopAccountList({ bindElement: document.querySelector('[data-id="bx-avatar-widget"]') })).show();

				break;
			}

			case 'login-history': {
				Analytics.send(Analytics.EVENT_CLICK_LOGIN_HISTORY);

				if (!item.isAvailable)
				{
					FeaturePromotersRegistry.getPromoter({ code: 'limit_office_login_history' }).show();
				}
				else if (item.isConfigured)
				{
					BX.SidePanel.Instance.open(item.url, { allowedChangeHistory: false });
				}
				else
				{
					BX.Helper.show('redirect=detail&code=16615982');
				}

				break;
			}

			case 'pulse': {
				ajax.runAction('intranet.user.widget.getUserStatComponent', {
					mode: 'class'
				}).then((response) => {
					Runtime.html(null, response.data.html).then(() => {
						if (window['openIntranetUStat'])
						{
							openIntranetUStat();
						}
					});
				});

				break;
			}
		}
	}

	#getWorkTime(): ?HTMLElement
	{
		return this.cache.remember('worktime', () => {
			if (!this.getOptions().isTimemanAvailable)
			{
				return null;
			}

			if (!this.#getWorkTimeButton())
			{
				return null;
			}

			return Tag.render`
				<div class="intranet-avatar-widget-item__worktime">
					${this.#getWorkTimeButton()}
				</div>
			`;
		});
	}

	#getWorkTimeButton(): ?HTMLElement
	{
		return this.cache.remember('button', () => {
			try
			{
				return (new WorkTimeButton()).render();
			}
			catch (error)
			{
				console.error(error);

				return null;
			}
		});
	}

	#setEventHandlers(): void
	{
		EventEmitter.subscribe(
			'BX.Intranet.UserProfile:Avatar:changed',
			({ data: [{ url, userId }] }) => {
				if (this.getOptions().id > 0 && userId && this.getOptions().id.toString() === userId.toString())
				{
					const preparedUrl = encodeURI(url);
					this.getOptions().userPhotoSrc = preparedUrl;
					this.#getAvatar().setUserPic(preparedUrl);
				}
			},
		);
		EventEmitter.subscribe(
			'BX.Intranet.UserProfile:Name:changed',
			({ data: [{ fullName }] }) => {
				this.getOptions().fullName = fullName;
				this.#getFullName().innerHTML = fullName;
			},
		);
		EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:enabledAutoHide', () => {
			this.#activeOnclick = true;
		});
		EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:disabledAutoHide', () => {
			this.#activeOnclick = false;
		});
	}
}
