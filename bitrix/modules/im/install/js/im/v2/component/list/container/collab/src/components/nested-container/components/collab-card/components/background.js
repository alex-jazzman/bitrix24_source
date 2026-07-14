import { type ImModelChat } from 'im.v2.model';

// @vue/component
export const CollabCardBackground = {
	name: 'CollabCardBackground',
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		parentChat(): ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.parentChatId, true);
		},
		backgroundClass(): Record<string, boolean>
		{
			return { '--no-avatar': !this.parentChat.avatar };
		},
		backgroundStyle(): ?{ backgroundImage: string }
		{
			if (!this.parentChat.avatar)
			{
				return null;
			}

			return { backgroundImage: `url(${this.parentChat.avatar})` };
		},
		overlayStyle(): ?{ backgroundColor: string, opacity: number }
		{
			if (this.parentChat.avatar)
			{
				return null;
			}

			return { backgroundColor: this.parentChat.color, opacity: 0.5 };
		},
	},
	template: `
		<div class="bx-im-nested-list-collab-card__background" :class="backgroundClass" :style="backgroundStyle">
			<div class="bx-im-nested-list-collab-card__background-overlay" :style="overlayStyle"></div>
		</div>
	`,
};
