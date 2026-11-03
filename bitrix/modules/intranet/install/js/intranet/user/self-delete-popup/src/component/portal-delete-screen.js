import { Loc } from 'main.core';
import { Button } from 'ui.buttons';

import { BaseScreen } from './base-screen';
import { SelfDeletePopupElementId } from '../const';

export class PortalDeleteScreen extends BaseScreen
{
	getTitle(): string
	{
		return Loc.getMessage('INTRANET_SELF_DELETE_POPUP_TITLE_PROFILE_DELETE');
	}

	getDescriptionMessages(): Array<string>
	{
		return [
			Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_LAST_ADMIN'),
			Loc.getMessage('INTRANET_SELF_DELETE_POPUP_MESSAGE_LAST_ADMIN_PORTAL_DELETE'),
		];
	}

	getButtons(): Array<Button>
	{
		return [
			this.createButton({
				id: SelfDeletePopupElementId.ContinueButton,
				text: Loc.getMessage('INTRANET_SELF_DELETE_POPUP_BUTTON_CONTINUE'),
				style: this.getFilledButtonStyle(),
				onClick: (button) => this.getActions().openPortalDelete(button),
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
