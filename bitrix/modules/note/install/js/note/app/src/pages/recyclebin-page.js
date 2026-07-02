import { NoteRecycleBinPageComponent } from 'note.recyclebin';
import { ROUTE_NAME_DOCUMENT } from '../router/route-names';

export const RecycleBinPage = {
	name: 'RecycleBinPage',
	components: {
		NoteRecycleBinPageComponent,
	},
	methods: {
		onOpen(payload): void
		{
			const documentId = Number(payload?.documentId);
			if (!Number.isFinite(documentId) || documentId <= 0)
			{
				return;
			}

			this.$router.push({
				name: ROUTE_NAME_DOCUMENT,
				params: { id: documentId },
			});
		},
		onRestoreOrphan(payload): void
		{
			// Wired in Phase 15 (orphan-restore popup).
			void payload;
		},
	},
	template: `
		<NoteRecycleBinPageComponent
			@open="onOpen"
			@restore-orphan="onRestoreOrphan"
		/>
	`,
};
