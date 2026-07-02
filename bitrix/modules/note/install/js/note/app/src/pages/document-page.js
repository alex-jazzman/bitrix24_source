import { Loc } from 'main.core';
import 'ui.notification';
import { NoteDocumentPageComponent } from 'note.editor';
import { ROUTE_NAME_HOME } from '../router/route-names';

export const DocumentPage = {
	name: 'DocumentPage',
	components: {
		NoteDocumentPageComponent,
	},
	inject: {
		noteRouteDocumentContext: {
			default: null,
		},
		noteDocumentActions: {
			default: null,
		},
	},
	props: {
		documentId: {
			type: Number,
			required: true,
		},
	},
	computed: {
		routeDocumentContext(): Object
		{
			return this.noteRouteDocumentContext ?? {
				status: 'idle',
				docId: 0,
				document: null,
				ancestors: [],
				errorMessage: '',
			};
		},
		children(): Array
		{
			return this.routeDocumentContext?.children ?? [];
		},
		childrenLoading(): boolean
		{
			return Boolean(this.routeDocumentContext?.childrenLoading);
		},
		childrenHasMore(): boolean
		{
			return Boolean(this.routeDocumentContext?.childrenHasMore);
		},
		loadMoreChildren(): Function
		{
			return this.routeDocumentContext?.loadMoreChildren ?? (() => {});
		},
		documentActions(): Object
		{
			return this.noteDocumentActions ?? {};
		},
	},
	watch: {
		'routeDocumentContext.status': {
			immediate: true,
			handler(status: string): void
			{
				if (status === 'not_found' || status === 'error')
				{
					this.onUnavailable();
				}
			},
		},
	},
	methods: {
		onUnavailable(): void
		{
			// Unified handler for inaccessible/missing documents: single toast + redirect home.
			// Sidebar route-sync stays silent; editor feature also stops surfacing local toasts for these statuses.
			const message = Loc.getMessage('NOTE_SIDEBAR_ERROR_DOCUMENT_NOT_FOUND') || '';
			if (message !== '')
			{
				BX.UI.Notification.Center.notify({ content: message, position: 'top-right' });
			}
			this.$router.replace({ name: ROUTE_NAME_HOME });
		},
	},
	template: `
		<NoteDocumentPageComponent
			:document-id="documentId"
			:route-document-context="routeDocumentContext"
			:children="children"
			:children-loading="childrenLoading"
			:children-has-more="childrenHasMore"
			:load-more-children="loadMoreChildren"
			:document-actions="documentActions"
		/>
	`,
};
