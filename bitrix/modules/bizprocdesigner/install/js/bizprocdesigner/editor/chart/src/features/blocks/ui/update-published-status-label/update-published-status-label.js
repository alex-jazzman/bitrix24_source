import { computed } from 'ui.vue3';
import { Type } from 'main.core';
import type { Block } from '../../../../shared/types';
import {
	BlockStatusNotPublished,
	BlockStatusPublishError,
	diagramStore as useDiagramStore,
} from '../../../../entities/blocks';

// @vue/component
export const UpdatePublishedStatusLabel = {
	name: 'UpdatePublishedStatusLabel',
	components: {
		BlockStatusNotPublished,
		BlockStatusPublishError,
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

		const hasPublishError = computed((): boolean => {
			return Type.isObject(diagramStore.blockCurrentPublishErrors[props.block.id]);
		});

		return {
			isPublished,
			hasPublishError,
		};
	},
	template: `
		<BlockStatusPublishError v-if="hasPublishError"/>
		<BlockStatusNotPublished v-else-if="!isPublished"/>
	`,
};
