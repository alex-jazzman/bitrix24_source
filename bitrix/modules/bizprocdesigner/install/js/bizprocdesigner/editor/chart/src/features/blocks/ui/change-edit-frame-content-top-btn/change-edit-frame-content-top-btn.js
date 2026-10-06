import { Outline } from 'ui.icon-set.api.vue';
import { IconButton, textEditorServices } from '../../../../shared/ui';
import { FRAME_TEXT_ALIGN_OPTIONS } from '../../../../entities/blocks';
import { useBlockDiagram } from 'ui.block-diagram';

// @vue/component
export const ChangeEditFrameContentTopBtn = {
	name: 'ChangeEditFrameContentTopBtn',
	components: {
		IconButton,
	},
	props: {
		blockId: {
			type: String,
			required: true,
		},
		textAlign: {
			type: String,
			required: true,
		},
	},
	setup(props): {...}
	{
		const { updateBlock, getBlockById } = useBlockDiagram();

		return {
			iconSet: Outline,
			FRAME_TEXT_ALIGN_OPTIONS,
			textEditorService: textEditorServices.get(props.blockId),
			updateBlock,
			getBlockById,
		};
	},
	computed: {
		isEditing(): boolean
		{
			return this.textEditorService.isEdit.value;
		},
		isTextAlignNone(): boolean
		{
			return this.textAlign === this.FRAME_TEXT_ALIGN_OPTIONS.NONE;
		},
	},
	methods: {
		onChangeEditFrameContent(): void
		{
			if (this.isEditing)
			{
				return;
			}

			if (this.isTextAlignNone)
			{
				const block = this.getBlockById(this.blockId);

				this.updateBlock({
					...block,
					node: {
						...block.node,
						frameTextAlign: FRAME_TEXT_ALIGN_OPTIONS.LEFT,
					},
				});
			}

			this.textEditorService.onEdit();
		},
	},
	template: `
		<IconButton
			:icon-name="iconSet.EDIT_L"
			:color="'var(--ui-color-palette-gray-40)'"
			:data-test-id="$testId('blockFrameEdit', blockId)"
			@click="onChangeEditFrameContent"
			@mousedown.stop
			@mouseup.stop
		/>
	`,
};
