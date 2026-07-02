import { NoteSharedPageComponent } from 'note.shared';
import { ROUTE_NAME_DOCUMENT } from '../router/route-names';

export const SharedPage = {
	name: 'SharedPage',
	components: {
		NoteSharedPageComponent,
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
	},
	template: `
		<NoteSharedPageComponent @open="onOpen" />
	`,
};
