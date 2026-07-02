import { useBlockDiagram } from '../../composables';
import { getGroupBlockSlotName } from '../../utils';
import { BlocksQueueTransition } from '../blocks-queue-transition/blocks-queue-transition';
import type {
	DiagramBlockGroupNames,
	DiagramGroupedBlocks,
} from '../../types';

import './grouped-blocks.css';

type GroupedBlocksSetup = {
	visibleBlockGroupNames: DiagramBlockGroupNames;
	groupedVisibleBlocks: DiagramGroupedBlocks;
	getGroupBlockSlotName: typeof getGroupBlockSlotName;
};

// @vue/component
export const GroupedBlocks = {
	name: 'GroupedBlocks',
	components: {
		BlocksQueueTransition,
	},
	setup(): GroupedBlocksSetup
	{
		const { blockIntersections } = useBlockDiagram();

		return {
			getGroupBlockSlotName,
			visibleBlockGroupNames: blockIntersections.visibleBlockGroupNames,
			groupedVisibleBlocks: blockIntersections.groupedVisibleBlocks,
		};
	},
	template: `
		<BlocksQueueTransition>
			<slot
				v-for="group in visibleBlockGroupNames"
				:key="group"
				:name="getGroupBlockSlotName(group)"
				:blocks="groupedVisibleBlocks[group]"
			/>
		</BlocksQueueTransition>
	`,
};
