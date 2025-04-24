import 'ui.icon-set.animated';

import { VoteApplication } from 'vote.application';

import type { JsonObject } from 'main.core';
import type { AnswerCollectionType } from 'vote.store.vote';
import type { AnswersSelectedEvent, FormattedAnswersType } from '../../type';

import './style.css';

// @vue/component
export const VoteQuestion = {
	name: 'VoteQuestion',
	props: {
		contextId: {
			type: String,
			required: true,
		},
		isLoading: {
			type: Boolean,
			default: false,
		},
		/** @type {FormattedQuestionType} */
		question: {
			type: Object,
			required: true,
		},
		/** @type {FormattedAnswersType} */
		answers: {
			type: Object,
			required: true,
		},
		isUserVoted: {
			type: Boolean,
			default: false,
		},
		isCompleted: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['answersSelected'],
	data(): JsonObject
	{
		return {
			selectedRadioBtn: null,
			selectedCheckboxes: [],
		};
	},
	computed: {
		answersCollection(): AnswerCollectionType
		{
			return this.app.getStore().getters['vote/getAnswerCollection'];
		},
		formattedAnswers(): FormattedAnswersType
		{
			const formattedAnswers = {};

			Object.keys(this.answers).forEach((key) => {
				const answer = this.answers[key];
				const storeAnswer = this.answersCollection[answer.id] || {};

				formattedAnswers[key] = {
					...answer,
					counter: storeAnswer.counter || 0,
					percent: storeAnswer.percent,
				};
			});

			return formattedAnswers;
		},
		getCurrentUserVotes(): number[]
		{
			return this.app.getStore().getters['vote/getCurrentUserVotes'][this.question.id] || [];
		},
		canShowResults(): boolean
		{
			return this.isUserVoted || this.isCompleted;
		},
	},
	watch: {
		isLoading(newValue): void
		{
			if (newValue)
			{
				this.selectedCheckboxes = this.getCurrentUserVotes || [];
				this.selectedRadioBtn = this.getCurrentUserVotes[0];
			}
		},
		isUserVoted(voted: boolean): void
		{
			if (voted)
			{
				return;
			}

			this.selectedCheckboxes = [];
			this.selectedRadioBtn = null;
		},
	},
	created()
	{
		this.app = VoteApplication.init();
	},
	methods:
	{
		radioChanged(): void
		{
			this.emitAnswersSelectedWithValue([this.selectedRadioBtn]);
		},
		checkboxChanged(): void
		{
			this.emitAnswersSelectedWithValue(this.selectedCheckboxes);
		},
		emitAnswersSelectedWithValue(answerIds: number[]): void
		{
			const eventData: AnswersSelectedEvent = {
				questionId: this.question.id,
				answerIds,
			};
			this.$emit('answersSelected', eventData);
		},
		hasCurrentUserVote(answerId: number): boolean
		{
			if (this.canShowResults)
			{
				return this.app.getStore().getters['vote/hasCurrentUserVote'](this.question.id, answerId);
			}

			return this.selectedCheckboxes.includes(answerId);
		},
		getUniqueAnswerId(answerId: number): string
		{
			return `vote-answer-${answerId}-${this.contextId}`;
		},
	},
	template: `
		<div class="vote__question">
			<div class="vote__question-text">{{ question.question }}</div>
		</div>
		<div :class="['vote__answers', { '--voted': canShowResults }]">
			<div v-for="(answer, answerKey) in formattedAnswers" 
				 :key="answerKey"
				 :class="['vote__answer', { '--selected': hasCurrentUserVote(answer.id) }]"
			>
				<input
					class="vote__answer-select"
					v-if="!isLoading && !question.isMultiple"
					type="radio"
					v-model="selectedRadioBtn"
					:value="answer.id"
					:id="getUniqueAnswerId(answer.id)"
					@change="radioChanged"
				/>
				<input
					class="vote__answer-select --checkbox"
					v-if="!isLoading && question.isMultiple"
					type="checkbox"
					v-model="selectedCheckboxes"
					:value="answer.id"
					:id="getUniqueAnswerId(answer.id)"
					@change="checkboxChanged"
				/>
				<div class="vote__progress-bar">
					<label class='vote__answer-text' :for="getUniqueAnswerId(answer.id)">{{ answer.message }}</label>
					<div v-if="canShowResults" class="vote__answer-percent">
						<span>{{ answer.percent }}</span>
						%
					</div>
					<div v-if="canShowResults" class="vote__progress-bar-fill"
						 :style="{
						width: answer.percent + '%'
					  }"
					></div>
				</div>
			</div>
		</div>
	`,
};
