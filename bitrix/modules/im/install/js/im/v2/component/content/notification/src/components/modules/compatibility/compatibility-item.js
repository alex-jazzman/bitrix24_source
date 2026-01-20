import { Parser } from 'im.v2.lib.parser';

import { BaseNotificationItem } from '../base/base-item';
import { CompatibilityNotificationItemHeader } from './compatibility-header';

// @vue/component
export const CompatibilityNotificationItem = {
	name: 'DefaultNotificationItem',
	components: {
		BaseNotificationItem,
		CompatibilityNotificationItemHeader,
	},
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	emits: ['moreUsersClick'],
	computed: {
		content(): string
		{
			return Parser.decodeNotification(this.notification);
		},
	},
	methods: {
		onMoreUsersClick(event)
		{
			this.$emit('moreUsersClick', event);
		},
	},
	template: `
		<BaseNotificationItem :notification="notification">
			<template #header>
				<CompatibilityNotificationItemHeader
					:notification="notification"
					@moreUsersClick="onMoreUsersClick"
				/>
			</template>
			<template #content>
				<div
					v-if="content.length > 0"
					class="bx-im-content-notification-item-content__content-text"
					v-html="content"
				></div>
			</template>
		</BaseNotificationItem>
	`,
};
