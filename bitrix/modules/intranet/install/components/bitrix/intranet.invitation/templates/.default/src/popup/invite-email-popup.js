import { Loc, Tag } from 'main.core';
import { CloseIconSize, Popup } from 'main.popup';
import { Button, ButtonState, AirButtonStyle } from 'ui.buttons';
import { InvitationInput } from 'intranet.invitation-input';
import DepartmentControl from 'intranet.department-control';
import { Transport } from '../transport';
import InviteType from '../type/invite-type';
import { EventEmitter } from 'main.core.events';
import { Analytics } from '../analytics';
import { RestoreFiredUsersPopup } from './restore-fired-users-popup';

export class InviteEmailPopup
{
	#popup: Popup;
	#input: InvitationInput;
	#sendButton: Button;
	#departmentControl: DepartmentControl;
	#inviteType: InviteType;
	#analytics: Analytics;
	#transport: Transport;

	constructor(options)
	{
		this.#departmentControl = options.departmentControl;
		this.#inviteType = options.inviteType;
		this.#analytics = options.analytics;
		this.#transport = options.transport;
	}

	show(): void
	{
		this.#getPopup().show();
	}

	#getInput(): InvitationInput
	{
		this.#input ??= new InvitationInput({
			id: 'invite-page-popup-invitation-input',
			inputType: this.#inviteType,
			onReadySave: this.onReadySaveInputHandler.bind(this),
			onUnreadySave: this.onUnreadySaveInputHandler.bind(this),
			placeholder: this.#getPlaceholder(),
		});

		return this.#input;
	}

	#getPlaceholder(): string
	{
		switch (this.#inviteType)
		{
			case InviteType.EMAIL:
				return Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_PLACEHOLDER');
			case InviteType.PHONE:
				return Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_PHONE_PLACEHOLDER');
			case InviteType.ALL:
			default:
				return Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_OR_PHONE_PLACEHOLDER');
		}
	}

	#getPopup(): Popup
	{
		this.#popup ??= new Popup({
			content: this.#getPopupContent(),
			id: 'email-invitation-email',
			className: 'email-invitation-container',
			closeIcon: true,
			autoHide: false,
			closeByEsc: true,
			width: 515,
			closeIconSize: CloseIconSize.LARGE,
			padding: 0,
			overlay: {
				backgroundColor: 'rgba(0, 32, 78, 0.46)',
			},
		});

		return this.#popup;
	}

	#getPopupContent(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-invitation-popup">
				<div class="intranet-invitation-popup__title">
					<span class="ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_TITLE')}</span>
				</div>
				<div class="intranet-invitation-popup__body">
					<p class="intranet-invitation-description ui-text --sm">
						${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_DESCRIPTION_MSGVER_1')}
					</p>
					<div class="email-popup-container__input">
						${this.#getInput().render()}
					</div>
				</div>
				<div class="intranet-invitation-popup__footer">
					${this.#getActionContent()}
				</div>
			</div>
		`;
	}

	#getActionContent(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-invitation-popup__footer-button-container">
				${this.#getSendButton().render()}
				${this.#getCancelButton().render()}
			</div>
		`;
	}

	#getSendButton(): Button
	{
		this.#sendButton ??= new Button({
			id: 'invite-popup-send-button',
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_ACTION_SEND'),
			state: ButtonState.DISABLED,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => {
				if (this.#sendButton.getState() === ButtonState.WAITING)
				{
					return;
				}

				this.#sendButton.setState(ButtonState.WAITING);
				this.#getInput().inviteToDepartmentGroup(
					this.#departmentControl.getValues(),
					this.#departmentControl.getGroupValues(),
					this.#analytics.getDataForAction('mass'),
				)
					.then((response) => {
						if (response.data.invitedUserIds.length > 0)
						{
							EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
						}

						this.#getPopup().close();
						this.#sendButton.setState(null);

						if (response.data?.firedUserList && response.data?.firedUserList.length > 0)
						{
							(new RestoreFiredUsersPopup({
								userList: response.data.firedUserList,
								isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
								transport: this.#transport,
							})).show();
						}
					})
					.catch(() => {
						this.#sendButton.setState(null);
					});
			},
		});

		return this.#sendButton;
	}

	#getCancelButton(): Button
	{
		return new Button({
			id: 'invite-popup-cancel-button',
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_ACTION_CANCEL'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			onclick: () => this.#getPopup().close(),
		});
	}

	onReadySaveInputHandler(): void
	{
		this.#getSendButton().setState(null);
	}

	onUnreadySaveInputHandler(): void
	{
		this.#getSendButton().setState(ButtonState.DISABLED);
	}
}
