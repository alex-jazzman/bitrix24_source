import { Loc, Tag, Type, Event } from 'main.core';
import { Analytics } from '../analytics';
import DepartmentControl from 'intranet.department-control';
import { Transport } from '../transport';
import { InviteEmailPopup } from '../popup/invite-email-popup';
import { Page } from './page';
import { AirButtonStyle, Button } from 'ui.buttons';
import InviteType from '../type/invite-type';

export type LocalEmailPageType = {
	departmentControl: DepartmentControl,
	transport: Transport,
	linkRegisterEnabled: boolean,
	analytics: Analytics,
}

export class LocalEmailPage extends Page
{
	#container: HTMLElement;
	#departmentControl: DepartmentControl;
	#inviteEmailPopup: InviteEmailPopup = null;
	#analytics: Analytics = null;
	#transport: Transport;
	#needConfirmRegistration: boolean;

	constructor(options: LocalEmailPageType)
	{
		super();

		this.#departmentControl = options.departmentControl instanceof DepartmentControl ? options.departmentControl : null;
		this.#analytics = options.analytics;
		this.#transport = options.transport;
		this.#needConfirmRegistration = options.needConfirmRegistration === true;
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
					<ol class="intranet-invitation-list ui-text --md">
						<li class="intranet-invitation-list-item">${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_CONTENT_STEP_1')}</li>
						<li class="intranet-invitation-list-item">${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_CONTENT_STEP_2')}</li>
						<li class="intranet-invitation-list-item">${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_CONTENT_STEP_3')}</li>
						<li class="intranet-invitation-list-item">${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_CONTENT_STEP_4')}</li>
					</ol>
					${this.#renderDescription()}
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;

		return this.#container;
	}

	#renderDescription(): HTMLElement
	{
		const description = Tag.render`
			<span class="intranet-invitation-description ui-text --md">
				${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_SERVICE_MSGVER_1', {
					'[LINK]': '<span class="ui-link ui-link-secondary ui-link-dashed ui-text --md">',
					'[/LINK]': '</span>',
				})}
			</span>
		`;

		const link = description.querySelector('.ui-link');

		if (Type.isDomNode(link))
		{
			Event.bind(link, 'click', this.#openEmailInputPopup.bind(this));
		}

		return description;
	}

	#getInviteButton(): Button
	{
		return new Button({
			useAirDesign: true,
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_TITLE_EMAIL_MSGVER_1'),
			style: AirButtonStyle.FILLED,
			onclick: this.#onSubmitWithLocalEmailProgram.bind(this),
			props: {
				'data-test-id': 'invite-local-email-program-button',
			},
		});
	}

	#openEmailInputPopup(): void
	{
		if (!this.#inviteEmailPopup)
		{
			this.#inviteEmailPopup = new InviteEmailPopup({
				id: 'open-invite-popup',
				departmentControl: this.#departmentControl,
				inviteType: InviteType.EMAIL,
				transport: this.#transport,
				analytics: this.#analytics,
			});
		}

		this.#analytics.sendOpenMassInvitePopup(InviteType.EMAIL);
		this.#inviteEmailPopup.show();
	}

	#onSubmitWithLocalEmailProgram(): void
	{
		const departmentsId = this.#departmentControl.getValues();

		this.#transport.send({
			action: 'getInviteLink',
			data: {
				departmentsId,
				analyticsType: 'by_local_email_program',
			},
		}).then((response) => {
			const invitationUrl = response.data?.invitationLink;
			if (Type.isStringFilled(invitationUrl))
			{
				this.#openLocalMailProgram(invitationUrl);
			}
		}).catch((reject) => {});
	}

	#openLocalMailProgram(invitationUrl: string): void
	{
		this.#analytics.sendLocalEmailProgram(this.#departmentControl, this.#needConfirmRegistration);
		const subject = `subject=${encodeURIComponent(Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_SUBJECT'))}`;
		const body = `body=${encodeURIComponent(Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_BODY'))} ${invitationUrl}`;
		window.location = `mailto:?${subject}&${body}`;
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_LOCAL_EMAIL;
	}
}
