import { sendData } from 'ui.analytics';
import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsTool,
	NotificationEntryPoint,
} from '../const';

export type NotificationUnsubscribeParams = {
	moduleId: string,
	optionName: string
}

export class Notification
{
	onOpenFromQuickAccessPanel(): void
	{
		sendData({
			tool: AnalyticsTool.notification,
			category: AnalyticsCategory.notificationOperations,
			event: AnalyticsEvent.notificationOpen,
			c_element: NotificationEntryPoint.quickAccessLabel,
		});
	}

	onUnsubscribeFromNotification(params: NotificationUnsubscribeParams): void
	{
		sendData({
			tool: AnalyticsTool.notification,
			category: AnalyticsCategory.notificationOperations,
			event: AnalyticsEvent.notificationUnsubscribe,
			p1: params.moduleId,
			p2: params.optionName,
		});
	}
}
