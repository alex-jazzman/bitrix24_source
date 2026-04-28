import { LocMixin } from 'sign.v2.b2e.vue-util';
import { SectionType } from '../types';

// @vue/component
export const PlaceholderItem = {
	name: 'PlaceholderItem',
	mixins: [LocMixin],
	props: {
		placeholder: {
			type: Object,
			required: true,
		},
		dataTestId: {
			type: String,
			default: '',
		},
		sectionType: {
			type: String,
			default: '',
		},
	},
	data(): Object
	{
		return {
			isCopied: false,
		};
	},
	computed: {
		placeholderValue(): string
		{
			return `{${this.placeholder.value}}`;
		},
		containerClasses(): Object
		{
			return {
				'sign-placeholders-item': true,
				'sign-placeholders-item--copied': this.isCopied,
			};
		},
		typeIconClasses(): Object
		{
			const iconType = Object.values(SectionType).includes(this.sectionType) ? this.sectionType : 'default';

			return {
				'sign-placeholders-type-icon': true,
				[`sign-placeholders-type-icon--${iconType}`]: true,
			};
		},
	},
	methods: {
		copyToClipboard(): boolean
		{
			if (BX?.clipboard?.copy)
			{
				top.BX.clipboard.copy(this.placeholderValue);
				this.isCopied = true;

				setTimeout(() => {
					this.isCopied = false;
				}, 1000);
			}

			return false;
		},
	},
	template: `
		<div :class="containerClasses" @click="copyToClipboard" :data-test-id="dataTestId">
			<template v-if="isCopied">
				<div class="sign-placeholders-copied">
					<span class="sign-placeholders-copied-icon"></span>
					<span class="sign-placeholders-copied-message">
						{{ loc('PLACEHOLDER_LIST_COPIED_LABEL') }}
					</span>
				</div>
			</template>
			<template v-else>
				<div class="sign-placeholders-item-content">
					<span :class="typeIconClasses" :title="placeholder.value"></span>
					<span class="sign-placeholders-item-name">{{ placeholder.name }}</span>
				</div>
				<span class="sign-placeholders-copy-icon" :title="placeholder.value"></span>
			</template>
		</div>
	`,
};
