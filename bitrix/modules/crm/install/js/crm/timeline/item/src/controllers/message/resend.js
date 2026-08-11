import { Loc } from 'main.core';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

export async function tryToResendWithMessage(params): Promise<boolean>
{
	const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
	if (!menuBar)
	{
		return false;
	}

	const messageItem = menuBar.getItemById('message');
	if (!messageItem)
	{
		return false;
	}

	if (await messageItem.shouldConfirmStateChange(params))
	{
		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
		const { isCancelled } = await confirmStateChange();
		if (isCancelled)
		{
			return true;
		}
	}

	menuBar.scrollIntoView();
	menuBar.setActiveItemById('message');
	void messageItem.tryToResend(params);

	return true;
}

function confirmStateChange(): Promise<{ isCancelled: boolean }>
{
	return new Promise((resolve) => {
		MessageBox.show({
			modal: true,
			title: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_MESSAGE_RESEND_CONFIRM_DIALOG_TITLE'),
			message: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_MESSAGE_RESEND_CONFIRM_DIALOG_MESSAGE'),
			buttons: MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_OK_BTN'),
			onOk: (messageBox) => {
				messageBox.close();
				resolve({ isCancelled: false });
			},
			onCancel: (messageBox) => {
				messageBox.close();
				resolve({ isCancelled: true });
			},
		});
	});
}
