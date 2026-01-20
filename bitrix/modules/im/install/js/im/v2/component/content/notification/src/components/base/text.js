import { NotificationType } from '../../const/const';
import { Parser } from 'im.v2.lib.parser';

import type { ImModelNotificationParams } from 'im.v2.model';

// @vue/component
export const DetailedText = {
	name: 'DetailedText',
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
		notificationType(): ?string
		{
			return this.params.entity.contentType ?? null;
		},
		content(): { value: string }
		{
			return this.params.entity.content;
		},
		isTextType(): boolean
		{
			return this.notificationType === NotificationType.text;
		},
		valueText(): string
		{
			return Parser.decodeNotificationParam(this.content?.value || '');
		},
	},
	template: `
		<div v-if="isTextType" class="bx-im-content-notification-item-content__details-item">
			<span v-html="valueText" class="bx-im-content-notification-item-content__details-text --line-clamp-3"/>
		</div>
	`,
};
