import { confirm } from 'crm.timeline.dialog';
import { Loc, Tag, Text, Type } from 'main.core';

import ConfigurableItem from '../configurable-item';
import { type ActionParams, Base } from './base';
import { tryToResendWithMessage } from './message/resend';

declare type SmsParams = {
	text: string,
	senderCode: string,
	senderId: string,
	from: string,
	client: Object,
}

export class Sms extends Base
{
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Activity:Sms:Resend' && Type.isPlainObject(actionData.params))
		{
			void this.#resendSms(actionData.params);
		}
	}

	async #resendSms(params: SmsParams): Promise<void>
	{
		const messageParams = {
			backend: {
				senderCode: params.senderCode,
				id: params.senderId,
			},
			fromId: params.from,
			client: params.client,
			text: params.text,
		};

		if (await tryToResendWithMessage(messageParams))
		{
			return;
		}

		const menuBar = BX.Crm?.Timeline?.MenuBar?.getDefault();
		if (!menuBar)
		{
			throw new Error('"BX.Crm?.Timeline.MenuBar" component not found');
		}

		const smsItem = menuBar.getItemById('sms');
		if (!smsItem)
		{
			throw new Error('"BX.Crm.Timeline.MenuBar.Sms" component not found');
		}

		const goToEditor = (): void => {
			menuBar.scrollIntoView();
			menuBar.setActiveItemById('sms');
			smsItem.tryToResend(params.senderId, params.from, params.client, params.text);
		};
		const { text, templateId } = smsItem.getSendData();
		if (Type.isStringFilled(text) || templateId !== null)
		{
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
			confirm({
				title: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_TITLE'),
				content: Tag.render`<div>${Text.encode(Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_MESSAGE'))}</div>`,
				preset: 'OK_CANCEL',
				confirmText: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SMS_RESEND_CONFIRM_DIALOG_OK_BTN'),
				onConfirm: () => goToEditor(),
			});
		}
		else
		{
			goToEditor();
		}
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return (item.getType() === 'Activity:Sms');
	}
}
