import { Tag, Loc } from 'main.core';
import { Analytics } from '../analytics';
import DepartmentControl from 'intranet.department-control';
import MassInvitationField from '../mass-invitation-field';
import { Page } from './page';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';

export class MassPage extends Page
{
	#container: HTMLElement;
	#massInvitationField: MassInvitationField;
	#departmentControl: DepartmentControl;

	constructor(options)
	{
		super();
		this.#massInvitationField = new MassInvitationField({
			placeholder: '',
			smsAvailable: false,
		});
		this.#departmentControl = options.departmentControl instanceof DepartmentControl ? options.departmentControl : null;
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
					<span class="intranet-invitation-status__title ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INVITATION_TITLE')}</span>
					${this.#massInvitationField.render()}
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
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_TITLE_EMAIL_MSGVER_1'),
			style: AirButtonStyle.FILLED,
			onclick: () => {
				if (inviteButton.getState() === ButtonState.WAITING)
				{
					return;
				}

				inviteButton.setState(ButtonState.WAITING);

				this.#massInvitationField.invite(this.#departmentControl.getValues())
					.then(() => {
						inviteButton.setState(null);
					})
					.catch(() => {
						inviteButton.setState(null);
					});
			},
		});

		return inviteButton;
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_MASS;
	}
}
