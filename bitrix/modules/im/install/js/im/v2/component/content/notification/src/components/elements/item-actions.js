import { NotificationMenu } from '../../classes/notification-menu';

import './css/item-actions.css';

import type { ImModelNotification } from 'im.v2.model';

// @vue/component
export const ItemActions = {
	name: 'ItemActions',
	props: {
		notification: {
			type: Object,
			required: true,
		},
		canDelete: {
			type: Boolean,
			required: true,
		},
	},
	computed: {
		notificationItem(): ImModelNotification
		{
			return this.notification;
		},
		areActionsAvailable(): boolean
		{
			return this.notificationItem.notifyButtons.length === 0;
		},
		isMenuEmpty(): boolean
		{
			if (!this.notificationMenu)
			{
				return true;
			}

			return this.notificationMenu.isEmpty(this.notificationItem);
		},
	},
	created()
	{
		this.notificationMenu = new NotificationMenu({
			store: this.$store,
		});
	},
	methods: {
		onDeleteClick(): void
		{
			this.$emit('deleteClick');
		},
		onMenuButtonClick(event): void
		{
			this.notificationMenu.openMenu(this.notificationItem, event.currentTarget);
		},
		onMenuClose(): void
		{
			this.isMenuShown = false;
		},
	},
	template: `
		<div v-if="areActionsAvailable" class="bx-im-content-notification-item__actions">
			<div
				v-if="!isMenuEmpty"
				class="bx-im-content-notification-item__actions-more-button" 
				@click="onMenuButtonClick" 
			>
			</div>
			<div
				v-if="canDelete"
				class="bx-im-content-notification-item__actions-delete-button"
				@click="onDeleteClick"
			>
			</div>
		</div>
	`,
};
