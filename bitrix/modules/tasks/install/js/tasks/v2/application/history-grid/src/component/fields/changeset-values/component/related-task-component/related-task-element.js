import { Type } from 'main.core';

export type RelatedTaskChangeset = {
	title: ?string,
	link: ?string,
};

// @vue/component
export const RelatedTaskElement = {
	props: {
		/** @type RelatedTaskChangeset */
		relatedTaskItem: {
			type: Object,
			required: true,
		},
	},
	computed: {
		isLinkFilled(): boolean
		{
			return Type.isStringFilled(this.relatedTaskItem?.link);
		},
	},
	template: `
		<a v-if="isLinkFilled" :href="relatedTaskItem?.link">{{ relatedTaskItem?.title }}</a>
		<span v-else>{{ relatedTaskItem?.title }}</span>
	`,
};
