import 'ui.notification';
import { NoteDocumentPageComponent } from 'note.editor';
import { ROUTE_NAME_HOME } from '../router/route-names';
import { showDocumentUnavailableNotification } from '../app/document-unavailable-notification.ts';

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
			showDocumentUnavailableNotification();
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
