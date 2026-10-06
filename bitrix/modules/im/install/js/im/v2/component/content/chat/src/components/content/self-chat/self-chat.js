import { BaseChatContent, ChatHeader } from 'im.v2.component.content.elements';
import { ChatTitle, ChatTitleType } from 'im.v2.component.elements.chat-title';

// @vue/component
export const SelfChatContent = {
	name: 'SelfChatContent',
	components: { BaseChatContent, ChatHeader, ChatTitle },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		titleType(): string
		{
			const isSelfChat = this.$store.getters['chats/isSelfChat'](this.dialogId);

			return isSelfChat ? ChatTitleType.selfChat : '';
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<ChatHeader :dialogId="dialogId" :withCallButton="false" :withAddToChatButton="false">
					<template #title>
						<ChatTitle :dialogId="dialogId" :customType="titleType" :showItsYou="false"/>
					</template>
				</ChatHeader>
			</template>
		</BaseChatContent>
	`,
};
