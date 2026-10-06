import { Outline } from 'ui.icon-set.api.core';
import { ToastLayout } from '../toast-layout/toast-layout';
import { Toast, ToastColorScheme } from '../toast/toast';
import { ToastCloseButton } from '../../../../features/toast';

// @vue/component
export const ToastAgentNotice = {
	name: 'ToastAgentNotice',
	components: {
		Toast,
		ToastLayout,
		ToastCloseButton,
	},
	props: {
		message: {
			type: String,
			required: true,
		},
		colorScheme: {
			type: String,
			default: ToastColorScheme.Processing,
			validator: (value) => Object.values(ToastColorScheme).includes(value),
		},
		closeable: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		icon(): string
		{
			return this.colorScheme === ToastColorScheme.Completed
				? Outline.CIRCLE_CHECK
				: Outline.REFRESH;
		},
	},
	template: `
		<Toast
			role="status"
			aria-live="polite"
			:color-scheme="colorScheme"
			:data-test-id="$testId('aiAgentToast')"
		>
			<ToastLayout
				:icon="icon"
				:message="message"
			>
				<template v-if="closeable" #right>
					<ToastCloseButton/>
				</template>
			</ToastLayout>
		</Toast>
	`,
};
