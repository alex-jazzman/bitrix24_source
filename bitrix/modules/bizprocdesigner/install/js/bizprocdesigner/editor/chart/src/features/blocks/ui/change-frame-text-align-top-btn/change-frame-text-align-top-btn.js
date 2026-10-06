import { mapActions } from 'ui.vue3.pinia';
import { useBlockDiagram } from 'ui.block-diagram';
import {
	TextAlignMenuTopBtn,
	diagramStore as useDiagramStore,
	getContextMenuName,
	FRAME_TEXT_ALIGN_OPTIONS,
} from '../../../../entities/blocks';
import { textEditorServices } from '../../../../shared/ui';
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
	setup(props): ChangeFrameTextAlignTopBtnSetup
	{
		const { updateBlock } = useBlockDiagram();

		return {
			getContextMenuName,
			updateBlock,
			textEditorService: textEditorServices.get(props.block.id),
		};
	},
	computed: {
		textAlign(): string
		{
			return this.block.node.frameTextAlign;
		},
		isEditFrameContent(): boolean
		{
			return this.textEditorService.isEdit.value;
		},
	},
	methods: {
		...mapActions(useDiagramStore, [
			'beginSaveRun',
			'publicDraft',
			'updateStatus',
		]),
		async onUpdateFrameTextAlign(frameTextAlign: string): Promise<void>
		{
			if (this.isEditFrameContent && frameTextAlign === FRAME_TEXT_ALIGN_OPTIONS.NONE)
			{
				try
				{
					await this.textEditorService.onShowConfirmSave();
				}
				catch
				{
					return;
				}
			}

			// Reserved after the confirm dialog and before the request: a save started after this
			// one owns the status, so a late answer here must not overwrite it.
			const runId = this.beginSaveRun();
			try
			{
				this.updateBlock({
					...this.block,
					node: {
						...this.block.node,
						frameTextAlign,
					},
				});
				this.updateStatus(await this.publicDraft(), runId);
			}
			catch
			{
				this.updateStatus(false, runId);
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
