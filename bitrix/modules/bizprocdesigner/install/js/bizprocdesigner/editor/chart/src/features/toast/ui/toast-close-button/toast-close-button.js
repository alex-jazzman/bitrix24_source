import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapActions } from 'ui.vue3.pinia';

import { useToastStore } from '../../../../shared/stores';

import './style.css';

// @vue/component
export const ToastCloseButton = {
	name: 'ToastCloseButton',
	components: {
		BIcon,
	},
	computed: {
		Outline: (): typeof Outline => Outline,
	},
	methods: {
		...mapActions(useToastStore, ['dequeue']),
		onClick(): void
		{
			this.dequeue();
		},
	},
	template: `
		<button class="editor-chart-toast-close-button"
			 @click="onClick"
		>
			<BIcon :name="Outline.CROSS_L" :size="20"></BIcon>
		</button>
	`,
};
