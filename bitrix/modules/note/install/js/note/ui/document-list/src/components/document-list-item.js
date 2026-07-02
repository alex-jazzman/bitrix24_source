import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Hint } from 'ui.hint';

export const DocumentListItem = {
	name: 'NoteDocumentListItem',
	props: {
		item: { type: Object, required: true },
		mode: {
			type: String,
			default: 'cards',
			validator: (value: string): boolean =>
				value === 'cards' || value === 'compact' || value === 'detailed' || value === 'search',
		},
	},
	emits: ['open', 'open-collection'],
	computed: {
		title(): string
		{
			return String(this.item?.title ?? '');
		},
		snippetHtml(): string
		{
			return typeof this.item?.snippet === 'string' ? this.item.snippet : '';
		},
		excerpt(): string
		{
			return typeof this.item?.excerpt === 'string' ? this.item.excerpt : '';
		},
		hasExcerpt(): boolean
		{
			return this.snippetHtml !== '' || this.excerpt !== '';
		},
		showAuthor(): boolean
		{
			const author = this.item?.author;
			if (!author)
			{
				return false;
			}
			if (this.mode !== 'cards' && this.mode !== 'detailed' && this.mode !== 'search')
			{
				return false;
			}

			return author.isSystem === true || Number(author.id) > 0;
		},
		author(): ?Object
		{
			return this.showAuthor ? this.item.author : null;
		},
		isSystemAuthor(): boolean
		{
			return this.author?.isSystem === true;
		},
		showCollection(): boolean
		{
			return (this.mode === 'detailed' || this.mode === 'search')
				&& typeof this.item?.collectionTitle === 'string'
				&& this.item.collectionTitle !== '';
		},
		collectionTitle(): string
		{
			return this.showCollection ? String(this.item.collectionTitle) : '';
		},
		hasCollectionLink(): boolean
		{
			return this.showCollection && Number(this.item?.collectionId) > 0;
		},
		hasTrashedDate(): boolean
		{
			return this.mode === 'detailed' && Boolean(this.item?.trashedAt);
		},
		trashedAtLabel(): string
		{
			return this.hasTrashedDate ? this.formatRelativeDate(this.item?.trashedAt) : '';
		},
		trashedAtFullLabel(): string
		{
			return this.hasTrashedDate ? this.formatFullDate(this.item?.trashedAt) : '';
		},
		hasArchivedDate(): boolean
		{
			return this.mode === 'detailed' && Boolean(this.item?.archivedAt);
		},
		archivedAtLabel(): string
		{
			return this.hasArchivedDate ? this.formatRelativeDate(this.item?.archivedAt) : '';
		},
		archivedAtFullLabel(): string
		{
			return this.hasArchivedDate ? this.formatFullDate(this.item?.archivedAt) : '';
		},
		hasAuthor(): boolean
		{
			return this.author !== null;
		},
		hasAttribution(): boolean
		{
			return this.hasTrashedDate || this.hasArchivedDate;
		},
		hasMeta(): boolean
		{
			return this.showCollection || this.hasAuthor || this.hasAttribution;
		},
		hasContent(): boolean
		{
			return this.hasExcerpt || this.hasMeta;
		},
		rootClass(): Array<string>
		{
			return [
				'note-document-card',
				this.mode === 'compact' ? 'note-document-card--compact' : '',
				this.mode === 'detailed' ? 'note-document-card--detailed' : '',
				this.mode === 'search' ? 'note-document-card--search' : '',
			];
		},
		authorInitials(): string
		{
			if (this.isSystemAuthor)
			{
				return '';
			}

			return this.getInitials(this.author?.name);
		},
		docHref(): string
		{
			const raw = this.item?.documentId ?? this.item?.id;
			const id = Number(raw);

			return Number.isFinite(id) && id > 0 ? `/note/document/${id}/` : '';
		},
		collectionHref(): string
		{
			if (!this.hasCollectionLink)
			{
				return '';
			}
			const id = Number(this.item?.collectionId);

			return Number.isFinite(id) && id > 0 ? `/note/workspace/${id}/` : '';
		},
	},
	mounted()
	{
		this.refreshHints();
	},
	updated()
	{
		this.refreshHints();
	},
	methods: {
		onTitleClick(event: MouseEvent): void
		{
			// Let the browser handle modifier keys, middle/right click natively
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}
			event.preventDefault();
			this.$emit('open', this.item);
		},
		refreshHints(): void
		{
			if (this.$el instanceof HTMLElement)
			{
				Hint.init(this.$el);
			}
		},
		onActionsClick(event: MouseEvent): void
		{
			event?.stopPropagation?.();
		},
		onCollectionClick(event: MouseEvent): void
		{
			if (!this.hasCollectionLink)
			{
				return;
			}
			event?.stopPropagation?.();
			// Let the browser handle modifier keys, middle/right click natively
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}
			event.preventDefault();
			this.$emit('open-collection', {
				collectionId: Number(this.item?.collectionId) || 0,
				collectionTitle: this.collectionTitle,
			});
		},
		getInitials(name: ?string): string
		{
			const value = String(name ?? '').trim();
			if (value === '')
			{
				return '';
			}
			const parts = value.split(/\s+/u);
			const first = parts[0]?.charAt(0) ?? '';
			const second = parts[1]?.charAt(0) ?? '';

			return (first + second).toUpperCase();
		},
		toTimestampSec(value: ?string): ?number
		{
			if (typeof value !== 'string' || value === '')
			{
				return null;
			}
			const ms = Date.parse(value);
			if (Number.isNaN(ms))
			{
				return null;
			}

			return Math.floor(ms / 1000);
		},
		formatRelativeDate(value: ?string): string
		{
			const ts = this.toTimestampSec(value);

			return ts === null ? '' : DateTimeFormat.format('x', ts);
		},
		formatFullDate(value: ?string): string
		{
			const ts = this.toTimestampSec(value);
			if (ts === null)
			{
				return '';
			}
			const bitrixFormat = Loc.getMessage('FORMAT_DATETIME') || 'DD.MM.YYYY HH:MI:SS';
			const phpFormat = DateTimeFormat.convertBitrixFormat(bitrixFormat);

			return DateTimeFormat.format(phpFormat, ts);
		},
	},
	// language=Vue
	template: `
		<div :class="rootClass">
			<div class="note-document-card__header">
				<div class="note-document-card__title-cluster">
					<a
						v-if="docHref"
						class="note-document-card__title note-document-card__title-link"
						:href="docHref"
						@click="onTitleClick"
					>{{ title }}</a>
					<span v-else class="note-document-card__title">{{ title }}</span>
				</div>
				<div
					v-if="$slots.actions"
					class="note-document-card__header-action"
					@click="onActionsClick"
				>
					<slot name="actions" :item="item" />
				</div>
			</div>
			<div v-if="hasContent" class="note-document-card__content">
				<div v-if="showCollection" class="note-document-card__collection">
					<a
						v-if="hasCollectionLink"
						:href="collectionHref"
						class="note-document-card__collection-link"
						@click="onCollectionClick"
					>
						<span class="note-document-card__collection-icon" aria-hidden="true"></span>
						<span class="note-document-card__collection-name">{{ collectionTitle }}</span>
					</a>
					<span v-else class="note-document-card__collection-link">
						<span class="note-document-card__collection-icon" aria-hidden="true"></span>
						<span class="note-document-card__collection-name">{{ collectionTitle }}</span>
					</span>
				</div>
				<p
					v-if="snippetHtml"
					class="note-document-card__excerpt"
					v-html="snippetHtml"
				></p>
				<p
					v-else-if="excerpt"
					class="note-document-card__excerpt"
				>{{ excerpt }}</p>
				<div v-if="hasAuthor || hasAttribution" class="note-document-card__footer">
					<div v-if="author" class="note-document-card__author">
						<span
							class="note-document-card__avatar"
							:class="{ 'note-document-card__avatar--system': isSystemAuthor }"
						>
							<img
								v-if="author.photoUrl"
								class="note-document-card__avatar-img"
								:src="author.photoUrl"
								:alt="author.name"
							/>
							<span v-else class="note-document-card__avatar-initials">{{ authorInitials }}</span>
						</span>
						<span class="note-document-card__author-name">{{ author.name }}</span>
					</div>
					<span v-else class="note-document-card__footer-spacer" aria-hidden="true"></span>
					<div
						v-if="hasTrashedDate"
						class="note-document-card__attribution note-document-card__attribution--trashed"
					>
						<span
							class="note-document-card__attribution-date"
							:data-hint="trashedAtFullLabel"
							data-hint-no-icon
							data-hint-interactivity
							data-hint-center
						>{{ trashedAtLabel }}</span>
					</div>
					<div
						v-else-if="hasArchivedDate"
						class="note-document-card__attribution note-document-card__attribution--archived"
					>
						<span
							class="note-document-card__attribution-date"
							:data-hint="archivedAtFullLabel"
							data-hint-no-icon
							data-hint-interactivity
							data-hint-center
						>{{ archivedAtLabel }}</span>
					</div>
				</div>
			</div>
		</div>
	`,
};
