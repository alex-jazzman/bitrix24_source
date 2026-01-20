import { reactionCssClass as ReactionIconClass } from 'ui.reactions-select';

import type { ImModelNotification } from 'im.v2.model';

// @vue/component
export const ItemReaction = {
	name: 'ItemReaction',
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	computed: {
		notificationItem(): ImModelNotification
		{
			return this.notification;
		},
		type(): string
		{
			return this.notificationItem.params.componentParams.entity.reaction;
		},
		reactionClass(): string
		{
			return ReactionIconClass[this.type];
		},
	},
	template: `
		<div class="bx-im-content-notification-item-content__reaction" :class="reactionClass"></div>
	`,
};
