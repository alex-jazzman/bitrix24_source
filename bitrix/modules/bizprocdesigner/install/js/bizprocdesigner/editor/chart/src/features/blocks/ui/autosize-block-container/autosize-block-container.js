import { mapActions } from 'ui.vue3.pinia';
import {
	BlockContainer,
	diagramStore as useDiagramStore,
	BLOCK_COLOR_NAMES,
} from '../../../../entities/blocks';
// eslint-disable-next-line no-unused-vars
import type { BlockId } from '../../../../shared/types';
// eslint-disable-next-line no-unused-vars
import type { MenuItemOptions } from 'ui.vue3.components.menu';

// @vue/component
export const AutosizeBlockContainer = {
	name: 'AutosizeBlockContainer',
	components: {
		BlockContainer,
	},
	props: {
		/** @type BlockId */
		blockId: {
			type: String,
			required: true,
		},
		/** @type Array<MenuItemOptions> */
		contextMenuItems: {
			type: Array,
			default: () => ([]),
		},
		width: {
			type: Number,
			default: null,
		},
		height: {
			type: Number,
			default: null,
		},
		autosize: {
			type: Boolean,
			default: false,
		},
		highlighted: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		colorName: {
			type: String,
			default: BLOCK_COLOR_NAMES.WHITE,
			validator(name): boolean
			{
				return Object.values(BLOCK_COLOR_NAMES).includes(name);
			},
		},
	},
	computed: {
		size(): { width: number, height: number } | {}
		{
			if (this.autosize)
			{
				return {};
			}

			return {
				width: this.width,
				height: this.height,
			};
		},
	},
	mounted(): void
	{
		if (this.autosize)
		{
			this.$nextTick(() => {
				const { width, height } = this.$refs.blockContainer?.$el?.getBoundingClientRect() ?? {};
				this.setSizeAutosizedBlock(this.blockId, width, height);
			});
		}
	},
	methods: {
		...mapActions(useDiagramStore, ['setSizeAutosizedBlock']),
	},
	template: `
		<BlockContainer
			ref="blockContainer"
			v-bind="size"
			:contextMenuItems="contextMenuItems"
			:highlighted="highlighted"
			:disabled="disabled"
			:colorName="colorName"
		>
			<template #default="{ isOpenContextMenu }">
				<slot :isOpenContextMenu="isOpenContextMenu"/>
			</template>
		</BlockContainer>
	`,
};
