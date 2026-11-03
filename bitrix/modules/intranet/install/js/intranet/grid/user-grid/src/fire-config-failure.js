import { Loc } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

export function showFireConfigFailure(): void
{
	MessageBox.show({
		title: Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_CONFIG_ERROR_TITLE'),
		message: Loc.getMessage('INTRANET_USER_LIST_GROUP_ACTION_FIRE_CONFIG_ERROR_MESSAGE'),
		buttons: MessageBoxButtons.YES,
		yesCaption: Loc.getMessage('INTRANET_USER_LIST_ACTION_UNDERSTOOD_BUTTON'),
		onYes: (messageBox) => {
			messageBox.close();
		},
	});
}
