import { Parser } from 'im.v2.lib.parser';

import type { ImModelNotificationParams } from 'im.v2.model';

// @vue/component
export const DetailedAdditionalText = {
	name: 'DetailedAdditionalText',
	props: {
		notificationParams: {
			type: Object,
			required: true,
		},
	},
	computed: {
		params(): ImModelNotificationParams
		{
			return this.notificationParams;
		},
		text(): string
		{
			const text = this.params.entity?.content?.additionalText ?? '';

			return Parser.decodeNotificationParam(text);
		},
		hasAdditionalText(): boolean
		{
			return this.text.length > 0;
		},
	},
	template: `
		<div v-if="hasAdditionalText" class="bx-im-content-notification-item-content__grid-additional-container">
			<span v-html="text" class="bx-im-content-notification-item-content__grid-additional-text"/>
		</div>
	`,
};
