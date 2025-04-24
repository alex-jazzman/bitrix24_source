import { Answer } from './answer';
import { Loc } from '../mixins/loc';
import { DragAndDrop } from '../directives/answer-dnd';
import { Resize } from '../directives/resize';
import { Switcher, SwitcherSize } from 'ui.switcher';

export type QuestionData = {
	questionText: string;
	allowMultipleAnswers: boolean;
	answers: { [key: string]: string; }
};

// @vue/component
export const Question = {
	name: 'voteQuestion',
	directives: { dnd: DragAndDrop, resize: Resize },
	components: { Answer },
	mixins: [Loc],
	props: {
		id: {
			type: String,
			required: true,
		},
		question: {
			type: Object,
			required: true,
		},
		minAnswersCount: {
			type: Number,
			required: true,
		},
		maxAnswersCount: {
			type: Number,
			required: true,
		},
	},
	emits: ['addAnswer', 'removeAnswer', 'changeQuestion', 'validate'],
	data(): { questionText: string; }
	{
		return { questionText: '' };
	},
	computed:
	{
		answersCount(): number
		{
			return Object.keys(this.question.answers).length;
		},
		isValid(): boolean
		{
			const answers = Object.values(this.question.answers);
			const filledAnswers = answers.filter((answer) => answer !== '');

			return this.question.questionText !== '' && filledAnswers.length >= this.minAnswersCount;
		},
		canAddMoreAnswers(): boolean
		{
			return this.answersCount < this.maxAnswersCount;
		},
	},
	watch:
	{
		isValid(): void
		{
			this.$emit('validate', this.isValid);
		},
	},
	mounted(): void
	{
		const switcher = new Switcher({
			node: this.$refs.multipleAnswersSwitcher,
			size: SwitcherSize.small,
			handlers: {
				toggled: () => {
					this.$emit('changeQuestion', {
						...this.question,
						allowMultipleAnswers: switcher.checked,
					});
				},
			},
		});
	},
	methods:
	{
		changeText(): void
		{
			const question = { ...this.question, questionText: this.questionText };
			this.$emit('changeQuestion', question);
		},
		addAnswer(): void
		{
			this.$emit('addAnswer');
		},
		removeAnswer(answerId: string): void
		{
			this.$emit('removeAnswer', answerId);
		},
		changeAnswer(answerId: string, answerText: string): void
		{
			const answers = this.question.answers;
			const question = {
				...this.question,
				answers: {
					...answers,
					[answerId]: answerText,
				},
			};
			this.$emit('changeQuestion', question);
		},
		orderAnswer(draggedKey: string, targetKey: string): void
		{
			const answers = this.question.answers;
			const newKeys = Object.keys(answers).filter((key) => key !== draggedKey);
			newKeys.splice(newKeys.indexOf(targetKey), 0, draggedKey);
			const newAnswers = newKeys.reduce((acc, key) => {
				acc[key] = answers[key];

				return acc;
			}, {});
			this.$emit('changeQuestion', {
				...this.question,
				answers: newAnswers,
			});
		},
	},
	template: `
		<div class="vote-creation-form__question" :data-id="id">
			<p class="vote-creation-form__question_label">
				{{loc('VOTE_QUESTION_LABEL')}}
			</p>
			<div class="ui-ctl ui-ctl-textarea ui-ctl-no-resize">
				<textarea
					maxlength="250"
					class="ui-ctl-element"
					v-model.trim="questionText"
					v-resize
					@input="changeText"
				></textarea>
			</div>
			<p class="vote-creation-form__question_answer-options">
				{{loc('VOTE_QUESTION_ANSWER_OPTIONS')}}
			</p>
			<div
				class="vote-creation-form__answers"
				v-dnd="orderAnswer"
			>
				<Answer
					v-for="(answer, id) in question.answers"
					:key="id"
					:id="id"
					:answer="answer"
					:removable="answersCount > minAnswersCount"
					@removeAnswer="removeAnswer(id)"
					@changeAnswer="changeAnswer(id, $event)"
				></Answer>
			</div>
			<div
				v-if="canAddMoreAnswers"
				class="vote-creation-form__question_add-answer"
				@click="addAnswer"
			>
				<div class="vote-creation-form__question_plus"></div>
				<span>{{loc('VOTE_QUESTION_ADD_ANSWER')}}</span>
			</div>
			<div class="vote-creation-form__question_multiple-answers">
				<span>{{loc('VOTE_QUESTION_MULTIPLE_ANSWERS')}}</span>
				<div ref="multipleAnswersSwitcher"></div>
			</div>
		</div>
	`,
};
