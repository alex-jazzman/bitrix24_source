import 'ui.system.highlighter';

import { type ImModelChat } from 'im.v2.model';
import { ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { ChatManager } from 'im.v2.lib.chat';
import { Utils } from 'im.v2.lib.utils';

import { CollabCardButtonPanel } from './components/button-panel';
import { CollabCardBackground } from './components/background';
import { CardPromo } from './components/card-promo';
import { NewTabButton } from './components/new-tab-button';
import { CollabPromoManager, type ShowPromoEvent } from '../../classes/promo-manager';

import './css/collab-card.css';

// @vue/component
export const CollabCard = {
	name: 'CollabCard',
	components: { CollabCardBackground, ChatAvatar, CollabCardButtonPanel, CardPromo, NewTabButton },
	inject: ['promoManager'],
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
		withNewTabButton: {
			type: Boolean,
			required: true,
		},
	},
	data()
	{
		return {
			showPromo: false,
		};
	},
	computed: {
		AvatarSize: () => AvatarSize,
		parentChat(): ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.parentChatId);
		},
		parentChatTitle(): string
		{
			return this.parentChat.name;
		},
		containerClass(): Record<string, boolean>
		{
			return { 'ui-highlighter': this.showPromo };
		},
	},
	created()
	{
		this.bindPromoEvent();
	},
	methods: {
		bindPromoEvent()
		{
			this.promoManager.subscribe(CollabPromoManager.events.showCardPromo, (event: ShowPromoEvent) => {
				this.showPromo = event.getData();
			});
		},
		onClosePromo()
		{
			this.promoManager.onCloseCardPromo();
		},
		onOpenInNewTab()
		{
			const collabLink = ChatManager.buildChatLink(this.parentChat.dialogId);
			Utils.browser.openLink(collabLink);
		},
	},
	template: `
		<div :class="containerClass" class="bx-im-nested-list-collab-card__container --ui-context-content-dark" ref="card-container">
			<CollabCardBackground :parentChatId="parentChatId" />
			<div class="bx-im-nested-list-collab-card__header">
				<ChatAvatar
					:avatarDialogId="parentChat.dialogId"
					:contextDialogId="parentChat.dialogId"
					:size="AvatarSize.XXL"
					class="bx-im-nested-list-collab-card__avatar"
				/>
				<div :title="parentChatTitle" class="bx-im-nested-list-collab-card__title --line-clamp-2">
					{{ parentChatTitle }}
				</div>
			</div>
			<CollabCardButtonPanel :parentChatId="parentChatId" />
			<NewTabButton v-if="withNewTabButton" @click="onOpenInNewTab" />
		</div>
		<CardPromo v-if="showPromo" :bindElement="$refs['card-container']" @close="onClosePromo" />
	`,
};
