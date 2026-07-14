import { Color } from 'im.v2.const';
import { MailNotificationIconTitleClass } from '../../../const/const';
import { DetailedChangedValue } from '../../base/changed';
import { DetailedGrid } from '../../base/grid';
import { DetailedText } from '../../base/text';
import { DetailedTitle } from '../../base/title';
import { BaseNotificationItem } from '../base/base-item';
import { DetailedLinks } from './mail-links';

import '../../elements/css/item.css';

import type { ImModelNotification } from 'im.v2.model';

// @vue/component
export const MailNotificationItem = {
	name: 'MailNotificationItem',
	components: {
		DetailedTitle,
		DetailedText,
		DetailedGrid,
		DetailedChangedValue,
		DetailedLinks,
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
			return MailNotificationIconTitleClass.mail;
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
			</template>
			<template #after-content>
				<DetailedLinks :notificationParams="notificationParams" />
			</template>
		</BaseNotificationItem>
	`,
};
