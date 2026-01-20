import { Messenger } from 'im.public';
import { ChatTitle } from 'im.v2.component.elements.chat-title';
import { ItemSubject } from '../../elements/item-subject';

import '../../elements/css/item-header.css';

import type { ImModelUser, ImModelNotification } from 'im.v2.model';

// @vue/component
export const BaseNotificationItemHeader = {
	name: 'BaseNotificationItemHeader',
	components: {
		ChatTitle,
		ItemSubject,
	},
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	emits: ['moreUsersClick'],
	computed: {
		notificationItem(): ImModelNotification
		{
			return this.notification;
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.notificationItem.authorId, true);
		},
		isSystem(): boolean
		{
			return this.notification.authorId === 0;
		},
		userDialogId(): string
		{
			return this.notification.authorId.toString();
		},
		hasMoreUsers(): boolean
		{
			if (this.isSystem)
			{
				return false;
			}

			return Boolean(this.notificationItem.params?.users) && this.notificationItem.params.users.length > 0;
		},
		moreUsers(): { start: string, end: string }
		{
			const phrase = this.$Bitrix.Loc.getMessage('IM_NOTIFICATIONS_MORE_USERS').split('#COUNT#');

			return {
				start: phrase[0],
				end: this.notificationItem.params.users.length + phrase[1],
			};
		},
	},
	methods:
	{
		onUserTitleClick()
		{
			if (this.isSystem)
			{
				return;
			}

			Messenger.openChat(this.userDialogId);
		},
		onMoreUsersClick(event)
		{
			if (event.users)
			{
				this.$emit('moreUsersClick', {
					event: event.event,
					users: event.users,
				});
			}
		},
	},
	template: `
		<div class="bx-im-content-notification-item-header__container">
			<div class="bx-im-content-notification-item-header__title-container">
				<ItemSubject
					:notification="notification"
					@userClick="onUserTitleClick"
				>
					<span v-if="hasMoreUsers" class="bx-im-content-notification-item-header__more-users">
						<span class="bx-im-content-notification-item-header__more-users-start">{{ moreUsers.start }}</span>
						<span
							class="bx-im-content-notification-item-header__more-users-dropdown"
							@click="onMoreUsersClick({users: notificationItem.params.users, event: $event})"
						>
							{{ moreUsers.end }}
						</span>
					</span>
				</ItemSubject>
			</div>
		</div>
	`,
};
