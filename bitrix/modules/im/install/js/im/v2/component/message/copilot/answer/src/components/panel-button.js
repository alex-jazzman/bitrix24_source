import { BIcon } from 'ui.icon-set.api.vue';

import '../css/bottom-panel.css';

// @vue/component
export const PanelButton = {
	name: 'PanelButton',
	components: { BIcon },
	props: {
		name: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			default: '',
		},
		active: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	methods: {
		onClick(): void
		{
			if (this.disabled)
			{
				return;
			}

			this.$emit('click');
		},
	},
	template: `
		<BIcon
			class="bx-im-message-ai-assistant-v2-answer__action-icon"
			:class="{ '--active': active }"
			:name="name"
			:hoverable="!disabled"
			:title="title"
			@click="onClick"
		/>
	`,
};
