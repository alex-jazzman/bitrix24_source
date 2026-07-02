import './block-header.css';

const BLOCK_HEADER_CLASS_NAMES = {
	base: 'editor-chart-block-header',
	deactivated: '--deactivated',
};

// @vue/component
export const BlockHeader = {
	name: 'block-header',
	props: {
		block: {
			type: Object,
			required: true,
		},
		subIconExternal: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			default: '',
		},
		deactivated: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		blockHeaderClassNames(): { [string]: boolean }
		{
			return {
				[BLOCK_HEADER_CLASS_NAMES.base]: true,
				[BLOCK_HEADER_CLASS_NAMES.deactivated]: this.deactivated,
			};
		},
	},
	template: `
		<div :class="blockHeaderClassNames">
			<div class="editor-chart-block-header__icon-wrapper">
				<slot name="icon"/>
			</div>

			<template v-if="$slots.subIcon">
				<span class="editor-chart-block-header__divider" aria-hidden="true"></span>
				<div :class="[
					  'editor-chart-block-header__icon-wrapper',
					  'editor-chart-block-header__icon-wrapper--sub',
					  { 'editor-chart-block-header__icon-wrapper--sub-external': subIconExternal }
					]">
					<slot name="subIcon"/>
				</div>
			</template>

			<p class="editor-chart-block-header__title">{{ title || block.node?.title }}</p>
		</div>
	`,
};
