import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './hover-pill.css';

// @vue/component
export const HoverPill = {
	name: 'HoverPill',
	components: {
		BIcon,
	},
	props: {
		withClear: {
			type: Boolean,
			default: false,
		},
		withSettings: {
			type: Boolean,
			default: false,
		},
		textOnly: {
			type: Boolean,
			default: false,
		},
		noOffset: {
			type: Boolean,
			default: false,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: false,
		},
		compact: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['clear', 'settings'],
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	computed: {
		classes(): { [key: string]: boolean }
		{
			return {
				'--text-only': this.textOnly,
				'--no-offset': this.noOffset,
				'--readonly': this.readonly,
				'--active': this.active,
				'--compact': this.compact,
			};
		},
	},
	template: `
		<div class="b24-hover-pill" :class="classes" tabindex="0">
			<div class="b24-hover-pill-content">
				<slot/>
			</div>
			<div v-if="withClear && !readonly" class="b24-hover-pill-remover" @click.stop="$emit('clear')">
				<BIcon :name="Outline.CROSS_L"/>
			</div>
			<div v-if="withSettings" class="b24-hover-pill-remover" @click.stop="$emit('settings')">
				<BIcon :name="Outline.FILTER_2_LINES"/>
			</div>
		</div>
	`,
};
