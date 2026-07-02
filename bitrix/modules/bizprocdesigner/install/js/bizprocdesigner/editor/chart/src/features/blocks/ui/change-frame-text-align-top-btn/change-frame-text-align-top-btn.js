import { mapActions } from 'ui.vue3.pinia';
import { useBlockDiagram } from 'ui.block-diagram';
import {
	TextAlignMenuTopBtn,
	diagramStore as useDiagramStore,
	getContextMenuName,
} from '../../../../entities/blocks';

import type { Block, BlockId } from '../../../../shared/types';

type ChangeFrameTextAlignTopBtnSetup = {
	getContextMenuName: (blockId: BlockId) => string,
	updateBlock: (block: Block) => void,
};

export const ChangeFrameTextAlignTopBtn = {
	name: 'ChangeFrameTextAlignTopBtn',
	components: {
		TextAlignMenuTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(): ChangeFrameTextAlignTopBtnSetup
	{
		const { updateBlock } = useBlockDiagram();

		return {
			getContextMenuName,
			updateBlock,
		};
	},
	computed: {
		textAlign(): string
		{
			return this.block.node.frameTextAlign;
		},
	},
	methods: {
		...mapActions(useDiagramStore, [
			'publicDraft',
			'updateStatus',
		]),
		async onUpdateFrameTextAlign(frameTextAlign: string): Promise<void>
		{
			try
			{
				this.updateBlock({
					...this.block,
					node: {
						...this.block.node,
						frameTextAlign,
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
		<TextAlignMenuTopBtn
			:textAlign="textAlign"
			:contextMenuName="getContextMenuName(block.id)"
			@update:textAlign="onUpdateFrameTextAlign"
			@update:open="$emit('update:open', $event)"
		/>
	`,
};
