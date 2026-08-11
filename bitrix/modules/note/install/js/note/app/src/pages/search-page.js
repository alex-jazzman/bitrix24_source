import { NoteSearchPageComponent } from 'note.search';
import { NoteAnalytics } from 'note.analytics';
import { ROUTE_NAME_DOCUMENT, ROUTE_NAME_SEARCH } from '../router/route-names';

export const SearchPage = {
	name: 'SearchPage',
	components: {
		NoteSearchPageComponent,
	},
	props: {
		query: {
			type: String,
			default: '',
		},
	},
	methods: {
		onOpen(payload): void
		{
			const documentId = Number(payload?.documentId);
			if (!Number.isFinite(documentId) || documentId <= 0)
			{
				return;
			}

			// Opening a document from the full search-results page.
			NoteAnalytics.documentViewed('search_page');
			this.$router.push({
				name: ROUTE_NAME_DOCUMENT,
				params: { id: documentId },
			});
		},
		onUpdateQuery(query: string): void
		{
			this.$router.replace({
				name: ROUTE_NAME_SEARCH,
				query: { q: query || undefined },
			});
		},
	},
	template: `
		<NoteSearchPageComponent
			:query="query"
			@open="onOpen"
			@update-query="onUpdateQuery"
		/>
	`,
};
