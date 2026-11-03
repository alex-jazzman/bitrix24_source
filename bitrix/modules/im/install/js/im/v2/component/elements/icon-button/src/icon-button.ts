import { BIcon } from 'ui.icon-set.api.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import 'im.v2.css.classes';

import './icon-button.css';

// @vue/component
export const IconButton = defineComponent({
	name: 'IconButton',
	components: { BIcon } as { BIcon: typeof BIcon },
	props: {
		iconName: {
			type: String,
			required: true,
		},
		label: {
			type: String,
			required: true,
		},
		// The native tooltip repeats the label unless the consumer says otherwise. A consumer that
		// shows a hint of its own over the same button passes null and gets no title attribute at
		// all, so the two hints do not pop up together. The accessible name is unaffected either
		// way - aria-label carries it.
		title: {
			type: String as PropType<string | null | undefined>,
			default: undefined,
		},
		iconSize: {
			type: Number,
			default: 24,
		},
		iconColor: {
			type: String as PropType<string | null>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		pressed: {
			type: Boolean as PropType<boolean | null>,
			default: null,
		},
		expanded: {
			type: Boolean as PropType<boolean | null>,
			default: null,
		},
		// The Tab stop is stated, not inherited: WebKit keeps a bare <button> out of the Tab order until
		// full keyboard access is turned on in the OS, so without the attribute the button is unreachable
		// from the keyboard there. A consumer whose button sits inside a roving-focus zone passes -1 - the
		// zone owns the attribute for its members, and a static stop would give it a second entry point.
		tabindex: {
			type: Number,
			default: 0,
		},
	},
	emits: ['click'],
	computed: {
		titleAttribute(): string | null
		{
			return this.title === undefined ? this.label : this.title;
		},
	},
	template: `
		<button
			type="button"
			class="bx-im-icon-button__container --focus-visible"
			:aria-label="label"
			:title="titleAttribute"
			:aria-pressed="pressed"
			:aria-expanded="expanded"
			:tabindex="tabindex"
			:disabled="disabled"
			:aria-disabled="disabled"
			@click="$emit('click', $event)"
		>
			<BIcon :name="iconName" :size="iconSize" :color="iconColor" :aria-hidden="true" />
		</button>
	`,
});
