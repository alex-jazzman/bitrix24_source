import { Color } from 'im.v2.const';
import { SonetNotificationIconTitleClass } from '../../../const/const';
import { DetailedChangedValue } from '../../base/changed';
import { DetailedGrid } from '../../base/grid';
import { DetailedText } from '../../base/text';
import { DetailedTitle } from '../../base/title';
import { BaseNotificationItem } from '../base/base-item';

import '../../elements/css/item.css';

import type { ImModelNotification } from 'im.v2.model';

// @vue/component
export const SonetNotificationItem = {
	name: 'SonetNotificationItem',
	components: {
		DetailedTitle,
		DetailedText,
		DetailedGrid,
		DetailedChangedValue,
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
			const entityKey = this.notificationParams.entity.entityType;

			if (entityKey && SonetNotificationIconTitleClass[entityKey])
			{
				return SonetNotificationIconTitleClass[entityKey];
			}

			return SonetNotificationIconTitleClass.newsfeed;
		},
	},
	template: `
		<BaseNotificationItem :notification="notificationItem">
			<template #content>
				<DetailedTitle
					:notificationParams="notificationParams"
					:icon="iconClass"
					:color="Color.accentExtraAqua"
				/>
				<DetailedGrid :notificationParams="notificationParams" />
				<DetailedChangedValue :notificationParams="notificationParams" />
				<DetailedText :notificationParams="notificationParams" />
			</template>
		</BaseNotificationItem>
	`,
};
