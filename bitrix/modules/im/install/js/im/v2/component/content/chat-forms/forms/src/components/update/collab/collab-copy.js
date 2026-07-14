import { CollabV2Updating } from './collab-v2';

// @vue/component
export const CollabV2CopyContent = {
	name: 'CollabV2CopyContent',
	components: { CollabV2Updating },
	props: {
		entityId: {
			type: String,
			required: true,
		},
	},
	template: `
		<CollabV2Updating :dialogId="entityId" :copyMode="true" />
	`,
};
