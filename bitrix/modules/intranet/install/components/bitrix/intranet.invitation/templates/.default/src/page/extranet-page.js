import { Tag, Loc } from 'main.core';
import { Analytics } from '../analytics';
import { InputRowFactory } from '../input-row-factory';
import { RestoreFiredUsersPopup } from '../popup/restore-fired-users-popup';
import { Page } from './page';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { InputRow } from '../elements/input-row';
import { Transport } from '../transport';
import DepartmentControl, { EntityType } from 'intranet.department-control';
import { EventEmitter } from 'main.core.events';

export class ExtranetPage extends Page
{
	#container: HTMLElement;
	#inputsFactory: InputRowFactory;
	#inputsRows: Array;
	#transport: Transport;
	#departmentControl: DepartmentControl;

	constructor(options)
	{
		super();
		this.#inputsRows = [];
		this.#transport = options.transport;
		this.#inputsFactory = options.inputsFactory instanceof InputRowFactory ? options.inputsFactory : null;
		this.#departmentControl = options.departmentControl instanceof DepartmentControl ? options.departmentControl : null;
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		const rowsContainer = Tag.render`
			<div class="intranet-invite-form-rows-container"></div>
		`;

		for (let i = 0; i < 2; i++)
		{
			const inputsRow = this.#inputsFactory.createInputsRow(i);
			this.#inputsRows.push(inputsRow);
			inputsRow.renderTo(rowsContainer);
		}

		this.#container = Tag.render`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${this.#departmentControl.render()}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_SMS_INVITATION_TITLE')}</span>
					${rowsContainer}
					${this.#getAddButton(rowsContainer).render()}
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;

		return this.#container;
	}

	#getInviteButton(): Button
	{
		const inviteButton = new Button({
			useAirDesign: true,
			text: Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
			style: AirButtonStyle.FILLED,
			props: {
				'data-test-id': 'invite-extranet-page-submit-button',
			},
			onclick: () => {
				if (inviteButton.isWaiting())
				{
					return;
				}

				inviteButton.setState(ButtonState.WAITING);

				this.#transport.send({
					action: 'extranet',
					data: {
						invitations: this.#getEnteredInvitations(),
						tab: 'email',
						workgroupIds: this.#departmentControl.getAllValues()[EntityType.EXTRANET],
					},
					analyticsLabel: {
						INVITATION_TYPE: 'extranet',
						INVITATION_COUNT: this.#getEnteredInvitations().length,
					},
				}).then((response) => {
					if (response.data.invitedUserIds.length > 0)
					{
						EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
					}

					this.#inputsRows.forEach((inputRow: InputRow) => {
						inputRow.clear();
					});
					inviteButton.setState(null);

					if (response.data.firedUserList && response.data.firedUserList.length > 0)
					{
						(new RestoreFiredUsersPopup({
							userList: response.data.firedUserList,
							isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
							transport: this.#transport,
						})).show();
					}
				}).catch((reject) => {
					inviteButton.setState(null);
				});
			},
		});

		return inviteButton;
	}

	#getAddButton(rowsContainer: HTMLElement): Button
	{
		return new Button({
			useAirDesign: true,
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MORE'),
			style: AirButtonStyle.PLAIN_ACCENT,
			icon: BX.UI.IconSet.Outline.CIRCLE_PLUS,
			props: {
				'data-test-id': 'invite-extranet-page-add-more-button',
			},
			onclick: () => {
				const inputsRow = this.#inputsFactory.createInputsRow();
				this.#inputsRows.push(inputsRow);
				inputsRow.renderTo(rowsContainer);
			},
		});
	}

	#getEnteredInvitations(): Array
	{
		const result = [];

		this.#inputsRows.forEach((inputRow: InputRow) => {
			if (!inputRow.isEmpty())
			{
				result.push(inputRow.getValue());
			}
		});

		return result;
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_EXTRANET;
	}
}
