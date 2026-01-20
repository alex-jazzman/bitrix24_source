import { RichLoc } from 'ui.vue3.components.rich-loc';

export type HistoryChangeset = {
	fromValue: string,
	toValue: string,
};

// @vue/component
export const HistoryChange = {
	components: {
		RichLoc,
	},
	props: {
		changeset: {
			/** @type HistoryChangeset */
			type: Object,
			required: true,
		},
		component: {
			type: Object,
			default: null,
		},
		format: {
			type: Function,
			default: null,
		},
	},
	template: `
		<RichLoc
			v-if="component || format"
			:text="loc('TASKS_V2_HISTORY_LOG_CHANGE')"
			:placeholder="['[from/]', '[to/]']"
		>
			<template #from>
				<component v-if="component" :is="component" :value="changeset.fromValue"/>
				<template v-else>{{ format(changeset.fromValue) }}</template>
			</template>
			<template #to>
				<component v-if="component" :is="component" :value="changeset.toValue"/>
				<template v-else>{{ format(changeset.toValue) }}</template>
			</template>
		</RichLoc>
	`,
};
