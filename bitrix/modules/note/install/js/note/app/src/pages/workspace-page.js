import { Loc } from 'main.core';
import 'ui.notification';
import { NoteWorkspacePageComponent } from 'note.workspace';
import { ROUTE_NAME_DOCUMENT, ROUTE_NAME_HOME } from '../router/route-names';

export const WorkspacePage = {
	name: 'WorkspacePage',
	components: {
		NoteWorkspacePageComponent,
	},
	props: {
		collectionId: { type: Number, required: true },
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
		onArchived(): void
		{
			this.$router.replace({ name: ROUTE_NAME_HOME });
		},
		onDeleted(): void
		{
			this.$router.replace({ name: ROUTE_NAME_HOME });
		},
		onNotFound(): void
		{
			const message = Loc.getMessage('NOTE_WORKSPACE_NOT_FOUND') || '';
			if (message !== '')
			{
				BX.UI.Notification.Center.notify({
					content: message,
					position: 'top-right',
				});
			}

			this.$router.replace({ name: ROUTE_NAME_HOME });
		},
	},
	template: `
		<NoteWorkspacePageComponent
			:collection-id="collectionId"
			@open="onOpen"
			@archived="onArchived"
			@deleted="onDeleted"
			@not-found="onNotFound"
		/>
	`,
};
