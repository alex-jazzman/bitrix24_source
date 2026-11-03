import { defineComponent } from 'ui.vue3';

export const CallButtonTitle = defineComponent({
	name: 'CallButtonTitle',
	props: {
		text: {
			type: String,
			required: true,
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
		copilotMode: {
			type: Boolean,
			default: false,
		},
		showIcon: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		callButtonIconClasses(): string[]
		{
			return [
				'bx-call-chat-header-call-button__icon',
				...(this.copilotMode ? ['--copilot'] : []),
				...(this.compactMode ? ['--compact'] : []),
			];
		},
	},
	template: `
		<div v-if="showIcon || compactMode" :class="callButtonIconClasses"></div>
		<div v-if="!compactMode" class="bx-call-chat-header-call-button__text">
			{{ text }}
		</div>
	`,
});
