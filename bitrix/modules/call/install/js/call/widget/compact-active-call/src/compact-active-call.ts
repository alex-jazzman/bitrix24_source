import { Loc, Text } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';

import { AvatarSize, ChatAvatar } from 'im.v2.component.elements.avatar';
import { RecentCallStatus } from 'im.v2.const';
import { type ImModelCallItem } from 'im.v2.model';

import './css/compact-active-call.css';

// @vue/component
export const CompactActiveCall = defineComponent({
	name: 'CompactActiveCall',
	components: { ChatAvatar },
	props: {
		item: {
			type: Object as PropType<ImModelCallItem>,
			required: true,
		},
	},
	emits: ['click'],
	computed: {
		AvatarSize: () => AvatarSize,
		activeCall(): ImModelCallItem
		{
			return this.item;
		},
		hasJoined(): boolean
		{
			return this.activeCall.state === RecentCallStatus.joined;
		},
		statusPhrase(): string
		{
			return this.hasJoined
				? this.loc('CALL_COMPACT_ACTIVE_CALL_JOINED_ARIA')
				: this.loc('CALL_COMPACT_ACTIVE_CALL_WAITING_ARIA');
		},
		chatName(): string
		{
			// the raw name carries HTML entities and would be read out as they are written
			return Text.decode(this.activeCall.name);
		},
		accessibleName(): string
		{
			return this.chatName ? `${this.chatName}. ${this.statusPhrase}` : this.statusPhrase;
		},
	},
	methods: {
		onClick()
		{
			this.$emit('click', { dialogId: this.activeCall.dialogId });
		},
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode) ?? '';
		},
	},
	template: `
		<div
			:data-id="activeCall.dialogId"
			class="bx-im-list-recent-compact-item__wrap"
			data-testid="call-compact-active-call-item"
		>
			<button
				type="button"
				class="bx-im-list-recent-compact-item__container bx-call-compact-active-call__button"
				data-testid="call-compact-active-call-chip"
				:aria-label="accessibleName"
				@click="onClick"
			>
				<span class="bx-im-list-recent-compact-item__avatar_container">
					<ChatAvatar
						:avatarDialogId="activeCall.dialogId"
						:contextDialogId="activeCall.dialogId"
						:size="AvatarSize.M"
						:withSpecialTypes="false"
					/>
					<span
						class="bx-im-list-recent-compact-active-call__icon"
						:class="'--' + activeCall.state"
						data-testid="call-compact-active-call-icon"
					></span>
				</span>
			</button>
		</div>
	`,
});
