import { type JsonObject } from 'main.core';

import { CreateChatPromo } from 'im.v2.component.list.container.elements.create-chat-promo';
import { CreateChatButton } from 'im.v2.component.list.container.elements.create-chat-button';
import { ChannelList } from 'im.v2.component.list.items.channel';
import { Layout, ChatType, PromoId } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { Logger } from 'im.v2.lib.logger';
import { PromoManager } from 'im.v2.lib.promo';

import './css/channel-container.css';

// @vue/component
export const ChannelListContainer = {
	name: 'ChannelListContainer',
	components: { ChannelList, CreateChatPromo, CreateChatButton },
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			showPromo: false,
		};
	},
	computed:
	{
		ChatType: () => ChatType,
	},
	created()
	{
		Logger.warn('List: Channel container created');
	},
	methods:
	{
		onSelectChat(dialogId): void
		{
			this.$emit('selectChat', { layoutName: Layout.channel, dialogId });
		},
		onCreateClick(): void
		{
			Analytics.getInstance().chatCreate.onStartClick(ChatType.channel);
			const promoBannerIsNeeded = PromoManager.getInstance().needToShow(PromoId.createChannel);
			if (promoBannerIsNeeded)
			{
				this.showPromo = true;

				return;
			}

			this.startChannelCreation();
		},
		onPromoContinueClick()
		{
			PromoManager.getInstance().markAsWatched(PromoId.createChannel);
			this.showPromo = false;
			this.startChannelCreation();
		},
		startChannelCreation()
		{
			void CreateChatManager.getInstance().startChatCreation(ChatType.channel);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-container-channel__container">
			<div class="bx-im-list-container-channel__header_container">
				<div class="bx-im-list-container-channel__header_title">{{ loc('IM_LIST_CONTAINER_CHANNEL_HEADER_TITLE') }}</div>
				<CreateChatButton @click="onCreateClick" class="bx-im-list-container-channel__header_create-channel" />
			</div>
			<div class="bx-im-list-container-channel__elements_container">
				<div class="bx-im-list-container-channel__elements">
					<ChannelList @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
		<CreateChatPromo
			v-if="showPromo"
			:chatType="ChatType.channel"
			@continue="onPromoContinueClick"
			@close="showPromo = false"
		/>
	`,
};
