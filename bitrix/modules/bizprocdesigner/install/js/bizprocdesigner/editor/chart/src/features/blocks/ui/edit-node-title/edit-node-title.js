import { Loc } from 'main.core';
import { mapActions } from 'ui.vue3.pinia';
import { useHistory } from 'ui.block-diagram';
import {
	NodeTitle,
	diagramStore as useDiagramStore,
	nodeTitleEditServices,
} from '../../../../entities/blocks';

import type { NodeTitleEditService } from '../../../../entities/blocks';
import type { Block } from '../../../../shared/types';

type EditNodeTitleProps = {
	block: Block,
};

type EditNodeTitleSetup = {
	makeSnapshot: () => void,
	nodeTitleEditService: NodeTitleEditService,
};

// @vue/component
export const EditNodeTitle = {
	name: 'EditNodeTitle',
	components: {
		NodeTitle,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props: EditNodeTitleProps): EditNodeTitleSetup
	{
		const { makeSnapshot } = useHistory();

		return {
			makeSnapshot,
			nodeTitleEditService: nodeTitleEditServices.get(props.block.id),
		};
	},
	computed: {
		// not getBlockUserTitle: a frame title stays visible even when it equals the node type name
		title(): string
		{
			return this.block.activity?.Properties?.Title ?? '';
		},
		description(): string
		{
			return this.block.activity?.Properties?.EditorComment ?? '';
		},
		isEditing(): boolean
		{
			return this.nodeTitleEditService.isEdit.value;
		},
		nodeTypeTitle(): string
		{
			return this.block.node?.title ?? '';
		},
		titleAriaLabel(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_TITLE_ARIA_LABEL');
		},
	},
	beforeUnmount(): void
	{
		nodeTitleEditServices.delete(this.block.id);
	},
	methods: {
		...mapActions(useDiagramStore, [
			'updateBlockActivityField',
			'beginSaveRun',
			'publicDraft',
			'updateStatus',
		]),
		async onConfirm(title: string): Promise<void>
		{
			// a node cannot stay unnamed: an empty title falls back to the node type name
			const newTitle = title === '' ? this.nodeTypeTitle : title;
			if (newTitle === this.title)
			{
				this.nodeTitleEditService.confirm();

				return;
			}

			this.updateBlockActivityField(this.block.id, {
				...this.block.activity,
				Properties: {
					...this.block.activity?.Properties,
					Title: newTitle,
				},
			});
			this.nodeTitleEditService.confirm();
			this.makeSnapshot();

			// Reserved before the request: a save started after this one owns the status, so a
			// late answer here must not overwrite it. The draft also comes back unsaved without
			// an exception — a deleted template, a lost write access — and such an answer must
			// not leave "Saved" on the screen.
			const runId = this.beginSaveRun();
			try
			{
				this.updateStatus(await this.publicDraft(), runId);
			}
			catch
			{
				this.updateStatus(false, runId);
			}
		},
	},
	template: `
		<NodeTitle
			:blockId="block.id"
			:title="title"
			:description="description"
			:editing="isEditing"
			:ariaLabel="titleAriaLabel"
			@editRequest="nodeTitleEditService.startEdit()"
			@confirm="onConfirm"
			@cancel="nodeTitleEditService.cancel()"
		/>
	`,
};
