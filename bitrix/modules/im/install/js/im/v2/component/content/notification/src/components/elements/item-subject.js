import { ChatTitle } from 'im.v2.component.elements.chat-title';
import { UserType } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';

import type { ImModelUser } from 'im.v2.model';

const AUTHOR_PLACEHOLDER = '#AUTHOR#';

// @vue/component
export const ItemSubject = {
	name: 'ItemSubject',
	components: { ChatTitle },
	props: {
		notification: {
			type: Object,
			required: true,
		},
	},
	emits: ['userClick'],
	computed: {
		author(): ImModelUser
		{
			return this.$store.getters['users/get'](this.notification.authorId, true);
		},
		authorDialogId(): string
		{
			return this.notification.authorId.toString();
		},
		titleClasses(): Object
		{
			return {
				'bx-im-content-notification-item-header__title-text': true,
				'bx-im-content-notification-item-header__title-user-text': true,
				'--extranet': this.author.type === UserType.extranet,
			};
		},
		subjectText(): string
		{
			return Parser.decodeNotificationParam(this.notification.params.componentParams?.subject ?? '');
		},
		parsedSubject(): { before: string, after: string }
		{
			let subject = this.subjectText;
			if (this.subjectText.includes('#USER_COUNT#'))
			{
				subject = this.subjectText.replace('#USER_COUNT#', this.notification.params.users.length);
			}

			const parts = subject.split(AUTHOR_PLACEHOLDER);

			return {
				before: parts[0],
				after: parts[1],
			};
		},
		beforeText(): string
		{
			return this.parsedSubject.before;
		},
		afterText(): string
		{
			return this.parsedSubject.after;
		},
	},
	template: `
		<div class="bx-im-content-notification-item-header__subject">
			<span
				v-html="beforeText"
				class="bx-im-content-notification-item-header__subject-text"
			/>
			<ChatTitle
				:dialogId="authorDialogId"
				:showItsYou="false"
				:class="titleClasses"
				@click.prevent="$emit('userClick')"
			/>
			<slot></slot>
			<span
				v-html="afterText"
				class="bx-im-content-notification-item-header__subject-text"
			/>
		</div>
	`,
};
