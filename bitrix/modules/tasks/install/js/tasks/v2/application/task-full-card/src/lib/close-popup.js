import { Loc } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

export class ClosePopup
{
	show(onOk: Function): void
	{
		MessageBox.show({
			useAirDesign: true,
			title: Loc.getMessage('TASKS_V2_TASK_FULL_CARD_CLOSE_POPUP_TITLE_MSGVER_1'),
			message: Loc.getMessage('TASKS_V2_TASK_FULL_CARD_CLOSE_POPUP_MESSAGE'),
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('TASKS_V2_TASK_FULL_CARD_CLOSE_POPUP_OK_CAPTION'),
			onOk,
			popupOptions: {
				closeIcon: false,
			},
		});
	}
}
