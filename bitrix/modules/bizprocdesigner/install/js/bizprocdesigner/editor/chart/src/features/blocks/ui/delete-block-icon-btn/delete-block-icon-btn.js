import { Outline } from 'ui.icon-set.api.vue';
import { useBlockDiagram } from 'ui.block-diagram';

import { IconButton } from '../../../../shared/ui';
// eslint-disable-next-line no-unused-vars
import { type BlockId } from '../../../../shared/types';
import { diagramStore as useDiagramStore } from '../../../../entities/blocks';

type DeleteBlockIconBtnSetup = {
	onDeleteBlock: () => Promise<void>;
};

type BeginSaveRun = () => number;
type PublicDraft = () => Promise<boolean>;
type UpdateStatus = (isSaved: boolean, runId: number) => void;

async function tryPublicDraft(
	beginSaveRun: BeginSaveRun,
	publicDraft: PublicDraft,
	updateStatus: UpdateStatus,
): Promise<void>
{
	// Reserved before the request: a save started after this one owns the status, so a late
	// answer here must not overwrite it.
	const runId = beginSaveRun();
	try
	{
		const isSaved = await publicDraft();
		updateStatus(isSaved, runId);
	}
	catch
	{
		updateStatus(false, runId);
	}
}

// @vue/component
export const DeleteBlockIconBtn = {
	name: 'DeleteBlockIconBtn',
	components: {
		IconButton,
	},
	props: {
		/** @type BlockId */
		blockId: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		size: {
			type: Number,
			default: 18,
		},
	},
	emits: ['deletedBlock'],
	setup(props, { emit }): DeleteBlockIconBtnSetup
	{
		const { deleteBlockById } = useBlockDiagram();
		const { beginSaveRun, publicDraft, updateStatus } = useDiagramStore();

		async function onDeleteBlock(): Promise<void>
		{
			if (props.disabled)
			{
				return;
			}

			deleteBlockById(props.blockId);
			emit('deletedBlock', props.blockId);
			await tryPublicDraft(beginSaveRun, publicDraft, updateStatus);
		}

		return {
			iconSet: Outline,
			onDeleteBlock,
		};
	},
	template: `
		<IconButton
			:icon-name="iconSet.TRASHCAN"
			:size="size"
			:color="'var(--ui-color-palette-gray-40)'"
			:data-test-id="$testId('blockDelete', blockId)"
			@mousedown.stop
			@mouseup.stop
			@click="onDeleteBlock"
		/>
	`,
};
