import { FolderUpdate } from './folder-update';

// @vue/component
export const FolderUpdateContent = {
	name: 'FolderUpdateContent',
	components: { FolderUpdate },
	props: {
		entityId: {
			type: String,
			required: true,
		},
	},
	template: `
		<FolderUpdate :key="entityId" :folderId="Number(entityId)" />
	`,
};
