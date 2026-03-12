import type { BitrixVueComponentProps } from 'ui.vue3';

import { QuestionMark } from 'tasks.v2.component.elements.question-mark';

import './field-list.css';

// eslint-disable-next-line no-unused-vars
type Field = {
	title: string,
	hint: ?string,
	component: BitrixVueComponentProps,
	props: { [prop: string]: any },
	events: { [key: string]: () => void },
	withSeparator: boolean,
	printIgnore?: boolean,
};

// @vue/component
export const FieldList = {
	components: {
		QuestionMark,
	},
	props: {
		/** @type Field[] */
		fields: {
			type: Array,
			required: true,
		},
	},
	template: `
		<div class="b24-field-list">
			<template v-for="(field, key) in fields" :key>
				<div class="b24-field-list-row" :class="{ 'print-ignore': field.printIgnore }">
					<div class="b24-field-list-title" :class="{ '--with-separator': field.withSeparator}">
						{{ field.title }}
						<div class="b24-field-list-title-hint">
							<QuestionMark v-if="field.hint" :size="16" :hintText="field.hint" @click.stop/>
						</div>
					</div>
					<div class="b24-field-list-value" :class="{ '--with-separator': field.withSeparator}">
						<component :is="field.component" v-bind="field.props" v-on="field.events ?? {}"/>
					</div>
				</div>
			</template>
		</div>
	`,
};
