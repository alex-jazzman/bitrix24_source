import { mapActions } from 'ui.vue3.pinia';
import { useBlockDiagram } from 'ui.block-diagram';
import {
	ColorMenuTopBtn,
	diagramStore as useDiagramStore,
	FRAME_COLOR_NAMES,
	getContextMenuName,
} from '../../../../entities/blocks';

import type { Block, BlockId } from '../../../../shared/types';

type ChangeFrameColorTopBtnSetup = {
	getContextMenuName: (blockId: BlockId) => string,
	updateBlock: (block: Block) => void,
};

// @vue/component
export const ChangeFrameColorTopBtn = {
	name: 'ChangeFrameColorTopBtn',
	components: {
		ColorMenuTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	emits: ['update:open'],
	setup(): ChangeFrameColorTopBtnSetup
	{
		const { updateBlock } = useBlockDiagram();

		return {
			getContextMenuName,
			updateBlock,
		};
	},
	computed: {
		colorName(): string
		{
			return this.block.node.frameColorName;
		},
		colorOptions(): Array<string>
		{
			return Object.values(FRAME_COLOR_NAMES);
		},
	},
	methods: {
		...mapActions(useDiagramStore, [
			'publicDraft',
			'updateStatus',
		]),
		async onUpdateFrameColor(frameColorName: string): Promise<void>
		{
			try
			{
				this.updateBlock({
					...this.block,
					node: {
						...this.block.node,
						frameColorName,
					},
				});
				await this.publicDraft();
				this.updateStatus(true);
			}
			catch
			{
				this.updateStatus(false);
			}
		},
	},
	template: `
		<ColorMenuTopBtn
			:colorName="colorName"
			:options="colorOptions"
			:contextMenuName="getContextMenuName(block.id)"
			@update:colorName="onUpdateFrameColor"
			@update:open="$emit('update:open', $event)"
		/>
	`,
};
