import { defineComponent } from 'ui.vue3';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { tooltip } from 'socialnetwork.v2.components.elements.ui-hint';

// @vue/component
export const QuestionMark = defineComponent({
	name: 'UiQuestionMark',
	components: {
		BIcon,
	} as { BIcon: typeof BIcon },
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
			default: 300,
		},
	},
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	computed: {
		tooltip(): (() => HintParams) | null
		{
			if (!this.hintText)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.hintText,
				popupOptions: {
					// @ts-ignore
					offsetLeft: this.$el.offsetWidth / 2,
					maxWidth: this.hintMaxWidth,
				},
				timeout: 200,
			});
		},
	},
	template: `
		<BIcon v-hint="tooltip" class="b24-question-mark" :name="Outline.QUESTION" :size color="var(--ui-color-base-4)"/>
	`,
});
