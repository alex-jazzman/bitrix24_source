import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CollabV2Creation } from './collab-v2';
import { CollabCreation } from './collab';

// @vue/component
export const CollabCreationWrapper = {
	name: 'CollabCreationWrapper',
	components: { CollabV2Creation, CollabCreation },
	computed: {
		isCollabV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
		}
	},
	template: `
		<CollabV2Creation v-if="isCollabV2Available" />
		<CollabCreation v-else />
	`,
};
