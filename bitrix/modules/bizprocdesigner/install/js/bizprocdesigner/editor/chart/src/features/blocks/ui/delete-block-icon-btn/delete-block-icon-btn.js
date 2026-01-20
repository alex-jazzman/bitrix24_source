import { Outline } from 'ui.icon-set.api.vue';
import { useHistory } from 'ui.block-diagram';
import { IconButton } from '../../../../shared/ui';
// eslint-disable-next-line no-unused-vars
import type { BlockId } from '../../../../shared/types';
import { diagramStore as useDiagramStore } from '../../../../entities/blocks';

type DeleteBlockIconBtnSetup = {
	onDeleteBlock: () => void;
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
	},
	emits: ['deletedBlock'],
	setup(props, { emit }): DeleteBlockIconBtnSetup
	{
		const history = useHistory();
		const { deleteBlockById, publicDraft, updateStatus } = useDiagramStore();

		function tryPublicDraft(): void
		{
			try
			{
				publicDraft();
				updateStatus(true);
			}
			catch
			{
				updateStatus(false);
			}
		}

		function onDeleteBlock(): void
		{
			if (props.disabled)
			{
				return;
			}

			deleteBlockById(props.blockId);
			history.makeSnapshot();
			emit('deletedBlock', props.blockId);
			tryPublicDraft();
		}

		return {
			iconSet: Outline,
			onDeleteBlock,
		};
	},
	template: `
		<IconButton
			:icon-name="iconSet.TRASHCAN"
			:color="'var(--ui-color-palette-gray-40)'"
			:data-test-id="$testId('blockDelete', blockId)"
			@click="onDeleteBlock"
		/>
	`,
};
