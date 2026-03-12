import { mapState } from 'ui.vue3.pinia';

import { useToastStore } from '../../../shared/stores';

// @vue/component
export const ToastWidget = {
	name: 'ToastWidget',
	computed: {
		...mapState(useToastStore, ['current']),
	},
	template: `
		<template v-if="current">
			<slot :name="current.type" :message="current.message">
			</slot>
		</template>
	`,
};
