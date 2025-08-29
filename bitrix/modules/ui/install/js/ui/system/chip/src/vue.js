import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { ChipDesign, ChipSize } from './const';
export { ChipDesign, ChipSize };
import type { ChipImage } from './types';
export type { ChipImage };

import './chip.css';

// @vue/component
export const Chip = {
	name: 'UiChip',
	components: {
		BIcon,
	},
	props: {
		size: {
			type: String,
			default: ChipSize.Lg,
		},
		design: {
			type: String,
			default: ChipDesign.Outline,
		},
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
			default: '',
		},
		rounded: {
			type: Boolean,
			default: false,
		},
		withClear: {
			type: Boolean,
			default: false,
		},
		lock: {
			type: Boolean,
			default: false,
		},
		trimmable: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click', 'clear'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	methods: {
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey))
			{
				this.$emit('click');
			}
		},
	},
	template: `
		<div
			class="ui-chip"
			:class="[
				'--' + design,
				'--' + size,
				{
					'--rounded': rounded,
					'--trimmable': trimmable,
					'--lock': lock,
					'--with-clear': withClear,
					'--no-text': text.length === 0,
				},
			]"
			tabindex="0"
			@keydown="handleKeydown"
			@click="$emit('click')"
		>
			<img v-if="image" class="ui-chip-icon --image" :src="image.src" :alt="image.alt">
			<BIcon v-if="icon" class="ui-chip-icon" :name="icon"/>
			<div class="ui-chip-text">{{ text }}</div>
			<BIcon v-if="withClear" class="ui-chip-clear" :name="Outline.CROSS_M" @click.stop="$emit('clear')"/>
			<BIcon v-if="lock" class="ui-chip-lock" :name="Outline.LOCK_M"/>
		</div>
	`,
};
