import {Base} from './base';
import ConfigurableItem from '../configurable-item';

export class SalescenterApp extends Base
{
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const {action, actionType, actionData, animationCallbacks} = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'SalescenterApp:Start' && actionData)
		{
			this.#startSalescenterApp(actionData);
		}
	}

	#startSalescenterApp(actionData): void
	{
		if (
			! (
				actionData.orderId
				&& actionData.paymentId
				&& actionData.ownerTypeId
				&& actionData.ownerId
			)
		)
		{
			return;
		}

		BX.loadExt('salescenter.manager').then(() => {
			BX.Salescenter.Manager.openApplication({
				disableSendButton: '',
				context: 'deal',
				mode: actionData.ownerTypeId === BX.CrmEntityType.enumeration.deal ? 'payment_delivery' : 'payment',
				templateMode: 'view',
				analyticsLabel: BX.CrmEntityType.isDynamicTypeByTypeId(actionData.ownerTypeId)
					? 'crmDealTimelineSmsResendPaymentSlider'
					: 'crmDynamicTypeTimelineSmsResendPaymentSlider',
				ownerTypeId: actionData.ownerTypeId,
				ownerId: actionData.ownerId,
				orderId: actionData.orderId,
				paymentId: actionData.paymentId,
			});
		});
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		const supportedItemTypes = [
			'Activity:Sms',
			'Activity:Notification',
		];

		return supportedItemTypes.includes(item.getType());
	}
}
