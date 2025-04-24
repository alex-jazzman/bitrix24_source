import { Loc } from 'main.core';
import { VoteAnswerVoted } from './answer-voted';
import type { BackendVotedUser } from './types';
export const VoteResultDisplay = {
	name: 'VoteResultDisplay',
	components: { VoteAnswerVoted },
	props: {
		loadedData: {
			/** @type {BackendResultAll} */
			type: Object,
			required: true,
		},
		votedPageSize: {
			type: Number,
			required: true,
		},
	},
	computed:
	{
		anonymityLabel(): string
		{
			return this.loadedData?.attach?.ANONYMITY > 1
				? this.$Bitrix.Loc.getMessage('VOTE_JS_ATTACHED_RESULT_ANONYMOUS')
				: this.$Bitrix.Loc.getMessage('VOTE_JS_ATTACHED_RESULT_PUBLIC')
				;
		},
	},
	methods: {
		getVoted(answerId: number): BackendVotedUser[]
		{
			return this.loadedData.voted?.[answerId] ?? [];
		},
		isAnswerSelected(questionId: number, answerId: number): boolean
		{
			return this.loadedData.attach.userAnswerMap?.[questionId]?.[answerId] ?? false;
		},
		getQuestionVoted(count: number): string
		{
			return Loc.getMessagePlural('VOTE_JS_ATTACHED_RESULT_QUESTION_VOTED_COUNT', parseInt(count, 10), {
				'#COUNT#': count,
			});
		},
	},
	template: `
		<div class="vote-result-wrapper">
			<div v-if="loadedData">
				<div class="ui-text-4">{{ anonymityLabel }}</div>
				<div v-for="(question, questionId) in loadedData?.attach?.QUESTIONS" :key="questionId">
					<div class="ui-title-3">{{ question.QUESTION }}</div>
					<div class="ui-text-4">{{ this.getQuestionVoted(question.COUNTER) }}</div>
					<div class="vote-result-answer" v-for="(answer, answerId) in question.ANSWERS" :key="answerId">
						<div class="vote-result-answer-inner" :class="{ 'vote-answer-user': this.isAnswerSelected(questionId, answerId) }">
							<div class="vote-answer-message">{{ answer.MESSAGE }}</div>
							<div class="vote-answer-percent">
								<span class="vote-answer-percent-digit">{{ Math.round(answer.PERCENT) }}</span>
								<span class="vote-answer-percent-symbol">%</span>
							</div>
							<div
								class="vote-result-answer-inner-percent"
								:style="{ width: answer.PERCENT + '%' }"
							></div>
						</div>
						<div v-if="this.getVoted(answerId).length > 0">
							<VoteAnswerVoted
								:count="answer.COUNTER"
								:firstPageVoted="getVoted(answerId)"
								:signedAttachId="loadedData.attach.signedAttachId"
								:answerId="answerId"
								:pageSize="votedPageSize"
							/>
						</div>
					</div>
				</div>
			</div>
			<div v-if="!loadedData">
				{{ this.$Bitrix.Loc.getMessage('VOTE_JS_ATTACHED_RESULT_LOAD_ERROR') }}
			</div>
		</div>
	`,
};
