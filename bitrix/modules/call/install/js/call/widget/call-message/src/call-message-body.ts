import { defineComponent, type PropType } from 'ui.vue3';

// @vue/component
export const CallMessageBody = defineComponent({
	name: 'CallMessageBody',
	props: {
		iconClasses: {
			type: Array as PropType<string[]>,
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		date: {
			type: String,
			required: true,
		},
	},
	// The root is a fragment, so no attribute or directive may be placed on this component:
	// there is no single element to inherit them and Vue warns about non-inherited attrs.
	template: /* HTML */`
		<span :class="iconClasses"></span>
		<span class="bx-call-message__text-container">
			<span class="bx-call-message__text">{{ text }}</span>
			<span class="bx-im-message-status__date bx-call-message__date">{{ date }}</span>
		</span>
	`,
});
