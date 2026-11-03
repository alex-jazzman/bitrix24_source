import { Loc } from 'main.core';
import { Button } from 'ui.buttons';

import { BaseScreen } from './base-screen';
import { SelfDeletePopupElementId } from '../const';

export class FreeLicenseScreen extends BaseScreen
{
	getTitle(): string
	{
		return Loc.getMessage('INTRANET_SELF_DELETE_POPUP_TITLE_CANNOT_DELETE');
	}

	getDescriptionMessages(): Array<string>
	{
		return [
			Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_FREE_LICENSE_FIRST'),
			Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_FREE_LICENSE_SECOND'),
		];
	}

	getButtons(): Array<Button>
	{
		return [
			this.createButton({
				id: SelfDeletePopupElementId.OpenSettingsButton,
				text: Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_OPEN_SETTINGS'),
				style: this.getFilledButtonStyle(),
				onClick: (button) => this.getActions().openPortalDelete(button),
			}),
			this.createButton({
				id: SelfDeletePopupElementId.TransferRightsButton,
				text: Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_TRANSFER_RIGHTS'),
				style: this.getOutlineButtonStyle(),
				onClick: (button) => this.getActions().openTransferRights(button),
			}),
		];
	}
}
