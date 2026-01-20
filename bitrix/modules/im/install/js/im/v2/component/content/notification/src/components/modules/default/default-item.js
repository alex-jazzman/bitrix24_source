import { Color } from 'im.v2.const';
import { BaseNotificationItem } from '../base/base-item';

import '../../elements/css/item.css';

import type { ImModelNotification } from 'im.v2.model';

// @vue/component
export const DefaultNotificationItem = {
	name: 'DefaultNotificationItem',
	components: {
		BaseNotificationItem,
	},
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	computed: {
		Color: () => Color,
		notificationItem(): ImModelNotification
		{
			return this.notification;
		},
		notificationParams(): ?Object
		{
			return this.notificationItem.params?.componentParams ?? null;
		},
	},
	template: `
		<BaseNotificationItem :notification="notificationItem"/>
	`,
};
