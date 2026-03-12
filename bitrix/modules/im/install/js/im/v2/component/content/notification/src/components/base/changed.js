import { NotificationType } from '../../const/const';

import type { ImModelNotificationParams } from 'im.v2.model';

// @vue/component
export const DetailedChangedValue = {
	name: 'DetailedChangedValue',
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
		content(): { prev: string, next: string }
		{
			return this.params.entity.content;
		},
		isChangedType(): boolean
		{
			return this.notificationType === NotificationType.changed;
		},
		prevValue(): string
		{
			return this.content.prev;
		},
		nextValue(): string
		{
			return this.content.next;
		},
	},
	template: `
		<div v-if="isChangedType" class="bx-im-content-notification-item-content__details-item --changed">
			<div class="bx-im-content-notification-item-content__details-content --prev">
				<span>
					{{ prevValue }}
					<span class="bx-im-content-notification-item-content__details-arrow ui-icon-set --arrow-right-m"></span>
				</span>
			</div>
			<div class="bx-im-content-notification-item-content__details-content">{{ nextValue }}</div>
		</div>
	`,
};
