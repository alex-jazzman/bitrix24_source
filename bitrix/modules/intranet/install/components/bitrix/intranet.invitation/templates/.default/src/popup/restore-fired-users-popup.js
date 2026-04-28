import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { CloseIconSize, Popup } from 'main.popup';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { Text } from 'ui.system.typography';
import type { Transport } from '../transport';
import { AvatarRound, AvatarRoundGuest, AvatarRoundExtranet } from 'ui.avatar';

export type RestoreFiredUsersPopupOptionsType = {
	userList: Array,
	isRestoreUsersAccessAvailable: Boolean,
	transport: Transport,
}

export class RestoreFiredUsersPopup
{
	#popup: Popup;
	#sendButton: Button;
	#userList: Array;
	#selectedUserIds: Array;
	#transport: Transport;
	#popupContainer: ?HTMLElement;
	#isMultipleMode: Boolean;
	#isRestoreUsersAccessAvailable: Boolean;

	constructor(options: RestoreFiredUsersPopupOptionsType)
	{
		this.#userList = options.userList;
		this.#isRestoreUsersAccessAvailable = options.isRestoreUsersAccessAvailable;
		this.#transport = options.transport;
		this.#isMultipleMode = this.#userList.length > 1;
		this.#selectedUserIds = this.#userList.map((user) => user.id);
	}

	show(): void
	{
		if (Type.isArray(this.#userList) && this.#userList.length > 0)
		{
			this.#getPopup().show();
		}
	}

	#getPopup(): Popup
	{
		this.#popup ??= new Popup({
			id: 'intranet-restore-fired-users',
			content: this.#isRestoreUsersAccessAvailable
				? this.#getPopupContent()
				: this.#getPopupContentWithoutRestoreAccess(),
			closeByEsc: true,
			closeIcon: true,
			closeIconSize: CloseIconSize.LARGE,
			autoHide: true,
			padding: 25,
			width: this.#isRestoreUsersAccessAvailable ? 515 : 400,
			events: {
				onPopupClose: () => {
					this.#popup.destroy();
				},
			},
		});

		return this.#popup;
	}

