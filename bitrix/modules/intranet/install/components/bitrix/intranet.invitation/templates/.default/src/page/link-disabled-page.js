import { Tag, Loc, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Analytics } from '../analytics';
import { Transport } from '../transport';
import { Page } from './page';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';

export class LinkDisabledPage extends Page
{
	#container: HTMLElement;
	#isAdmin: boolean;
	#transport: Transport;

	constructor(options)
	{
		super();
		this.#isAdmin = options.isAdmin === true;
		this.#transport = options.transport;
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		this.#container = Tag.render`
			<div class="intranet-invitation-block" data-role="self-block"></div>
		`;

		const statusBlock = Tag.render`
			<div class="intranet-invitation-status --invite-link-disabled">
				<div class="intranet-invitation-status__content">
					<span class="intranet-invitation-status__title ui-headline --md">${Loc.getMessage('INTRANET_INVITE_ALERT_INVITATION_LINK_DISABLED')}</span>
					<p class="intranet-invitation-status__description ui-text --lg">
						${Loc.getMessage(this.#isAdmin ? 'INTRANET_INVITE_DIALOG_STATUS_INVITATION_LINK_DISABLE_DESCRIPTION' : 'INTRANET_INVITE_DIALOG_STATUS_INVITATION_LINK_DISABLE_DESCRIPTION_NOT_ADMIN')}
					</p>
				</div>
			</div>
		`;

		if (this.#isAdmin)
		{
			Dom.append(Tag.render`
				<div class="intranet-invitation-status__footer">${this.#getEnableButton().render()}</div>
			`, statusBlock);
		}

		Dom.append(Tag.render`
			<div class="intranet-invitation-block__content">
				${statusBlock}
			</div>
		`, this.#container);

		return this.#container;
	}

	#getEnableButton(): Button
	{
		const enableButton = new Button({
			useAirDesign: true,
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_ENABLE_BUTTON'),
			style: AirButtonStyle.FILLED,
			props: {
				'data-test-id': 'invite-link-page-enable-button',
			},
			onclick: () => {
				if (enableButton.isWaiting())
				{
					return;
				}

				enableButton.setState(ButtonState.WAITING);
				this.#transport.send({
					action: 'self',
					data: {
						allow_register: 'Y',
					},
				}).then(() => {
					enableButton.setState(null);
					EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:selfChange', {
						selfEnabled: true,
					});
				}).catch(() => {
					enableButton.setState(null);
				});
			},
		});

		return enableButton;
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_LINK;
	}
}
