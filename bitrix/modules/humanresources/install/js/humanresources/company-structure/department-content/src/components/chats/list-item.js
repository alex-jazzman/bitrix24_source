import { AvatarRound, AvatarSquare } from 'ui.avatar';
import { Messenger } from 'im.public.iframe';
import { getColorCode } from 'humanresources.company-structure.utils';

export const ChatListItem = {
	name: 'chatListItem',

	props: {
		chat: {
			type: Object,
			required: true,
		},
	},

	data(): Object
	{
		return {
			avatar: null,
		};
	},

	created(): void
	{
		this.prepareAvatar();
	},

	methods: {
		prepareAvatar(): void
		{
			if (this.chat.avatar)
			{
				this.chat.color = getColorCode('whiteBase');
			}

			const avatarOptions = {
				size: 32,
				userName: this.chat.title,
				baseColor: this.isExtranet() && !this.chat.avatar ? getColorCode('extranetColor') : this.chat.color,
				events: {
					click: () => {
						this.onChatItemClick();
					},
				},
			};

			if (this.chat.avatar)
			{
				avatarOptions.userpicPath = this.chat.avatar;
			}

			this.avatar = this.isChat() ? new AvatarRound(avatarOptions) : new AvatarSquare(avatarOptions);
		},
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		onChatItemClick(): void
		{
			Messenger.openChat(this.chat.dialogId);
		},
		isChat(): boolean
		{
			return this.chat.type !== 'CHANNEL';
		},
		isExtranet(): boolean
		{
			return this.chat.isExtranet;
		},
	},

	template: `
		<div
			:key="chat.id"
			class="hr-department-detail-content__tab-list_item-wrapper --chat"
			:class="{ '--isExtranet': isExtranet() }"
			:data-test-id="'hr-department-content_chats-tab__list_chat-item-' + chat.id"
		>
			<div
				class="hr-department-detail-content__tab-list_item-avatar-container"
				v-html="this.avatar.getContainer().outerHTML"
				@click="onChatItemClick"
			/>
			<div class="hr-department-detail-content__tab-list_item-text-container">
				<div class="hr-department-detail-content__tab-list_item-title-container">
					<div
						class="hr-department-detail-content__tab-list_item-title"
						:data-test-id="'hr-department-content_chats-tab__list_chat-item-' + chat.id + '-title'"
						@click="onChatItemClick"
					>
						{{ chat.title }}
					</div>
				</div>
				<div class="hr-department-detail-content__tab-list_item-subtitle">
					{{ chat.subtitle }}
				</div>
			</div>
			<div 
				class="hr-department-detail-content__tab-list_item-action-btn --chat-item-action-btn ui-icon-set --arrow-right"
				@click="onChatItemClick"
			/>
		</div>
	`,
};
