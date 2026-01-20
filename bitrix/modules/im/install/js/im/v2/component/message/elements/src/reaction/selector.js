import { ReactionsSelect } from 'ui.reactions-select';
import { ReactionPicker as ReactionsSelectV2 } from 'ui.reaction.picker';
import { ReactionName } from 'ui.reaction.item';

import { ActionByRole, UserType, EventType } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { FeatureManager, Feature } from 'im.v2.lib.feature';

import './selector.css';

import type { EventEmitter } from 'main.core.events';
import type { ImModelChat, ImModelMessage, ImModelReactions, ImModelUser, ImModelBot } from 'im.v2.model';

const SHOW_DELAY = 250;
const HIDE_DELAY = 500;

// @vue/component
export const ReactionSelector = {
	name: 'ReactionSelector',
	props:
	{
		messageId: {
			type: [String, Number],
			required: true,
		},
	},
	computed:
	{
		message(): ImModelMessage
		{
			return this.$store.getters['messages/getById'](this.messageId);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.message.chatId);
		},
		reactionsData(): ?ImModelReactions
		{
			return this.$store.getters['messages/reactions/getByMessageId'](this.messageId);
		},
		ownReactions(): Set<string>
		{
			return this.reactionsData?.ownReactions ?? new Set();
		},
		ownPlainLikeSet(): boolean
		{
			return this.ownReactions.has(ReactionName.like);
		},
		isChatWithBot(): boolean
		{
			const user: ImModelUser = this.$store.getters['users/get'](this.dialog.dialogId);

			return user?.type === UserType.bot;
		},
		areBotReactionsEnabled(): boolean
		{
			const bot: ImModelBot = this.$store.getters['users/bots/getByUserId'](this.message.authorId);
			if (!bot)
			{
				return false;
			}

			return bot.reactionsEnabled;
		},
		hasError(): boolean
		{
			return this.message.error;
		},
		isRealMessage(): boolean
		{
			return this.$store.getters['messages/isRealMessage'](this.messageId);
		},
		canSetReactions(): boolean
		{
			if (!this.isRealMessage || !this.canSetReactionsByRole || this.hasError)
			{
				return false;
			}

			if (this.isChatWithBot)
			{
				return this.areBotReactionsEnabled;
			}

			return true;
		},
		canSetReactionsByRole(): boolean
		{
			const permissionManager = PermissionManager.getInstance();

			return permissionManager.canPerformActionByRole(ActionByRole.setReaction, this.dialog.dialogId);
		},
	},
	methods:
	{
		startShowTimer()
		{
			this.clearHideTimer();
			if (this.selector?.isShown())
			{
				return;
			}
			this.showTimeout = setTimeout(() => {
				this.showSelector();
			}, SHOW_DELAY);
		},
		clearShowTimer()
		{
			clearTimeout(this.showTimeout);
			this.startHideTimer();
		},
		showSelector()
		{
			if (FeatureManager.isFeatureAvailable(Feature.reactionsV2Available))
			{
				this.selector = new ReactionsSelectV2({ target: this.$refs.selector });
			}
			else
			{
				this.selector = new ReactionsSelect({
					name: 'im-base-message-reaction-selector',
					position: this.$refs.selector,
				});
			}

			this.subscribeToSelectorEvents();
			this.selector.show();
		},
		subscribeToSelectorEvents()
		{
			this.selector.subscribe('select', (selectEvent) => {
				const { reaction } = selectEvent.getData();
				this.getEmitter().emit(EventType.reaction.onReactionSelected, {
					messageId: this.messageId,
					reaction,
				});
				this.selector?.hide();
			});

			this.selector.subscribe('mouseleave', this.startHideTimer);

			this.selector.subscribe('mouseenter', () => {
				clearTimeout(this.hideTimeout);
			});

			this.selector.subscribe('hide', () => {
				clearTimeout(this.hideTimeout);
				this.selector = null;
			});
		},
		startHideTimer()
		{
			this.hideTimeout = setTimeout(() => {
				this.selector?.hide();
			}, HIDE_DELAY);
		},
		clearHideTimer()
		{
			clearTimeout(this.hideTimeout);
		},
		onIconClick()
		{
			this.clearShowTimer();
			this.getEmitter().emit(EventType.reaction.onReactionSelected, {
				messageId: this.messageId,
				reaction: ReactionName.like,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div v-if="canSetReactions" class="bx-im-reaction-selector__container">
			<div
				@click="onIconClick"
				@mouseenter="startShowTimer"
				@mouseleave="clearShowTimer"
				class="bx-im-reaction-selector__selector"
				ref="selector"
			>
				<div class="bx-im-reaction-selector__icon" :class="{'--active': ownPlainLikeSet}"></div>
			</div>
		</div>
	`,
};
