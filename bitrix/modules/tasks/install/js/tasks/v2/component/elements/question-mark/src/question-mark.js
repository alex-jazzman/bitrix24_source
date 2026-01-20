import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { tooltip } from 'tasks.v2.component.elements.hint';

import './question-mark.css';

// @vue/component
export const QuestionMark = {
	name: 'UiQuestionMark',
	components: {
		BIcon,
	},
	directives: { hint },
	props: {
		size: {
			type: Number,
			default: 20,
		},
		hintText: {
			type: String,
			default: '',
		},
		hintMaxWidth: {
			type: Number,
			default: undefined,
		},
	},
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	computed: {
		tooltip(): ?() => ReturnType<typeof tooltip>
		{
			if (!this.hintText)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.hintText,
				popupOptions: {
					offsetLeft: this.$el.offsetWidth / 2,
					maxWidth: this.hintMaxWidth,
				},
				timeout: 200,
			});
		},
	},
	template: `
		<BIcon v-hint="tooltip" class="b24-question-mark" :name="Outline.QUESTION" :size/>
	`,
};
