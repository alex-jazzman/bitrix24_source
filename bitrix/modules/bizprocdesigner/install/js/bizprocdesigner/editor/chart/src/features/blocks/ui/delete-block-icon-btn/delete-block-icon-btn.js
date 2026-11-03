import { Outline } from 'ui.icon-set.api.vue';
import { useBlockDiagram } from 'ui.block-diagram';

import { IconButton } from '../../../../shared/ui';
// eslint-disable-next-line no-unused-vars
import { type BlockId } from '../../../../shared/types';
import { diagramStore as useDiagramStore } from '../../../../entities/blocks';

type DeleteBlockIconBtnSetup = {
	onDeleteBlock: () => Promise<void>;
};

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
		const diagramStore = useDiagramStore();
		const { saveDraftWithStatus } = diagramStore;

		// The button reaches further than the top menu the lock hides: the header of the settings
		// panel keeps it, and the panel opens over a version being viewed. Deletion is refused here,
		// where every button of the kind goes through, rather than by each place that shows one.
		async function onDeleteBlock(): Promise<void>
		{
			if (props.disabled || diagramStore.isWriteLocked)
			{
				return;
			}

			deleteBlockById(props.blockId);
			emit('deletedBlock', props.blockId);
			await saveDraftWithStatus();
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
