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
	computed: {
		/**
		 * A summary of several counters arrives as one message with its lines separated by newlines,
		 * and the block holds plain text, where a newline is not a break of its own. Splitting here
		 * keeps the message a string for the queue of toasts and keeps the text escaped by Vue - a
		 * single-line message still renders exactly one line, as it always did.
		 */
		messageLines(): Array<string>
		{
			return this.message.split('\n');
		},
	},
	template: `
		<div class="editor-chart-toast-layout">
			<div class="editor-chart-toast-layout__left">
				<template v-if="icon">
					<div class="editor-chart-toast-layout__icon">
						<BIcon
							:name="icon"
							:size="28"
							color="var(--bizprocdesigner-editor-toast-content-color, var(--ui-color-base-8))"
						/>
					</div>
					<div class="editor-chart-toast-layout__divider">
						<svg xmlns="http://www.w3.org/2000/svg" width="9" height="20" viewBox="0 0 9 20" fill="none">
							<rect x="4" width="1" height="20" fill="currentColor"/>
						</svg>
					</div>
				</template>
				<div class="editor-chart-toast-layout__content">
					<div class="editor-chart-toast-layout__content__message">
						<div v-for="(line, index) in messageLines" :key="index">{{ line }}</div>
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
