import { Loc, Type } from 'main.core';
import 'ui.notification';
import { DocumentList } from 'note.ui.document-list';
import { SearchService } from './services/search-service';
import { syncIMEModel } from './utils/sync-ime-model';

const PAGE_SIZE = 30;
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

export const NoteSearchPageComponent = {
	name: 'NoteSearchPage',
	components: {
		DocumentList,
	},
	props: {
		query: {
			type: String,
			default: '',
		},
	},
	emits: ['open', 'update-query'],
	data()
	{
		return {
			inputQuery: this.query || '',
			items: [],
			loading: false,
			hasMore: false,
			page: 0,
			hasError: false,
			requestId: 0,
		};
	},
	computed: {
		trimmedQuery(): string
		{
			return (this.query || '').trim();
		},
		isTooShort(): boolean
		{
			return this.trimmedQuery.length > 0 && this.trimmedQuery.length < MIN_QUERY_LENGTH;
		},
		listItems(): Array
		{
			return this.items.map((item) => ({
				id: item.documentId,
				title: item.title,
				snippet: item.snippet || '',
				documentId: item.documentId,
				collectionId: item.collectionId,
				collectionTitle: item.collectionTitle || '',
				author: item.author || null,
				score: item.score,
			}));
		},
		placeholderText(): string
		{
			return Loc.getMessage('NOTE_SEARCH_PAGE_PLACEHOLDER') || '';
		},
		tooShortMessage(): string
		{
			return Loc.getMessage('NOTE_SEARCH_QUERY_TOO_SHORT') || '';
		},
	},
	watch: {
		query(value): void
		{
			this.inputQuery = value || '';
		},
		trimmedQuery(): void
		{
			this.runSearch(false);
		},
	},
	created()
	{
		this.service = new SearchService();
		this.debounceTimer = null;
		this.runSearch(false);
	},
	beforeUnmount()
	{
		clearTimeout(this.debounceTimer);
	},
	methods: {
		onInput(event): void
		{
			syncIMEModel(this, 'inputQuery', event);
			clearTimeout(this.debounceTimer);
			this.debounceTimer = setTimeout(() => {
				this.$emit('update-query', this.inputQuery.trim());
			}, DEBOUNCE_MS);
		},
		onKeydown(event): void
		{
			if (event.key === 'Enter')
			{
				clearTimeout(this.debounceTimer);
				this.$emit('update-query', this.inputQuery.trim());
			}
		},
		async runSearch(append: boolean): Promise<void>
		{
			if (!append)
			{
				this.items = [];
				this.page = 0;
				this.hasMore = false;
				this.hasError = false;
			}

			if (this.trimmedQuery.length < MIN_QUERY_LENGTH)
			{
				this.loading = false;
				return;
			}

			const nextPage = this.page + 1;
			const currentRequestId = ++this.requestId;

			this.loading = true;

			try
			{
				const response = await this.service.search(this.trimmedQuery, {
					page: nextPage,
					pageSize: PAGE_SIZE,
				});

				if (currentRequestId !== this.requestId)
				{
					return;
				}

				this.items = append ? [...this.items, ...response.items] : response.items;
				this.hasMore = response.hasMore;
				this.page = nextPage;
			}
			catch (error)
			{
				if (currentRequestId !== this.requestId)
				{
					return;
				}

				if (!append)
				{
					this.hasError = true;
				}
				this.showErrorToast(error?.message || '');
			}
			finally
			{
				if (currentRequestId === this.requestId)
				{
					this.loading = false;
				}
			}
		},
		onLoadMore(): void
		{
			if (this.loading || !this.hasMore)
			{
				return;
			}
			this.runSearch(true);
		},
		onOpen(item): void
		{
			this.$emit('open', { documentId: item.documentId });
		},
		onOpenCollection({ collectionId }): void
		{
			if (!collectionId)
			{
				return;
			}
			this.$router.push({ name: 'workspace', params: { id: collectionId } });
		},
		showErrorToast(text: string): void
		{
			const message = Type.isStringFilled(text)
				? text
				: (Loc.getMessage('NOTE_SEARCH_PAGE_ERROR_GENERIC') || '')
			;
			if (!Type.isStringFilled(message))
			{
				return;
			}

			BX.UI.Notification.Center.notify({ content: message, position: 'top-right' });
		},
	},
	// language=Vue
	template: `
		<div class="note-search-page">
			<div class="note-search-page-input-wrap">
				<input
					type="text"
					class="note-search-page-input"
					:placeholder="placeholderText"
					:value="inputQuery"
					@input="onInput"
					@compositionend="onInput"
					@change="onInput"
					@keydown="onKeydown"
					autofocus
				/>
			</div>
			<div v-if="isTooShort" class="note-search-page-hint">{{ tooShortMessage }}</div>
			<DocumentList
				v-else-if="!hasError"
				mode="search"
				:items="listItems"
				:has-more="hasMore"
				:loading="loading"
				@open="onOpen"
				@open-collection="onOpenCollection"
				@load-more="onLoadMore"
			/>
		</div>
	`,
};
