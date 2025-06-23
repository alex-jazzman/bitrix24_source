import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import './chip.css';

export type ChipImage = {
	src: string,
	alt: string,
};

export const ChipDesign = Object.freeze({
	Outline: 'outline',
	OutlineAccent: 'outline-accent',
	OutlineAlert: 'outline-alert',
	Shadow: 'shadow',
	ShadowAccent: 'shadow-accent',
});

// @vue/component
export const Chip = {
	name: 'UiChip',
	components: {
		BIcon,
	},
	props: {
		icon: {
			type: String,
			default: '',
		},
		image: {
			/** @type ChipImage */
			type: Object,
			default: null,
		},
		text: {
			type: String,
			required: true,
		},
		design: {
			type: String,
			default: ChipDesign.Outline,
		},
		withClear: {
			type: Boolean,
			default: false,
		},
		lock: {
			type: Boolean,
			default: false,
		},
		soon: {
			type: Boolean,
			default: false,
		},
		trimmable: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['clear', 'click'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	methods: {
		clear(event: MouseEvent): void
		{
			event.stopPropagation();

			this.$emit('clear');
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey))
			{
				this.$emit('click');
			}
		},
		focus(): void
		{
			this.$el.focus();
		},
	},
	template: `
		<div
			class="b24-chip"
			:class="['--' + design, { '--soon': soon, '--trimmable': trimmable, '--lock': lock }]"
			tabindex="0"
			@keydown="handleKeydown"
			@click="$emit('click')"
		>
			<img v-if="image" class="b24-chip-image" :src="image.src" :alt="image.alt">
			<BIcon v-if="icon" class="b24-chip-icon" :name="icon"/>
			<div class="b24-chip-text">{{ text }}</div>
			<span v-if="soon" class="b24-chip-soon">скоро</span>
			<BIcon v-if="withClear" class="b24-chip-clear" :name="Outline.CROSS_M" @click="clear"/>
			<BIcon v-if="lock" class="b24-chip-lock" :name="Outline.LOCK_M"/>
		</div>
	`,
};
