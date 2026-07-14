import { defineComponent, type PropType } from 'ui.vue3';
import { QuestionMark } from 'socialnetwork.v2.components.elements.question-mark';

import './ui-field.css';

export type HintOptions = {
	size?: number;
	maxWidth?: number;
}

// @vue/component
export const UiField = defineComponent({
	name: 'UiField',
	components: {
		QuestionMark,
	},
	props: {
		label: {
			type: String,
			default: '',
		},
		labelFor: {
			type: String,
			default: '',
		},
		hint: {
			type: [String, null],
			default: null,
		},
		hintOptions: {
			type: Object as PropType<HintOptions>,
			default: null,
		},
	},
	template: `
		<div class="socialnetwork--project-wizard--ui-field">
			<div class="socialnetwork--project-wizard--ui-field_label-wrapper">
				<slot name="label">
					<label
						v-if="label"
						:for="labelFor"
						class="socialnetwork--project-wizard--ui-field_label"
					>
						{{ label }}
					</label>
				</slot>
				<template v-if="hint">
					<QuestionMark :hintText="hint" :size="hintOptions?.size" :hintMaxWidth="hintOptions?.maxWidth"/>
				</template>
			</div>
			<div class="socialnetwork--project-wizard--ui-field_field">
				<slot/>
			</div>
		</div>
	`,
});
