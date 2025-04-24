import { ready, Event, Dom, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { UI } from 'ui.notification';
import { BitrixVue } from 'ui.vue3';
import { VoteForm } from './components/form';

type FormOptions = {
	chatId: string;
	containerId: string;
	maxQuestionsCount: number;
	minAnswersCount: number;
	maxAnswersCount: number;
};

const indexStep = 10;

const calculateSortOrder = (questionIndex: number): string => {
	return String(questionIndex * indexStep + indexStep);
};

const parseData = (chatId: string): { [key: string]: string } => {
	const { questions, settings } = App.voteForm;
	const { anonymousVote } = settings;
	const data = { chatId, 'IM_MESSAGE_VOTE_DATA[ANONYMITY]': anonymousVote ? '2' : '1' };
	data['IM_MESSAGE_VOTE_DATA[OPTIONS][]'] = '1';

	return Object.values(questions).reduce((acc, question, questionIndex) => {
		const { questionText, allowMultipleAnswers, answers } = question;
		const questionKey = `IM_MESSAGE_VOTE_DATA[QUESTIONS][${questionIndex}]`;
		acc[`${questionKey}[QUESTION]`] = questionText;
		acc[`${questionKey}[C_SORT]`] = calculateSortOrder(questionIndex);
		acc[`${questionKey}[QUESTION_TYPE]`] = 'text';
		acc[`${questionKey}[FIELD_TYPE]`] = '0';
		if (allowMultipleAnswers)
		{
			acc[`${questionKey}[FIELD_TYPE]`] = '1';
		}

		Object.values(answers).forEach((answer, answerIndex) => {
			const answerKey = `${questionKey}[ANSWERS][${answerIndex}]`;
			acc[`${answerKey}[MESSAGE]`] = answer;
			acc[`${answerKey}[MESSAGE_TYPE]`] = 'text';
			acc[`${answerKey}[C_SORT]`] = String(answerIndex * 10 + 10);
			acc[`${answerKey}[FIELD_TYPE]`] = '0';
		});

		return acc;
	}, data);
};

const createVote = async (saveButton: HTMLElement, chatId: string): Promise<void> => {
	const parsedData = parseData(chatId);
	try
	{
		await ajax.runAction('bitrix:vote.Integration.Im.send', { data: parsedData });
		BX.SidePanel.Instance.close();
	}
	catch (response)
	{
		Dom.removeClass(saveButton, 'ui-btn-wait');
		const errors = response?.errors ?? [];
		const [firstError] = errors;
		if (firstError)
		{
			UI.Notification.Center.notify({ content: firstError.message });
		}
	}
};

const toggleSaveButton = (saveButton: HTMLElement): void => {
	Dom.toggleClass(saveButton, 'ui-btn-disabled');
};

const init = (chatId: string): void => {
	const saveButton = document.getElementById('vote-im-edit-slider-button-create');
	toggleSaveButton(saveButton);
	Event.bind(saveButton, 'click', () => createVote(saveButton, chatId));
	const validateHandler = () => toggleSaveButton(saveButton);
	EventEmitter.subscribe('vote-creation-form-validate', validateHandler);
	EventEmitter.subscribeOnce('SidePanel.Slider:onDestroy', () => {
		EventEmitter.unsubscribe('vote-creation-form-validate', validateHandler);
	});
};

export class App
{
	static voteForm: Object;

	static mount(formOptions: FormOptions): void
	{
		const { containerId, chatId, ...rest } = formOptions;
		const container = document.getElementById(containerId);
		const app = BitrixVue.createApp(VoteForm, { options: { ...rest, minQuestionsCount: 1 } });
		App.voteForm = app.mount(container);
		ready(() => init(chatId));
	}
}
