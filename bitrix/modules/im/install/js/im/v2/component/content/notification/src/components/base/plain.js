import type { ImModelNotificationParams } from 'im.v2.model';
import { Parser } from 'im.v2.lib.parser';

// @vue/component
export const PlainText = {
	name: 'PlainText',
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	computed: {
		params(): ImModelNotificationParams
		{
			return this.notification?.params?.componentParams ?? {};
		},
		hasPlainText(): boolean
		{
			return this.text.length > 0;
		},
		text(): string
		{
			const text = this.params?.plainText || '';

			return Parser.decodeNotificationParam(text);
		},
	},
	template: `
		<div v-if="hasPlainText" class="bx-im-content-notification-item-content__plain">
			<span v-html="text" class="bx-im-content-notification-item-content__plain-text"/>
		</div>
	`,
};
