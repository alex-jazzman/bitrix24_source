import { Loc, Type } from 'main.core';
import 'ui.notification';
import { DocumentList } from 'note.ui.document-list';
import { SharedService } from './services/shared-service';

const PAGE_SIZE = 50;

export const NoteSharedPageComponent = {
	name: 'NoteSharedPage',
	components: {
		DocumentList,
	},
	emits: ['open'],
	data()
	{
		return {
			items: [],
			loading: false,
			hasMore: false,
			hasError: false,
			nextCursor: null,
			requestId: 0,
		};
	},
	computed: {
		listItems(): Array
		{
			return this.items.map((item) => ({
				id: item.id,
				title: item.title,
				snippet: '',
				excerpt: item.excerpt || '',
				author: item.author || null,
				documentId: item.id,
			}));
		},
		titleText(): string
		{
			return Loc.getMessage('NOTE_SHARED_PAGE_TITLE') || '';
		},
		breadcrumbRoot(): string
		{
			return Loc.getMessage('NOTE_SHARED_BREADCRUMB_ROOT') || '';
		},
		subtitleText(): string
		{
			return Loc.getMessage('NOTE_SHARED_PAGE_SUBTITLE') || '';
		},
		emptyHint(): string
		{
			return Loc.getMessage('NOTE_SHARED_PAGE_EMPTY_HINT') || '';
		},
	},
	created()
	{
		this.service = new SharedService();
		void this.loadPage(false);
	},
	methods: {
		goRoot(): void
		{
			this.$router.push({ name: 'shared' });
		},
		async loadPage(append: boolean): Promise<void>
		{
			if (!append)
			{
				this.items = [];
				this.nextCursor = null;
				this.hasMore = false;
				this.hasError = false;
			}

			const currentRequestId = ++this.requestId;
			this.loading = true;

			try
			{
				const response = await this.service.list({
					limit: PAGE_SIZE,
					afterCursor: append ? this.nextCursor : null,
				});

				if (currentRequestId !== this.requestId)
				{
					return;
				}

				this.items = append ? [...this.items, ...response.items] : response.items;
				this.nextCursor = response.nextCursor;
				this.hasMore = Boolean(response.nextCursor);
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

			void this.loadPage(true);
		},
		onOpen(item): void
		{
			this.$emit('open', { documentId: item.documentId });
		},
		showErrorToast(text: string): void
		{
			const message = Type.isStringFilled(text)
				? text
				: (Loc.getMessage('NOTE_SHARED_PAGE_ERROR_GENERIC') || '')
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
		<div class="note-shared-page">
			<teleport to="#note-page-header-slot">
				<div class="note-page-breadcrumb">
					<button
						type="button"
						class="note-page-breadcrumb-link"
						@click="goRoot"
					>{{ breadcrumbRoot }}</button>
				</div>
			</teleport>
			<header class="note-shared-page-header">
				<div class="note-shared-page-heading">
					<h2 class="note-shared-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-shared-page-subtitle">{{ subtitleText }}</p>
				</div>
			</header>
			<DocumentList
				v-if="!hasError && (loading || items.length > 0)"
				:items="listItems"
				:has-more="hasMore"
				:loading="loading"
				@open="onOpen"
				@load-more="onLoadMore"
			/>
			<div
				v-else-if="!hasError"
				class="note-shared-page-empty-hint"
			>
				{{ emptyHint }}
			</div>
		</div>
	`,
};
