import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CollabEmptyState } from './collab.js';
import { CollabV2EmptyState } from './collab-v2.js';

// @vue/component
export const CollabEmptyStateWrapper = {
	name: 'CollabEmptyStateWrapper',
	components: { CollabEmptyState, CollabV2EmptyState },
	computed: {
		isCollabV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
		},
	},
	template: `
		<CollabV2EmptyState v-if="isCollabV2Available" />
		<CollabEmptyState v-else />
	`,
};
