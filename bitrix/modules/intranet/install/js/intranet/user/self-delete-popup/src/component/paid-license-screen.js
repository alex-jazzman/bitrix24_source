import { Loc, Tag } from 'main.core';
import { Button } from 'ui.buttons';

import { BaseScreen } from './base-screen';
import { SelfDeletePopupElementId } from '../const';

export class PaidLicenseScreen extends BaseScreen
{
	getTitle(): string
	{
		return Loc.getMessage('INTRANET_SELF_DELETE_POPUP_TITLE_TRANSFER_RIGHTS');
	}

	getDescriptionMessages(): Array<string>
	{
		return [
			Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_PAID_LICENSE_FIRST'),
		];
	}

	renderDescription(): Array<HTMLElement>
	{
		const paidLicenseMessage = Loc.getMessage(
			'INTRANET_SELF_DELETE_POPUP_MESSAGE_PAID_LICENSE_SECOND',
			this.#createSupportEmailLinkReplacements(),
		);

		return [
			...super.renderDescription(),
			Tag.render`
				<p class="intranet-self-delete-popup__paragraph">
					<span class="ui-text --md">
						${paidLicenseMessage}
					</span>
				</p>
			`,
		];
	}

	#createSupportEmailLinkReplacements(): Object
	{
		return {
			'[EMAIL]': `
				<a
					href="mailto:${this.getOptions().supportEmail}"
					class="ui-text -md intranet-self-delete-popup__accent"
					data-testid="${SelfDeletePopupElementId.SupportEmailLink}"
				>${this.getOptions().supportEmail}
			`,
			'[/EMAIL]': '</a>',
		};
	}

	getButtons(): Array<Button>
	{
		return [
			this.createButton({
				id: SelfDeletePopupElementId.TransferRightsButton,
				text: Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_TRANSFER_RIGHTS'),
				style: this.getFilledButtonStyle(),
				onClick: (button) => this.getActions().openTransferRights(button),
			}),
			this.createButton({
				id: SelfDeletePopupElementId.CancelButton,
				text: Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CANCEL'),
				style: this.getOutlineButtonStyle(),
				onClick: () => this.getActions().cancel(),
			}),
		];
	}
}
