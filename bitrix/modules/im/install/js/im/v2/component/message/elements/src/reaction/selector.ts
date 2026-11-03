import { Dom, Type } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';
import { ReactionName } from 'ui.reaction.item';
import { Reaction } from 'ui.reaction.item.vue';
import { ReactionPicker as ReactionsSelectV2 } from 'ui.reaction.picker';
import { defineComponent } from 'ui.vue3';

import { ActionByRole, UserType, EventType, Settings } from 'im.v2.const';
import { ChangeStatus, MessageDefaultReactionManager } from './classes/message-default-reaction-manager';
import { Notifier } from 'im.v2.lib.notifier';
import { PermissionManager } from 'im.v2.lib.permission';
import {
	type ImModelBot,
	type ImModelChat,
	type ImModelMessage,
	type ImModelUser,
} from 'im.v2.model';

import {
	MainReactionOnboarding,
	type MainReactionOnboardingGeometry,
} from './components/main-reaction-onboarding';

import './selector.css';

const SHOW_DELAY = 250;
const HIDE_DELAY = 500;

type ReactionSelectorData = {
	mainReactionOnboardingGeometry: MainReactionOnboardingGeometry | null,
};

// @vue/component
export const ReactionSelector = defineComponent({
	name: 'ReactionSelector',
	components: { MainReactionOnboarding, Reaction } as {
		MainReactionOnboarding: typeof MainReactionOnboarding,
		Reaction: typeof Reaction,
	},
	props: {
		messageId: {
			type: [String, Number],
			required: true,
		},
	},
	setup(): { picker: ReactionsSelectV2 | null; showTimeout: number; hideTimeout: number }
	{
		return {
			picker: null,
			showTimeout: 0,
			hideTimeout: 0,
		};
	},
	data(): ReactionSelectorData
	{
		return {
			mainReactionOnboardingGeometry: null,
		};
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
		currentReaction(): string
		{
			const mainReaction = this.$store.getters['application/settings/get'](Settings.message.defaultReaction);

			if (Type.isStringFilled(mainReaction))
			{
				return mainReaction;
			}

			return ReactionName.like;
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
	created()
	{
		MessageDefaultReactionManager.getInstance().init();
	},
	beforeUnmount()
	{
		clearTimeout(this.showTimeout);
		this.clearHideTimer();
		this.picker?.hide();
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		startShowTimer()
		{
			this.clearHideTimer();
			if (this.picker?.isShown())
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
			if (!this.picker?.isShown())
			{
				this.mainReactionOnboardingGeometry = null;
			}

			this.startHideTimer();
		},
		showSelector()
		{
			this.picker = new ReactionsSelectV2({
				target: this.$refs.selector as HTMLElement,
				priorityReaction: this.currentReaction,
				contextAction: {
					title: this.loc('IM_MESSENGER_MESSAGE_REACTION_SELECTOR_MAIN_REACTION'),
					onClick: (reaction: string) => this.setMainReaction(reaction),
				},
			});
			this.subscribeToSelectorEvents();
			this.picker.show();
		},
		async setMainReaction(reaction: string): Promise<void>
		{
			const isMainReactionChanged = reaction !== this.currentReaction;

			try
			{
				const result = await MessageDefaultReactionManager.getInstance().changeDefaultReaction(reaction);
				const isSavedOrPending = result.status === ChangeStatus.confirmed || result.status === ChangeStatus.pending;

				if (isMainReactionChanged && isSavedOrPending)
				{
					Notifier.message.onSelectMainReaction();
				}
			}
			catch
			{
				Notifier.onDefaultError();
			}
		},
		subscribeToSelectorEvents()
		{
			this.picker!.subscribe('select', this.onSelectorSelect);
			this.picker!.subscribe('mouseleave', this.startHideTimer);
			this.picker!.subscribe('mouseenter', this.clearHideTimer);
			this.picker!.subscribe('expand', this.onSelectorExpand);
			this.picker!.subscribe('hide', this.onSelectorHide);
		},
		onSelectorSelect(selectEvent: BaseEvent): void
		{
			const { reaction } = selectEvent.getData();
			this.getEmitter().emit(EventType.reaction.onReactionSelected, {
				messageId: this.messageId,
				reaction,
			});
			this.picker?.hide();
		},
		onSelectorExpand(): void
		{
			const popoverRect = this.picker?.getPopoverRect();
			if (!popoverRect)
			{
				return;
			}

			const selectorRect = Dom.getPosition(this.$refs.selector as HTMLElement);

			this.mainReactionOnboardingGeometry = {
				popoverRect,
				selectorRect,
			};
		},

		onSelectorHide(): void
		{
			clearTimeout(this.hideTimeout);
			this.mainReactionOnboardingGeometry = null;
			this.picker = null;
		},
		startHideTimer()
		{
			this.hideTimeout = setTimeout(() => {
				this.picker?.hide();
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
				reaction: this.currentReaction,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<div
			v-if="canSetReactions"
			class="bx-im-reaction-selector__container"
			data-testid="im-message-reaction-selector"
		>
			<div
				@click="onIconClick"
				@mouseenter="startShowTimer"
				@mouseleave="clearShowTimer"
				class="bx-im-reaction-selector__selector"
				ref="selector"
				data-testid="im-message-reaction-selector-trigger"
			>
				<Reaction
					class="bx-im-reaction-selector__icon"
					:key="currentReaction"
					:name="currentReaction"
				>
				</Reaction>
			</div>
			<MainReactionOnboarding
				:geometry="mainReactionOnboardingGeometry"
				:message-id="messageId"
				@mouseEnter="clearHideTimer"
				@mouseLeave="startHideTimer"
			/>
		</div>
	`,
});
