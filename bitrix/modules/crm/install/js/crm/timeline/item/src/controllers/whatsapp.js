import { Builder, Dictionary } from 'crm.integration.analytics';
import type { WhatsAppDeleteEvent as WhatsAppDeleteEventStructure } from 'crm.integration.types';
import { confirm } from 'crm.timeline.dialog';
import { Loc, Tag, Text, Type } from 'main.core';

import ConfigurableItem from '../configurable-item';
import { type ActionParams, Base } from './base';
import { tryToResendWithMessage } from './message/resend';

declare type WhatsAppParams = {
	senderCode: string,
	senderId: string,
	template: Object,
	from: string,
	client: Object,
}

export class WhatsApp extends Base
{
	getDeleteActionMethod(): string
	{
		return 'crm.timeline.activity.delete';
	}

	getDeleteActionCfg(recordId: Number, ownerTypeId: Number, ownerId: Number): Object
	{
		return {
			data: {
				activityId: recordId,
				ownerTypeId,
				ownerId,
				analytics: this.#buildAnalyticsData(),
			},
		};
	}

	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Activity:Whatsapp:Resend' && Type.isPlainObject(actionData.params))
		{
			void this.#resendWhatsApp(actionData.params);
		}
	}

	async #resendWhatsApp(params: WhatsAppParams): Promise<void>
	{
		const messageParams = {
			backend: {
				senderCode: params.senderCode,
				id: params.senderId,
			},
			fromId: params.from,
			client: params.client,
			template: params.template,
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

		const whatsAppItem = menuBar.getItemById('whatsapp');
		if (!whatsAppItem)
		{
			throw new Error('"BX.Crm.Timeline.MenuBar.WhatsApp" component not found');
		}

		const goToEditor = (): void => {
			menuBar.scrollIntoView();
			menuBar.setActiveItemById('whatsapp');
			whatsAppItem.tryToResend(params.template, params.from, params.client);
		};

		const templateId = params.template?.ORIGINAL_ID;
		const filledPlaceholders = params.template?.FILLED_PLACEHOLDERS ?? [];

		const currentTemplateId = whatsAppItem.getTemplate()?.ORIGINAL_ID;
		const currentFilledPlaceholders = whatsAppItem.getTemplate()?.FILLED_PLACEHOLDERS ?? [];

		if (
			Type.isNumber(templateId) && templateId > 0
			&& Type.isNumber(currentTemplateId) && currentTemplateId > 0
			&& (
				templateId !== currentTemplateId
				|| JSON.stringify(filledPlaceholders) !== JSON.stringify(currentFilledPlaceholders)
			)
		)
		{
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dialogs
			confirm({
				title: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_WHATSAPP_RESEND_CONFIRM_DIALOG_TITLE'),
				content: Tag.render`<div>${Text.encode(Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_WHATSAPP_RESEND_CONFIRM_DIALOG_MESSAGE'))}</div>`,
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
		return (item.getType() === 'Activity:Whatsapp');
	}

	#buildAnalyticsData(ownerTypeId: number): ?WhatsAppDeleteEventStructure
	{
		return Builder.Communication.DeleteEvent.createDefault(ownerTypeId)
			.setElement(Dictionary.ELEMENT_WA_MESSAGE_DELETE)
			.buildData();
	}
}
