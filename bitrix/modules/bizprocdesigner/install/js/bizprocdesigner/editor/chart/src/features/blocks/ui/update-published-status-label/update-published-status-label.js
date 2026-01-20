import { computed } from 'ui.vue3';
import type { Block } from '../../../../shared/types';
import {
	BlockStatusNotPublished,
	diagramStore as useDiagramStore,
} from '../../../../entities/blocks';

// @vue/component
export const UpdatePublishedStatusLabel = {
	name: 'UpdatePublishedStatusLabel',
	components: {
		BlockStatusNotPublished,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props): {...}
	{
		const diagramStore = useDiagramStore();

		const isPublished = computed((): boolean => {
			const updated = diagramStore.blockCurrentTimestamps[props.block.id];
			const published = diagramStore.blockSavedTimestamps[props.block.id];

			return updated === published;
		});

		return {
			isPublished,
		};
	},
	template: `
		<BlockStatusNotPublished v-if="!isPublished"/>
	`,
};
