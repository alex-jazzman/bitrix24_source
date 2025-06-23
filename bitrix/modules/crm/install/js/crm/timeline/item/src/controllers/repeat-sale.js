import { ajax as Ajax, Text, Type } from 'main.core';
import { Router } from 'crm.router';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import { UI } from 'ui.notification';

import { ActionParams, Base } from './base';
import ConfigurableItem from '../configurable-item';

export class RepeatSale extends Base
{
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent' || !actionData)
		{
			return;
		}

		if (action === 'Activity:RepeatSale:Schedule')
		{
			this.runScheduleAction(actionData.activityId, actionData.scheduleDate);
		}

		if (action === 'Activity:RepeatSale:OpenSegment')
		{
			this.#openSegment(actionData.activityId, actionData);
		}

		if (action === 'Activity:RepeatSale:LaunchCopilot' && actionData)
		{
			this.#launchCopilot(item, actionData);
		}
	}

	#openSegment(item: ConfigurableItem, actionData: Object): void
	{
		if (!Type.isInteger(actionData.segmentId))
		{
			return;
		}

		Router.openSlider(
			`/crm/repeat-sale-segment/details/${actionData.segmentId}/`,
			{
				width: 700,
				cacheable: false,
				requestMethod: 'post',
				requestParams: {
					readOnly: true,
				},
			},
		);
	}

	#launchCopilot(item: ConfigurableItem, actionData: Object): void
	{
		const isValidParams: boolean = Type.isNumber(actionData.activityId)
			&& Type.isNumber(actionData.ownerId)
			&& Type.isNumber(actionData.ownerTypeId)
			&& BX.CrmEntityType.enumeration.deal === parseInt(actionData.ownerTypeId, 10)
		;

		if (!isValidParams)
		{
			throw new Error('Invalid "actionData" parameters');
		}

		Ajax
			.runAction('crm.timeline.repeatsale.launchCopilot', {
				data: {
					activityId: actionData.activityId,
					ownerTypeId: actionData.ownerTypeId,
					ownerId: actionData.ownerId,
				},
			}).then((response) => {}).catch((response) => {
				const customData: ?CoPilotAdditionalInfoData = response.errors[0].customData;
				if (customData && Type.isStringFilled(customData.sliderCode ?? ''))
				{
					FeaturePromotersRegistry.getPromoter({ code: customData.sliderCode }).show();
				}
				else
				{
					UI.Notification.Center.notify({
						content: Text.encode(response.errors[0].message),
						autoHideDelay: 5000,
					});
				}

				throw response;
			});
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return item.getType() === 'Activity:RepeatSale'
			|| item.getType() === 'RepeatSaleCreated'
			|| item.getType() === 'LaunchError'
		;
	}
}
