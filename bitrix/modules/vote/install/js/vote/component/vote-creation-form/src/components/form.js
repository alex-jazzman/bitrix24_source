import { EventEmitter } from 'main.core.events';
import { Switcher, SwitcherSize } from 'ui.switcher';
import { Question, type QuestionData } from './question';
import { Loc } from '../mixins/loc';
import 'ui.forms';
import '../style.css';

type FormData = {
	questions: { [questionId: string]: QuestionData; };
	validatedQuestions: { [questionId: string]: boolean; };
};

// @vue/component
export const VoteForm = {
	name: 'voteForm',
	components: { Question },
	mixins: [Loc],
	props: {
		options: {
			type: Object,
			required: true,
		},
	},
	data(): FormData
	{
		return {
			questions: {},
			validatedQuestions: {},
		};
	},
	computed:
	{
		questionsCount(): number
		{
			return Object.keys(this.questions).length;
		},
		isFormValid(): boolean
		{
			const validationValues = Object.values(this.validatedQuestions);
			if (validationValues.length === 0)
			{
				return false;
			}

			return validationValues.every((value) => value);
		},
		canAddMoreQuestions(): boolean
		{
			return this.questionsCount < this.options.maxQuestionsCount;
		},
	},
	watch:
	{
		isFormValid(): void
		{
			EventEmitter.emit('vote-creation-form-validate');
		},
	},
	created(): void
	{
		this.questionIdCounter = 1;
		this.answerIdCounter = 1;
		this.settingsLabels = { anonymousVote: this.loc('VOTE_SETTING_ANONYMOUS') };
		this.settings = { anonymousVote: false };
		this.initQuestions();
	},
	mounted(): void
	{
		Object.keys(this.settingsLabels).forEach((id) => {
			const switcher = new Switcher({
				node: this.$refs[id][0],
				size: SwitcherSize.small,
				handlers: {
					toggled: () => {
						this.settings = { ...this.settings, [id]: switcher.checked };
					},
				},
			});
		});
	},
	methods:
	{
		initQuestions(): void
		{
			const { minQuestionsCount, minAnswersCount } = this.options;
			const answersCount = minQuestionsCount * minAnswersCount;
			let answerIndex = 1;
			let questionId = `vote_question_${this.questionIdCounter}`;
			for (let i = 0; i < answersCount; i++)
			{
				if (answerIndex > minAnswersCount)
				{
					answerIndex = 1;
					questionId = `vote_question_${++this.questionIdCounter}`;
				}

				if (!this.questions[questionId])
				{
					this.validatedQuestions[questionId] = false;
					this.questions[questionId] = { questionText: '', answers: {}, allowMultipleAnswers: false };
				}

				const answerId = `vote_answer_${this.answerIdCounter++}`;
				this.questions[questionId].answers[answerId] = '';
				answerIndex += 1;
			}
		},
		addQuestion(): void
		{
			const answers = {};
			const { minAnswersCount } = this.options;
			for (let i = 0; i < minAnswersCount; i++)
			{
				answers[`vote_answer_${this.answerIdCounter++}`] = '';
			}

			const questionId = `vote_question_${++this.questionIdCounter}`;
			this.questions[questionId] = {
				questionText: '',
				answers,
				allowMultipleAnswers: false,
			};
			this.validatedQuestions[questionId] = false;
		},
		addAnswer(questionId: string): void
		{
			const question = this.questions[questionId];
			const { answers } = question;
			answers[`vote_answer_${this.answerIdCounter++}`] = '';
		},
		removeAnswer(questionId: string, answerId: string): void
		{
			const question = this.questions[questionId];
			delete question.answers[answerId];
		},
		changeQuestion(questionId: string, data: FormData['questions']): void
		{
			this.questions[questionId] = data;
		},
		validate(questionId: string, value: boolean): void
		{
			this.validatedQuestions[questionId] = value;
		},
	},
	template: `
		<div class="vote-creation-form">
			<div class="vote-creation-form__questions">
				<Question
					v-for="(question, id) in questions"
					:key="id"
					:id="id"
					:question="question"
					:maxAnswersCount="options.maxAnswersCount"
					:minAnswersCount="options.minAnswersCount"
					@addAnswer="addAnswer(id)"
					@removeAnswer="removeAnswer(id, $event)"
					@changeQuestion="changeQuestion(id, $event)"
					@validate="validate(id, $event)"
				></Question>
				<button
					v-if="canAddMoreQuestions"
					class="ui-btn ui-btn-light-border ui-btn-sm ui-btn-no-caps ui-btn-round vote-creation-form__add-question-btn"
					@click="addQuestion"
				>
					{{loc('VOTE_ADD_QUESTION')}}
				</button>
			</div>
			<div class="vote-creation-form__settings">
				<p class="vote-creation-form__settings_title">
					{{loc('VOTE_SETTINGS_TITLE')}}
				</p>
				<div
					v-for="(label, id) in settingsLabels"
					class="vote-creation-form__settings_setting"
				>
					<span>{{label}}</span>
					<div :ref="id"></div>
				</div>
			</div>
		</div>
	`,
};
