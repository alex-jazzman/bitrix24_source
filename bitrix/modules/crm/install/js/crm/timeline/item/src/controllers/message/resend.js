import { confirm } from 'crm.timeline.dialog';
import { Loc, Tag, Text } from 'main.core';

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
		const result = await confirm({
			title: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_MESSAGE_RESEND_CONFIRM_DIALOG_TITLE'),
			content: Tag.render`<div>${Text.encode(Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_MESSAGE_RESEND_CONFIRM_DIALOG_MESSAGE'))}</div>`,
			preset: 'OK_CANCEL',
			confirmText: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_OK_BTN'),
		});
		if (result !== 'confirm')
		{
			return true;
		}
	}

	menuBar.scrollIntoView();
	menuBar.setActiveItemById('message');
	void messageItem.tryToResend(params);

	return true;
}
