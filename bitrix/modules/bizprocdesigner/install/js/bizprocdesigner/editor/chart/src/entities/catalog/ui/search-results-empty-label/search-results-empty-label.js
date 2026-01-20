import './search-results-empty-label.css';
import { Form } from 'ui.feedback.form';
import { useLoc } from '../../../../shared/composables';
import type { GetMessage } from '../../../../shared/composables';

export type SearchResultsEmptyLabelSetup = {
	getMessage: GetMessage,
	before: string,
	link: string,
	after: string,
	onFeedbackLinkClick: () => void,
};

// @vue/component
export const SearchResultsEmptyLabel = {
	name: 'search-results-empty-label',
	setup(): SearchResultsEmptyLabelSetup
	{
		const { getMessage } = useLoc();

		const description = getMessage(
			'BIZPROCDESIGNER_EDITOR_EMPTY_SEARCH_DESCRIPTION',
		);
		const [before, link, after] = description.split(/\[feedback]|\[\/feedback]/);

		function onFeedbackLinkClick(event): void
		{
			event.preventDefault();

			Form.open(
				{
					id: String(Math.random()),
					forms: [
						{ zones: ['by', 'kz', 'ru'], id: 438, lang: 'ru', sec: 'odyyl1' },
						{ zones: ['com.br'], id: 436, lang: 'br', sec: '8fb4et' },
						{ zones: ['la', 'co', 'mx'], id: 434, lang: 'es', sec: 'ze9mqq' },
						{ zones: ['de'], id: 432, lang: 'de', sec: 'm8isto' },
						{ zones: ['en', 'eu', 'in', 'uk'], id: 430, lang: 'en', sec: 'etg2n4' },
					],
				},
			);
		}

		return {
			getMessage,
			before,
			link,
			after,
			onFeedbackLinkClick,
		};
	},
	template: `
		<div class="editor-chart-search-results-empty-label">
			<h2>{{ getMessage('BIZPROCDESIGNER_EDITOR_EMPTY_SEARCH_TITLE') }}</h2>
			<p>{{ before }} <a href="#" @click="onFeedbackLinkClick">{{ link }}</a> {{ after }}</p>
		</div>
	`,
};
