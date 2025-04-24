import { AvatarSize } from './components/base/avatar';

import './css/chat-notes-avatar.css';

// @vue/component
export const ChatNotesAvatar = {
	name: 'ChatNotesAvatar',
	props: {
		dialogId: {
			type: [String, Number],
			default: 0,
		},
		size: {
			type: String,
			default: AvatarSize.M,
		},
		withAvatarLetters: {
			type: Boolean,
			default: true,
		},
		customSource: {
			type: String,
			default: '',
		},
		withSpecialTypes: {
			type: Boolean,
			default: true,
		},
		withSpecialTypeIcon: {
			type: Boolean,
			default: true,
		},
		withTooltip: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		sizeClass(): string
		{
			return `--size-${this.size.toLowerCase()}`;
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div :class="sizeClass" class="bx-im-chat-notes-avatar" :title="loc('IM_ELEMENTS_CHAT_MY_NOTES')"></div>
	`,
};
