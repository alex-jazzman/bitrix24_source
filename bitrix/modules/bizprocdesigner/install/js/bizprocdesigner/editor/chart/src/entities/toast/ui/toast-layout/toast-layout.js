import { BIcon } from 'ui.icon-set.api.vue';

import './style.css';

// @vue/component
export const ToastLayout = {
	name: 'ToastLayout',
	components: {
		BIcon,
	},
	props: {
		icon: {
			type: [String, null],
			default: null,
			required: false,
		},
		message: {
			type: String,
			required: true,
		},
	},
	template: `
		<div class="editor-chart-toast-layout">
			<div class="editor-chart-toast-layout__left">
				<template v-if="icon">
					<div class="editor-chart-toast-layout__icon">
						<BIcon :name="icon" :size="28"/>
					</div>
					<div class="editor-chart-toast-layout__divider">
						<svg xmlns="http://www.w3.org/2000/svg" width="9" height="20" viewBox="0 0 9 20" fill="none">
							<rect x="4" width="1" height="20" fill="#DFE0E3"/>
						</svg>
					</div>
				</template>
				<div class="editor-chart-toast-layout__content">
					<div class="editor-chart-toast-layout__content__message">
						{{ message }}
					</div>
					<div v-if="$slots.contentEnd"
						class="editor-chart-toast-layout__content__end"
					>
						<slot name="contentEnd"></slot>
					</div>
				</div>
			</div>
			<div class="editor-chart-toast-layout__right">
				<slot name="right"></slot>
			</div>
		</div>
	`,
};
