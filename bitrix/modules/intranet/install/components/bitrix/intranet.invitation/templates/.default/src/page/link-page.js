import { Tag, Loc, Type, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Analytics } from '../analytics';
import DepartmentControl from 'intranet.department-control';
import { Transport } from '../transport';
import { Page } from './page';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { LinkOptionsPopup } from '../popup/link-options-popup';

export class LinkPage extends Page
{
	#container: HTMLElement;
	#isAdmin: boolean;
	#isCloud: boolean;
	#needConfirmRegistration: boolean;
	#whiteList: string;
	#departmentControl: DepartmentControl;

	#linkRegisterEnabled: boolean;
	#analytics: Analytics;
	#transport: Transport;
	#optionsPopup: ?LinkOptionsPopup = null;

	constructor(options)
	{
		super();
		this.#isAdmin = options.isAdmin === true;
		this.#isCloud = options.isCloud === true;
		this.#needConfirmRegistration = options.needConfirmRegistration === true;
		this.#whiteList = Type.isStringFilled(options.whiteList) ? options.whiteList : '';
		this.#departmentControl = options.departmentControl instanceof DepartmentControl ? options.departmentControl : null;
		this.#linkRegisterEnabled = options.linkRegisterEnabled;
		this.#analytics = options.analytics;
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

		Dom.append(Tag.render`
			<div class="intranet-invitation-block__department-control">
				<div class="intranet-invitation-block__department-control-inner">${this.#departmentControl.render()}</div>
			</div>
		`, this.#container);

		const copyLinkButton = new Button({
			useAirDesign: true,
			text: Loc.getMessage('BX24_INVITE_DIALOG_COPY_LINK'),
			icon: BX.UI.IconSet.Outline.LINK,
			style: AirButtonStyle.FILLED,
			onclick: this.#copyRegisterUrl.bind(this),
			props: {
				'data-test-id': 'invite-link-page-copy-link-button',
			},
		});

		Dom.append(Tag.render`
			<div class="intranet-invitation-block__content">
				<div class="intranet-invitation-block__footer">
					${copyLinkButton.render()}
					${this.#renderLinkOptionButton()}
				</div>
			</div>
		`, this.#container);

		return this.#container;
	}

	#copyRegisterUrl(copyLinkButton: Button): void
	{
		if (copyLinkButton.getState() === ButtonState.WAITING)
		{
			return;
		}

		copyLinkButton.setState(ButtonState.WAITING);
		this.#transport.send(
			{
				action: 'getInviteLink',
				data: {
					departmentsId: this.#departmentControl.getValues(),
					analyticsType: 'by_link',
				},
			},
			(reject) => {
				copyLinkButton.setState(null);
				this.#transport.onError(reject);
			},
		)
			.then((response) => {
				copyLinkButton.setState(null);
				const invitationUrl = response.data?.invitationLink;

				if (Type.isStringFilled(invitationUrl))
				{
					this.#copyToClipboard(invitationUrl)
						.then(() => {
							top.BX.UI.Notification.Center.notify({
								content: Loc.getMessage('BX24_INVITE_DIALOG_COPY_URL_MSGVER_2'),
								autoHideDelay: 4000,
								useAirDesign: true,
							});
						})
						.catch((e) => {
							console.log(e);
						});

					this.#analytics.sendCopyLink(this.#departmentControl, this.#needConfirmRegistration);
				}
			}).catch((reject) => {
				console.error(reject);
			});
	}

	async #copyToClipboard(textToCopy: string): Promise<void>
	{
		if (!Type.isString(textToCopy))
		{
			return Promise.reject();
		}

		// navigator.clipboard defined only if window.isSecureContext === true
		// so or https should be activated, or localhost address
		if (window.isSecureContext && navigator.clipboard)
		{
			// safari not allowed clipboard manipulation as result of ajax request
			// so timeout is hack for this, to prevent "not have permission"
			return new Promise((resolve, reject) => {
				setTimeout(() => (
					navigator.clipboard
						.writeText(textToCopy)
						.then(() => resolve())
						.catch((e) => reject(e))
				), 0);
			});
		}

		return BX.clipboard?.copy(textToCopy) ? Promise.resolve() : Promise.reject();
	}

	#renderLinkOptionButton(): HTMLElement | ''
	{
		if (!this.#isAdmin)
		{
			return '';
		}

		const onclick = () => {
			this.#getOptionsPopup().show();
		};

		return Tag.render`
			<span data-test-id="invite-link-page-option-button" onclick="${onclick}" class="ui-link ui-link-secondary ui-link-dashed">${Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS')}</span>
		`;
	}

	#getOptionsPopup(): LinkOptionsPopup
	{
		this.#optionsPopup ??= new LinkOptionsPopup({
			linkRegisterEnabled: this.#linkRegisterEnabled,
			needConfirmRegistration: this.#needConfirmRegistration,
			isCloud: this.#isCloud,
			transport: this.#transport,
			whiteList: this.#whiteList,
			analytics: this.#analytics,
			onDisable: () => {
				EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:selfChange', {
					selfEnabled: false,
				});
				this.#optionsPopup = null;
			},
		});

		return this.#optionsPopup;
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_LINK;
	}
}
