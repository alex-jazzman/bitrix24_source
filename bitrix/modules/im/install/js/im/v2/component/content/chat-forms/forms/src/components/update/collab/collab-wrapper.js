import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CollabV2Updating } from './collab-v2';
import { CollabUpdating } from './collab';

// @vue/component
export const CollabUpdatingWrapper = {
	name: 'CollabUpdatingWrapper',
	components: { CollabV2Updating, CollabUpdating },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		isCollabV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
		}
	},
	template: `
		<CollabV2Updating v-if="isCollabV2Available" :dialogId="dialogId" />
		<CollabUpdating v-else :dialogId="dialogId" />
	`,
};
