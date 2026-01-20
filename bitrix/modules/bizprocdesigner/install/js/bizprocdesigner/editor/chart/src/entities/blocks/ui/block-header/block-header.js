import './block-header.css';

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
	},
	template: `
		<div class="editor-chart-block-header">
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
			<div class="editor-chart-block-header__title">{{ block.node?.title }}</div>
		</div>
	`,
};
