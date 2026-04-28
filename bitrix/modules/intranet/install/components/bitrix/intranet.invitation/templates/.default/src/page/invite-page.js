import { Event, Loc, Tag } from 'main.core';
import { Analytics } from '../analytics';
import DepartmentControl from 'intranet.department-control';
import { InputRowFactory } from '../input-row-factory';
import { Page } from './page';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { Transport } from '../transport';
import { EventEmitter } from 'main.core.events';
import InviteType from '../type/invite-type';
import { InviteEmailPopup } from '../popup/invite-email-popup';
import { InputRowsContainer } from '../elements/input-rows-container';
import { RestoreFiredUsersPopup } from '../popup/restore-fired-users-popup';

export type InvitePageOptions = {
	inputsFactory: InputRowFactory;
	departmentControl: DepartmentControl;
	transport: Transport;
	useLocalEmailProgram: boolean;
	inviteType: InviteType;
	showMassInviteButton: Boolean;
	analytics: Analytics;
}

export class InvitePage extends Page
{
	#container: HTMLElement;
	#inputsFactory: InputRowFactory;
	#departmentControl: DepartmentControl;
	#transport: Transport;
	#inviteType: InviteType;
	#inviteEmailPopup: InviteEmailPopup;
	#analytics: Analytics;
	#inputsRowsContainer: InputRowsContainer;
	#showMassInviteButton: Boolean;

	constructor(options: InvitePageOptions)
	{
		super();
		this.#inputsFactory = options.inputsFactory;
		this.#departmentControl = options.departmentControl;
		this.#transport = options.transport;
		this.#inviteType = options.inviteType;
		this.#showMassInviteButton = options.showMassInviteButton;
		this.#analytics = options.analytics;
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		this.#container = Tag.render`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${this.#departmentControl.render()}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_SMS_INVITATION_TITLE')}</span>
					${this.#getInputRowsContainer().render()}
					<span class="intranet-invitation-actions">
						${this.#getAddButton().render()}
						${this.#showMassInviteButton ? Tag.render`
							<span class="intranet-invitation-description ui-text --sm">
								${Loc.getMessage('INTRANET_INVITE_DIALOG_OR')}
							</span>
							${this.#renderMassInviteButton()}
						` : ''}
					</span>
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;

		return this.#container;
	}

	#getInputRowsContainer(): InputRowsContainer
	{
		if (this.#inputsRowsContainer)
		{
			return this.#inputsRowsContainer;
		}

		const inputsRows = [];

		for (let i = 0; i < 2; i++)
		{
			const inputsRow = this.#inputsFactory.createInputsRow(i);
			inputsRows.push(inputsRow);
		}

		this.#inputsRowsContainer = new InputRowsContainer(inputsRows);

		return this.#inputsRowsContainer;
	}

	#renderMassInviteButton(): HTMLElement
	{
		const button = Tag.render`
			<span data-test-id="invite-invite-page-open-invite-popup-button" class="ui-link ui-link-secondary ui-link-dashed ui-text --sm">
				${Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MASSIVE')}
			</span>
		`;
		Event.bind(button, 'click', this.#openMassInvitePopup.bind(this));

		return button;
	}

	#openMassInvitePopup(): void
	{
		if (!this.#inviteEmailPopup)
		{
			this.#inviteEmailPopup = new InviteEmailPopup({
				departmentControl: this.#departmentControl,
				inviteType: this.#inviteType,
				analytics: this.#analytics,
				transport: this.#transport,
			});
		}

		this.#analytics.sendOpenMassInvitePopup(this.#inviteType);
		this.#inviteEmailPopup.show();
	}

	#getInviteButton(): Button
	{
		const inviteButton = new Button({
			useAirDesign: true,
			text: Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
			style: AirButtonStyle.FILLED,
			props: {
				'data-test-id': 'invite-invite-page-submit-button',
			},
			onclick: () => {
				if (inviteButton.isWaiting() || this.#inputsRowsContainer.hasError())
				{
					return;
				}

				if (this.#inputsRowsContainer.isInvitationInputRowsEmpty())
				{
					EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:onError', {
						error: this.#getEmptyError(),
					});

					return;
				}

				EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:clearError');

				inviteButton.setState(ButtonState.WAITING);

				this.#transport.send(
					{
						action: 'inviteWithGroupDp',
						data: {
							invitations: this.#inputsRowsContainer.getEnteredInvitations(),
							departmentIds: this.#departmentControl.getValues(),
							workgroupIds: this.#departmentControl.getGroupValues(),
							tab: 'email',
						},
					},
					(reject) => {
						inviteButton.setState(null);
						let handled = false;

						if (reject.errors)
						{
							handled = this.#handleErrors(reject.errors);
						}

						if (!handled)
						{
							this.#transport.onError(reject);
						}
					},
					this.#analytics.getDataForAction('default'),
				).then((response) => {
					if (response.data.invitedUserIds.length > 0)
					{
						EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
					}

					this.#inputsRowsContainer.clearAll();
					inviteButton.setState(null);

					if (response.data?.firedUserList && response.data?.firedUserList.length > 0)
					{
						(new RestoreFiredUsersPopup({
							userList: response.data.firedUserList,
							isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
							transport: this.#transport,
						})).show();
					}
				}).catch((reject) => {
					console.error(reject);
				});
			},
		});

		return inviteButton;
	}

	#handleErrors(errors: Array): boolean
	{
		let handled = false;

		errors.forEach((error) => {
			if (error.code === 'EMAIL_EXIST_ERROR')
			{
				this.#inputsRowsContainer.highlightErrorInputs(error.customData.emailList, Loc.getMessage('INTRANET_INVITE_DIALOG_INPUT_EMAIL_EXIST_ERROR'));
				handled = true;
			}

			if (error.code === 'PHONE_EXIST_ERROR')
			{
				this.#inputsRowsContainer.highlightErrorInputs(error.customData.phoneList, Loc.getMessage('INTRANET_INVITE_DIALOG_INPUT_PHONE_EXIST_ERROR'));
				handled = true;
			}

			if (error.code === 'EMAIL_INVALID_ERROR')
			{
				this.#inputsRowsContainer.highlightErrorInputs(error.customData.emailList, Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL'));
				handled = true;
			}

			if (error.code === 'PHONE_INVALID_ERROR')
			{
				this.#inputsRowsContainer.highlightErrorInputs(error.customData.phoneList, Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_PHONE'));
				handled = true;
			}
		});

		return handled;
	}

	#getAddButton(): Button
	{
		return new Button({
			useAirDesign: true,
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MORE'),
			style: AirButtonStyle.PLAIN_ACCENT,
			icon: BX.UI.IconSet.Outline.CIRCLE_PLUS,
			props: {
				'data-test-id': 'invite-invite-page-add-more-button',
			},
			onclick: () => {
				const inputsRow = this.#inputsFactory.createInputsRow();
				this.#inputsRowsContainer.addRow(inputsRow);
			},
		});
	}

	#getEmptyError(): string
	{
		switch (this.#inviteType)
		{
			case InviteType.EMAIL:
				return Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_EMAIL');
			case InviteType.PHONE:
				return Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_PHONE');
			case InviteType.ALL:
			default:
				return Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_EMAIL_AND_PHONE');
		}
	}

	getAnalyticTab(): string
	{
		return this.#inviteType === InviteType.PHONE ? Analytics.TAB_PHONE : Analytics.TAB_EMAIL;
	}
}
