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
	// The copy form owns no markup of its own: the settings of the copy belong to the project wizard.
	// The identifier falls through to the single root node of the child, the container of that wizard.
	template: `
		<CollabV2Updating
			:dialogId="entityId"
			:copyMode="true"
			data-testid="im-chat-form-copy-collab"
		/>
	`,
};
