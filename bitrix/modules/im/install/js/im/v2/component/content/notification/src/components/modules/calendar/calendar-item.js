import { Color } from 'im.v2.const';
import { DetailedGrid } from '../../base/grid';
import { DetailedText } from '../../base/text';
import { DetailedTitle } from '../../base/title';
import { DetailedChangedValue } from '../../base/changed';
import { DetailedUsers } from '../../base/users';
import { BaseNotificationItem } from '../base/base-item';
import { DefaultNotificationIconTitleClass } from '../../../const/const';

import '../../elements/css/item.css';

import type { ImModelNotification } from 'im.v2.model';

// @vue/component
export const CalendarNotificationItem = {
	name: 'CalendarNotificationItem',
	components: {
		DetailedTitle,
		DetailedText,
		DetailedGrid,
		DetailedChangedValue,
		DetailedUsers,
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
		iconClass(): string
		{
			return DefaultNotificationIconTitleClass.calendar;
		},
	},
	template: `
		<BaseNotificationItem :notification="notificationItem">
			<template #content>
				<DetailedTitle
					:notificationParams="notificationParams"
					:icon="iconClass" 
					:color="Color.accentMainPrimaryAlt"
				/>
				<DetailedGrid :notificationParams="notificationParams" />
				<DetailedChangedValue :notificationParams="notificationParams" />
				<DetailedText :notificationParams="notificationParams" />
				<DetailedUsers :notificationParams="notificationParams" />
			</template>
		</BaseNotificationItem>
	`,
};
