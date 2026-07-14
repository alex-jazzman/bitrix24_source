import { Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { Utils } from 'im.v2.lib.utils';
import { Notifier } from 'im.v2.lib.notifier';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { EventType } from 'im.v2.const';
import { MessageStatus } from 'im.v2.component.message.elements';

import { VoteValue, type VoteValueType } from '../const/const';

import { VoteManager } from '../classes/vote-manager';

import { PanelButton } from './panel-button';

import '../css/bottom-panel.css';

type PanelButtonConfig = {
	name: string,
	title: string,
	onClick: () => void,
	available: boolean,
	active?: boolean,
	disabled?: boolean,
};

// @vue/component
export const BottomPanel = {
	name: 'BottomPanel',
	components: { PanelButton, MessageStatus },
	props: {
		message: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['regenerate'],
	data(): { isVoteSending: boolean }
	{
		return {
			isVoteSending: false,
		};
	},
	computed: {
		isFeedbackAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAiAssistantFeedbackAvailable);
		},
		isRegenerateAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAiAssistantRegenerateAvailable);
		},
		currentVote(): VoteValueType | null
		{
			return this.voteManager.getValue(this.message.id);
		},
		buttons(): Array<PanelButtonConfig>
		{
			const allButtons = [
				{
					name: OutlineIcons.COPY,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_COPY'),
					onClick: () => this.onCopyClick(),
					available: true,
				},
				{
					name: OutlineIcons.REFRESH,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_REGENERATE'),
					onClick: () => this.onRegenerateClick(),
					available: this.isRegenerateAvailable,
				},
				{
					name: OutlineIcons.LIKE,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_LIKE'),
					onClick: () => this.onLikeClick(),
					available: this.isFeedbackAvailable,
					active: this.currentVote === VoteValue.like,
					disabled: this.isVoteSending,
				},
				{
					name: OutlineIcons.DISLIKE,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_DISLIKE'),
					onClick: () => this.onDislikeClick(),
					available: this.isFeedbackAvailable,
					active: this.currentVote === VoteValue.dislike,
					disabled: this.isVoteSending,
				},
				{
					name: OutlineIcons.FORWARD,
					title: this.loc('IM_MESSAGE_AI_ASSISTANT_ANSWER_ACTION_FORWARD'),
					onClick: () => this.onForwardClick(),
					available: true,
				},
			];

			return allButtons.filter((button) => button.available);
		},
	},
	created()
	{
		this.voteManager = new VoteManager();
	},
	methods: {
		async onCopyClick()
		{
			await Utils.text.copyToClipboard(this.message.text);
			Notifier.onCopyTextComplete();
		},
		onRegenerateClick()
		{
			this.$emit('regenerate');
		},
		async onLikeClick(): Promise<void>
		{
			await this.vote(VoteValue.like);
		},
		async onDislikeClick(): Promise<void>
		{
			await this.vote(VoteValue.dislike);
		},
		async vote(value: VoteValueType): Promise<void>
		{
			if (this.isVoteSending)
			{
				return;
			}

			this.isVoteSending = true;
			try
			{
				await this.voteManager.vote(this.message.id, value, {
					dialogId: this.dialogId,
					text: this.message.text,
				});
			}
			finally
			{
				this.isVoteSending = false;
			}
		},
		onForwardClick()
		{
			this.$Bitrix.eventEmitter.emit(EventType.dialog.showForwardPopup, {
				messagesIds: [this.message.id],
			});
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-message-ai-assistant-v2-answer__actions-panel">
			<div class="bx-im-message-ai-assistant-v2-answer__actions">
				<PanelButton
					v-for="button in buttons"
					:key="button.name"
					:name="button.name"
					:title="button.title"
					:active="button.active"
					:disabled="button.disabled"
					@click="button.onClick"
				/>
			</div>
			<div class="bx-im-message-ai-assistant-v2-answer__status">
				<MessageStatus :item="message" />
			</div>
		</div>
	`,
};
