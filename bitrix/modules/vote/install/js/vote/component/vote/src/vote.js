import { Text, Type, type JsonObject } from 'main.core';
import { UI } from 'ui.notification';

import { VoteApplication } from 'vote.application';
import { ImVoteService } from 'vote.provider.service';
import { Loader } from 'vote.component.loader';
import type { QuestionCollectionType, VoteCollectionType, VoteElementState } from 'vote.store.vote';

import { ButtonArea } from './components/button-area/button-area';
import { VotePopup } from './components/popup/popup';
import { getMessage } from './components/helpers/helpers';
import { VoteQuestion } from './components/vote-question/vote-question';

import './vote.css';

import type { VoteInitQuestion, FormattedQuestionType, AnswersSelectedEvent } from './type';

const ANONYMOUS_VOTE = 2;

// @vue/component
export const VoteDisplay = {
	name: 'VoteDisplay',
	components:
	{
		VoteQuestion,
		ButtonArea,
		Loader,
		VotePopup,
	},
	props:
	{
		voteItem: {
			type: Object,
			required: true,
		},
		entityId: {
			type: Number,
			required: true,
		},
		entityType: {
			type: String,
			required: true,
		},
		contextId: {
			type: String,
			required: true,
		},
	},
	emits: ['vote', 'revokeVote', 'copyLink'],
	data(): JsonObject
	{
		return {
			isLoading: true,
			isShowPopup: false,
			questionAnswers: {},
		};
	},
	computed:
	{
		firstQuestion(): Record<string, VoteInitQuestion>
		{
			const firstKey = Object.keys(this.voteItem.data?.questions)[0];

			return this.voteItem.data?.questions[firstKey];
		},
		questionCollection(): QuestionCollectionType
		{
			return this.app.getStore().getters['vote/getQuestionCollection'];
		},
		voteCollection(): VoteCollectionType
		{
			return this.app.getStore().getters['vote/getVoteCollection'];
		},
		currentVote(): VoteElementState
		{
			return this.voteCollection[this.voteItem.id];
		},
		formattedQuestion(): FormattedQuestionType
		{
			const storeQuestion = this.questionCollection[this.firstQuestion.id] || {};

			return {
				...this.firstQuestion,
				totalCounter: storeQuestion.totalCounter,
				isMultiple: storeQuestion.isMultiple,
			};
		},
		isUserVoted(): boolean
		{
			if (this.isLoading)
			{
				return false;
			}

			return this.currentVote.isVoted;
		},
		canRevoke(): boolean
		{
			if (this.isLoading)
			{
				return false;
			}

			return this.currentVote.canRevoke && this.isUserVoted && !this.isCompleted;
		},
		canEdit(): boolean
		{
			if (this.isLoading)
			{
				return false;
			}

			return this.currentVote.canEdit;
		},
		isAnonymous(): boolean
		{
			return this.voteItem.data?.anonymity === ANONYMOUS_VOTE;
		},
		isCompleted(): boolean
		{
			if (this.isLoading)
			{
				return false;
			}

			return this.currentVote.isCompleted;
		},
		hasSelectedAnswers(): boolean
		{
			return Type.isArrayFilled(this.questionAnswers[this.firstQuestion.id]);
		},
		getVoteTypeText(): string
		{
			return this.isAnonymous ? getMessage('VOTE_ANONYMOUS') : getMessage('VOTE_PUBLIC');
		},
		getCompletionVoteText(): string
		{
			return getMessage('VOTE_NOTICE_COMPLETED');
		},
	},

	created(): void
	{
		this.app = VoteApplication.init();
		this.voteService = new ImVoteService(this.entityType, this.entityId);
	},
	async mounted(): void
	{
		this.loadAttach();
	},
	methods:
	{
		notifyAjaxError(ex): void
		{
			if (Type.isObject(ex) && Type.isArrayFilled(ex.errors))
			{
				const message = ex?.errors[0]?.message ?? 'Unexpected error';
				UI.Notification.Center.notify({
					content: Text.encode(message),
					autoHideDelay: 4000,
				});
			}
			else
			{
				console.error(ex);
			}
		},
		async answersSelected(event: AnswersSelectedEvent): void
		{
			this.questionAnswers[event.questionId] = event.answerIds;
			const currentQuestion = this.questionCollection[event.questionId];
			if (currentQuestion.isMultiple || this.isUserVoted)
			{
				return;
			}

			void this.submitVote();
		},
		async submitVote(): Promise<void>
		{
			this.isLoading = true;
			try
			{
				this.app.getStore().dispatch('vote/setUserVoted', {
					voteId: this.currentVote.id,
				});
				await this.voteService.sendVote(this.questionAnswers);
				this.$emit('vote');
				this.questionAnswers = {};
			}
			catch (e)
			{
				console.error('Vote: submit vote error', e);
				this.app.getStore().dispatch('vote/resetUserVoted', {
					voteId: this.currentVote.id,
				});
				BX.UI.Notification.Center.notify({
					content: getMessage('VOTE_NOTICE_ERROR_MESSAGE_SUBMIT'),
					autoHideDelay: 4000,
				});
			}
			this.isLoading = false;
		},
		onClickVoteButton(): void
		{
			if (Type.isArrayFilled(this.questionAnswers[this.formattedQuestion.id]))
			{
				this.submitVote();
			}
		},
		async showResults(): void
		{
			BX.SidePanel.Instance.open(this.currentVote.resultUrl, {
				cacheable: false,
				width: 480,
				copyLinkLabel: true,
				events: {
					onOpen: ({ slider }: BX.SidePanel.Event) => {
						const copyLink = slider.getCopyLinkLabel();
						copyLink.setOnclick(() => {
							this.$emit('copyLink');
						});
					},
				},
			});
		},
		async loadAttach(): void
		{
			try
			{
				await this.voteService.load();
				this.isLoading = false;
			}
			catch (e)
			{
				this.notifyAjaxError(e);
				// @TODO add error state;
			}
		},
		async completeVote(): void
		{
			try
			{
				this.app.getStore().dispatch('vote/setVoteCompleted', {
					voteId: this.currentVote.id,
				});
				await this.voteService.completeVote();
			}
			catch (e)
			{
				console.error('Vote: complete vote error', e);

				this.app.getStore().dispatch('vote/resetVoteCompleted', {
					voteId: this.currentVote.id,
				});

				BX.UI.Notification.Center.notify({
					content: getMessage('VOTE_NOTICE_ERROR_MESSAGE_COMPLETE'),
					autoHideDelay: 4000,
				});
			}
		},
		onCompetePopupConfirm(): void
		{
			this.isShowPopup = false;
			this.completeVote();
		},
		onCompetePopupCancel(): void
		{
			this.isShowPopup = false;
		},
		async recallVote(): void
		{
			const previousSelectedAnswers = this.app.getStore().getters['vote/getCurrentUserVotes'][this.firstQuestion.id];
			try
			{
				this.app.getStore().dispatch('vote/clearVotes', {
					questionId: this.firstQuestion.id,
					voteId: this.currentVote.id,
				});
				this.app.getStore().dispatch('vote/resetUserVoted', {
					voteId: this.currentVote.id,
				});
				await this.voteService.revokeVote();
				this.$emit('revokeVote');
			}
			catch (e)
			{
				console.error('Vote: recall vote error', e);
				this.app.getStore().dispatch('vote/updateCurrentUserVotes', {
					questionId: this.firstQuestion.id,
					answerIds: previousSelectedAnswers,
				});
				this.app.getStore().dispatch('vote/setUserVoted', {
					voteId: this.currentVote.id,
				});
				BX.UI.Notification.Center.notify({
					content: getMessage('VOTE_NOTICE_ERROR_MESSAGE_REVOKE'),
					autoHideDelay: 4000,
				});
			}
		},
	},
	template: `
			<form class="vote-display">
				<div class="vote-display-inner">
					<VoteQuestion
						:key="formattedQuestion.id"
						:contextId="contextId"
						:isLoading="isLoading"
						:question="formattedQuestion"
						:isUserVoted="isUserVoted"
						:isCompleted="isCompleted"
						:answers="formattedQuestion.answers"
						@answersSelected="answersSelected"
					/>
					<div class="vote-display-bottom-container">
						<div v-if="isLoading" class="vote-display__loader">
							<Loader />
						</div>
						<ButtonArea v-else
							:question="formattedQuestion"
							:isLoading="isLoading"
							:isUserVoted="isUserVoted"
							:isCompleted="isCompleted"
							:isBtnActive="hasSelectedAnswers"
							@onClickVoteButton="onClickVoteButton"
							@showResults="showResults"
						/>
						<div class="vote__notice">
							<span class="vote__notice-text">{{ getVoteTypeText }}</span>
							<span v-if="isCompleted" class="vote__notice-text">{{ getCompletionVoteText }}</span>
						</div>

		<!--				temporary button for testing-->
						<div style="height:22px;display:none;">
							<button v-if="canRevoke" @click="recallVote" type="button">Переголосовать</button>
						</div>
						<div style="height:22px;display:none;">
							<button  v-if="!isCompleted && canEdit" @click="isShowPopup = true" type="button">Завершить</button>
						</div>
					</div>
				</div>
			</form>
			<VotePopup 
				v-if="isShowPopup" 
				@confirm="onCompetePopupConfirm"
				@cancel="onCompetePopupCancel"
			/>
	`,
};
