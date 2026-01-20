import { Dom, Text } from 'main.core';
import { Utils } from 'im.v2.lib.utils';
import { NotificationType } from '../../const/const';

import type { ImModelNotificationParams, ImModelUser } from 'im.v2.model';

const MAX_USERS_TO_DISPLAY = 2;

// @vue/component
export const DetailedUsers = {
	name: 'DetailedUsers',
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
		content(): { ids: number[], text: string }
		{
			return this.params.entity.content;
		},
		isUsersType(): boolean
		{
			return this.notificationType === NotificationType.users;
		},
		text(): string
		{
			return this.content.text;
		},
		allUserIds(): string[]
		{
			return this.content.ids;
		},
		usersToDisplay(): ImModelUser[]
		{
			const users = this.allUserIds.slice(0, MAX_USERS_TO_DISPLAY);

			return users.map((id) => this.$store.getters['users/get'](id));
		},
		remainingCount(): number
		{
			return this.allUserIds.length - MAX_USERS_TO_DISPLAY;
		},
		formattedText(): string
		{
			let result = this.text.replace('#USER_LIST#', (): string => {
				return this.usersToDisplay
					.map((user) => this.getUserLink(user))
					.join(', ');
			});

			if (this.link)
			{
				result = result
					.replace('[link]', `<a href="${this.link}" class="bx-im-content-notification-item-content__details-link" target="_self">`)
					.replace('#COUNT#', this.remainingCount)
					.replace('[/link]', '</a>')
				;
			}
			else
			{
				result = result.replace('#COUNT#', this.remainingCount);
			}

			return result;
		},
		link(): ?string
		{
			return this.params.entity.href ?? null;
		},
	},
	methods: {
		getUserLink(user: ImModelUser): string
		{
			const userHref = Utils.user.getProfileLink(user.id);
			const name = Text.encode(user.name);

			return Dom.create({
				tag: 'a',
				props: {
					className: 'bx-im-content-notification-item-content__details-link',
					href: userHref,
					target: '_self',
				},
				text: name,
			}).outerHTML;
		},
	},
	template: `
		<div
			v-if="isUsersType"
			class="bx-im-content-notification-item-content__details-users"
			v-html="formattedText"
		>
		</div>
	`,
};
