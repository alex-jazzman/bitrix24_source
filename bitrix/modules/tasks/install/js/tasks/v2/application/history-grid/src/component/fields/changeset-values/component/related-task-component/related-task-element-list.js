import { Type } from 'main.core';

import { RelatedTaskElement } from './related-task-element';
import type { RelatedTaskChangeset } from './related-task-element';

// @vue/component
export const RelatedTaskElementList = {
	components: {
		RelatedTaskElement,
	},
	props: {
		value: {
			type: String,
			default: '',
		},
	},
	computed: {
		relatedTaskItems(): RelatedTaskChangeset[] | null
		{
			return JSON.parse(this.value);
		},
		isNotFilled(): boolean
		{
			return Type.isNull(this.relatedTaskItems);
		},
		isHidden(): boolean
		{
			return this.relatedTaskItems?.length === 0;
		},
	},
	template: `
		<span v-if="isNotFilled"/>
		<span v-else-if="isHidden">{{ loc('TASKS_V2_HISTORY_LOG_HIDDEN_VALUE') }}</span>
		<template v-else v-for="(relatedTaskItem, index) of relatedTaskItems" :key="index">
			<RelatedTaskElement :relatedTaskItem/>{{ index < relatedTaskItems.length - 1 ? ', ': '' }}
		</template>
	`,
};
