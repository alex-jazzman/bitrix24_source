import { Outline } from 'ui.icon-set.api.core';
import { ToastLayout } from '../toast-layout/toast-layout';
import { Toast, ToastColorScheme } from '../toast/toast';
import { ToastCloseButton } from '../../../../features/toast';

// @vue/component
export const ToastWarning = {
	name: 'ToastWarning',
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
		closeable: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		ToastColorScheme: (): typeof ToastColorScheme => ToastColorScheme,
		Outline: (): typeof Outline => Outline,
	},
	template: `
		<Toast :color-scheme="ToastColorScheme.Warning">
			<ToastLayout
				:icon="Outline.ALERT_ACCENT"
				:message="message"
			>

				<template #contentEnd>
					<slot name="contentEnd"></slot>
				</template>

				<template v-if="closeable" #right>
					<ToastCloseButton/>
				</template>

			</ToastLayout>
		</Toast>
	`,
};
