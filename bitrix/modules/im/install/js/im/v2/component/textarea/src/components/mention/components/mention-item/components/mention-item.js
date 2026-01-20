import { ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { ChatTitle } from 'im.v2.component.elements.chat-title';

export const MentionItem = {
	name: 'MentionItem',
	components: { ChatAvatar, ChatTitle },
	props: {
		id: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			default: '',
		},
		subtitle: {
			type: String,
			default: '',
		},
	},
	computed: {
		AvatarSize: () => AvatarSize,
	},
	template: `
		<slot name="avatar">
			<ChatAvatar
				:avatarDialogId="id"
				:size="AvatarSize.M"
				class="bx-im-mention-item__avatar-container"
			/>
		</slot>
		<div class="bx-im-mention-item__content-container">
			<slot name="title">
				<ChatTitle
					:dialogId="id"
					:text="title"
					:withLeftIcon="false"
					class="bx-im-mention-item__title"
				/>
			</slot>
			<slot name="subtitle">
				<div class="bx-im-mention-item__subtitle" :title="subtitle">{{ subtitle }}</div>
			</slot>
		</div>
	`,
};
