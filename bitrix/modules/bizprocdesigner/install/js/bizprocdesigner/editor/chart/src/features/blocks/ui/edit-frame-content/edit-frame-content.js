import { useBlockDiagram } from 'ui.block-diagram';
import {
	TextEditor,
	textEditorServices,
} from '../../../../shared/ui';
import {
	ContentSeparator,
	FRAME_TEXT_ALIGN_OPTIONS,
} from '../../../../entities/blocks';

//@vue/component
export const EditFrameContent = {
	name: 'EditFrameContent',
	components: {
		TextEditor,
		ContentSeparator,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		width: {
			type: Number,
			default: 0,
		},
		height: {
			type: Number,
			default: 0,
		},
		readonly: {
			type: Boolean,
			default: true,
		},
		resizing: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): Object
	{
		const { updateBlock, zoom } = useBlockDiagram();

		return {
			zoom,
			textEditorService: textEditorServices.get(props.block.id),
			updateBlock,
		};
	},
	computed: {
		isEditing(): boolean
		{
			return this.textEditorService.isEdit.value;
		},
		frameTextAlign(): string
		{
			return this.block?.node?.frameTextAlign ?? FRAME_TEXT_ALIGN_OPTIONS.NONE;
		},
		frameContent: {
			get(): stirng
			{
				return this.block.node.frameContent;
			},
			set(frameContent: string): void
			{
				this.updateBlock({
					...this.block,
					node: {
						...this.block.node,
						frameContent,
					},
				});
			},
		},
		frameContentFiles: {
			get(): Array<Object>
			{
				return this.block.node.frameContentFiles;
			},
			set(frameContentFiles): void
			{
				this.updateBlock({
					...this.block,
					node: {
						...this.block.node,
						frameContentFiles,
					},
				});
			},
		},
		frameSeparatorPosition: {
			get(): number
			{
				return this.block.node.frameSeparatorPosition;
			},
			set(frameSeparatorPosition: number): void
			{
				this.updateBlock({
					...this.block,
					node: {
						...this.block.node,
						frameSeparatorPosition,
					},
				});
			},
		},
	},
	template: `
		<ContentSeparator
			v-model:separatorPosition="frameSeparatorPosition"
			:blockId="block.id"
			:contentPosition="frameTextAlign"
			:width="width"
			:height="height"
			:zoom="zoom"
			:contentScrollable="isEditing"
			:resizing="resizing"
		>
			<template #content="{ height }">
				<!--<EditFrameContent
					:block="block"
					:height="height"
				/>-->

				<TextEditor
					v-model:text="frameContent"
					v-model:files="frameContentFiles"
					:id="block.id"
				/>
			</template>
		</ContentSeparator>
	`,
};