	#getPopupContentWithoutRestoreAccess(): HTMLElement
	{
		const button = new Button({
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_OK'),
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => {
				this.#getPopup().close();
			},
		}).render();

		return Tag.render`
			<div>
				<span class="ui-text --lg">
					${this.#isMultipleMode
						? Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_NO_ACCESS_MULTIPLE', {
							'#LOGIN#': `<strong>${this.#userList.map((user) => user.login).join(', ')}</strong>`,
						})
						: Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_NO_ACCESS_SINGLE', {
							'#LOGIN#': `<strong>${this.#userList[0]?.login}</strong>`,
						})
					}
				</span>
				<div class="intranet-invitation-popup__footer">
					${button}
				</div>
			</div>
		`;
	}

	#getPopupContent(): HTMLElement
	{
		this.#popupContainer = Tag.render`
			<div class="" data-role="intranet-invitation-fired-popup-container"></div>
		`;

		const headTitle = Tag.render`
			<span class="ui-text --md">
				${this.#isMultipleMode
					? Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_TITLE_MULTIPLE')
					: Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_TITLE_SINGLE', {
						'#LOGIN#': `<strong>${this.#userList[0]?.login}</strong>`,
					})
				}
			</span>
		`;
		Dom.append(headTitle, this.#popupContainer);

		const wrapper = Tag.render`
			<div class="intranet-invitation-fired-popup-wrapper"></div>
		`;

		this.#userList.forEach((user) => {
			Dom.append(this.#getUserBlockContent(user), wrapper);
		});

		Dom.append(wrapper, this.#popupContainer);

		const buttons = Tag.render`
			<div class="intranet-invitation-popup__footer">
				${this.#getActionContent()}
			</div>
		`;

		Dom.append(buttons, this.#popupContainer);

		return this.#popupContainer;
	}

	#getUserRole(user: Object): HTMLElement
	{
		let roleNode = Tag.render``;

		if (user.role === 'collaber')
		{
			roleNode = Tag.render`
				<span class="ui-text --3xs intranet-invitation-fired-popup-user__name-role --collaber">
					${Loc.getMessage('INTRANET_INVITE_DIALOG_USER_ROLE_COLLABER')}
				</span>
			`;
		}

		if (user.role === 'extranet')
		{
			roleNode = Tag.render`
				<span class="ui-text --3xs intranet-invitation-fired-popup-user__name-role --extranet">
					${Loc.getMessage('INTRANET_INVITE_DIALOG_USER_ROLE_EXTRANET')}
				</span>
			`;
		}

		return roleNode;
	}

	#getUserBlockContent(user: Object): HTMLElement
	{
		let checkboxNode = Tag.render``;

		if (this.#isMultipleMode)
		{
			checkboxNode = Tag.render`
				<div style="margin-left: 10px;">
					<input 
						type="checkbox" 
						checked 
						class="intranet-invitation-checkbox" 
						value="${user?.id}"
					/>
				</div>
			`;
		}

		const userBlock = Tag.render`
			<div class="intranet-invitation-fired-popup-user__wrapper ${this.#isMultipleMode ? '--filled' : ''}">
				${checkboxNode}
				<div>
					${this.#renderUserAvatar(user)}
				</div>
				<div class="intranet-invitation-fired-popup-user__name-block ${this.#isMultipleMode ? '' : '--wide'}">
					<a href="${user.profileUrl}" class="ui-link ui-link-dashed" style="font-size:16px;">${user.name}</a>
					<div>${Text.render(user?.position, { size: '2xs', className: 'intranet-invitation-fired-popup-user__text' })}</div>
					${this.#getUserRole(user)}
				</div>
				<div>
					${
						user?.email
							? Tag.render`<a href="mailto:${user.email}" class="ui-link ui-link-dashed">${user.email}</a>`
							: ''
					}
					<div>${Text.render(user?.phoneNumber, { size: '2xs', className: 'intranet-invitation-fired-popup-user__text' })}</div>
				</div>
			</div>
		`;

		this.#bindCheckboxChange(userBlock);

		return userBlock;
	}

	#bindCheckboxChange(userBlock: HTMLElement): void
	{
		const checkbox = userBlock.querySelector('input[type="checkbox"]');

		Event.bind(checkbox, 'change', () => {
			const userId = Number(checkbox.value);

			if (checkbox.checked)
			{
				Dom.addClass(userBlock, '--filled');
				if (!this.#selectedUserIds.includes(userId))
				{
					this.#selectedUserIds.push(userId);
				}
			}
			else
			{
				Dom.removeClass(userBlock, '--filled');
				this.#selectedUserIds = this.#selectedUserIds.filter((id) => id !== userId);
			}

			this.#checkSendButtonState();
		});
	}

	#renderUserAvatar(user: Object): HTMLElement
	{
		const avatarWrapper = Tag.render`<div class='intranet-invitation-fired-popup-user__avatar-wrapper'></div>`;
		const avatarOptions = {
			size: 40,
			userpicPath: user?.photo ?? null,
		};
		let avatar = null;

		if (user.role === 'collaber')
		{
			avatar = new AvatarRoundGuest(avatarOptions);
		}
		else if (user.role === 'extranet')
		{
			avatar = new AvatarRoundExtranet(avatarOptions);
		}
		else
		{
			avatar = new AvatarRound(avatarOptions);
		}

		avatar.renderTo(avatarWrapper);

		return avatarWrapper;
	}

	#getActionContent(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-invitation-popup__footer-button-container">
				${this.#getSendButton().render()}
				${this.#getPassLoginButton().render()}
			</div>
		`;
	}

	#checkSendButtonState(): void
	{
		if (this.#selectedUserIds.length > 0)
		{
			this.#sendButton.setState(ButtonState.ACTIVE);
		}
		else
		{
			this.#sendButton.setState(ButtonState.DISABLED);
		}
	}

	#getSendButton(): Button
	{
		this.#sendButton ??= new Button({
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_RESTORE'),
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => {
				const currentButtonState = this.#sendButton.getState();

				if (currentButtonState === ButtonState.WAITING || currentButtonState === ButtonState.DISABLED)
				{
					return;
				}

				this.#sendButton.setState(ButtonState.WAITING);

				this.#transport.send(
					{
						action: 'restoreFiredUsers',
						data: {
							userIds: this.#isMultipleMode ? this.#selectedUserIds : [this.#userList[0].id],
						},
					},
					{ showSuccessPopup: false },
				).then((response) => {
					this.#getPopup().close();
					this.#showSuccessNotification(response.data.restoredUserIds);
				}).catch((reject) => {
					console.error(reject);
				});
			},
		});

		return this.#sendButton;
	}

	#getPassLoginButton(): Button
	{
		return new Button({
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_PASS_LOGIN'),
			useAirDesign: true,
			style: AirButtonStyle.PLAIN,
			onclick: () => {
				if (top.BX.Helper)
				{
					top.BX.Helper.show('redirect=detail&code=17964466');
				}
			},
		});
	}

	#showSuccessNotification(restoredUserIds: Array): void
	{
		const restoredUserIdsNumeric = new Set(restoredUserIds.map((id) => Number(id)));
		const restoredUsers = this.#userList.filter((user) => restoredUserIdsNumeric.has(user.id));

		const notificationOptions = {
			id: 'restore-notification-success',
			autoHideDelay: 4000,
			closeButton: false,
			autoHide: true,
			content: this.#getNotificationContent(restoredUsers),
			useAirDesign: true,
		};

		const notify = BX.UI.Notification.Center.notify(notificationOptions);
		notify.show();
		notify.activateAutoHide();
	}

	#getNotificationContent(restoredUsers: Array): HTMLElement
	{
		return Tag.render`
			<div class="invite-email-notification">
				<div class="invite-email-notification__content">
					<div class="invite-email-notification__description ui-text --2xs">
						${restoredUsers.length > 1
							? Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_SUCCESS_NOTIFICATION_MULTIPLE', {
								'#NAME#': `<strong>${restoredUsers[0]?.name}</strong>`,
								'#NUM#': restoredUsers.length - 1,
							})
							: Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_SUCCESS_NOTIFICATION_SINGLE', {
								'#NAME#': `<strong>${restoredUsers[0]?.name}</strong>`,
							})
						}
					</div>
				</div>
			</div>
		`;
	}
}
