import { Type } from 'main.core';

export type GroupChangeset = {
	name: ?string,
	link: ?string,
};

// @vue/component
export const GroupElement = {
	props: {
		value: {
			type: String,
			default: '',
		},
	},
	computed: {
		group(): GroupChangeset
		{
			return JSON.parse(this.value);
		},
		isNotFilled(): boolean
		{
			return Type.isNull(this.group);
		},
		isHidden(): boolean
		{
			return Object.keys(this.group).length === 0;
		},
		isLinkFilled(): boolean
		{
			return Type.isStringFilled(this.group?.link);
		},
	},
	template: `
		<span v-if="isNotFilled"/>
		<span v-else-if="isHidden">{{ loc('TASKS_V2_HISTORY_LOG_HIDDEN_VALUE') }}</span>
		<a v-else-if="isLinkFilled" :href="group?.link" target="_top">{{ group?.name }}</a>
		<span v-else>{{ group?.name }}</span>
	`,
};
