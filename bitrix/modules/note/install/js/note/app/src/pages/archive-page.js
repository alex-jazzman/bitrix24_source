import { NoteArchivePageComponent } from 'note.archive';
import { NoteAnalytics } from 'note.analytics';
import { ROUTE_NAME_DOCUMENT } from '../router/route-names';

export const ArchivePage = {
	name: 'ArchivePage',
	components: {
		NoteArchivePageComponent,
	},
	methods: {
		onOpen(payload): void
		{
			const documentId = Number(payload?.documentId);
			if (!Number.isFinite(documentId) || documentId <= 0)
			{
				return;
			}

			NoteAnalytics.documentViewed('docs_list');
			this.$router.push({
				name: ROUTE_NAME_DOCUMENT,
				params: { id: documentId },
			});
		},
	},
	template: `
		<NoteArchivePageComponent @open="onOpen" />
	`,
};
