/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, main_polyfill_intersectionobserver, main_core, note_ui_loader, main_date, ui_hint) {
	'use strict';

	const DocumentListItem = {
		name: 'NoteDocumentListItem',
		props: {
			item: {
				type: Object,
				required: true
			},
			mode: {
				type: String,
				default: 'cards',
				validator: value => value === 'cards' || value === 'compact' || value === 'detailed' || value === 'search'
			}
		},
		emits: ['open', 'open-collection'],
		computed: {
			title() {
				return String(this.item?.title ?? '');
			},
			snippetHtml() {
				return typeof this.item?.snippet === 'string' ? this.item.snippet : '';
			},
			excerpt() {
				return typeof this.item?.excerpt === 'string' ? this.item.excerpt : '';
			},
			hasExcerpt() {
				return this.snippetHtml !== '' || this.excerpt !== '';
			},
			showAuthor() {
				const author = this.item?.author;
				if (!author) {
					return false;
				}
				if (this.mode !== 'cards' && this.mode !== 'detailed' && this.mode !== 'search') {
					return false;
				}
				return author.isSystem === true || Number(author.id) > 0;
			},
			author() {
				return this.showAuthor ? this.item.author : null;
			},
			isSystemAuthor() {
				return this.author?.isSystem === true;
			},
			showCollection() {
				return (this.mode === 'detailed' || this.mode === 'search') && typeof this.item?.collectionTitle === 'string' && this.item.collectionTitle !== '';
			},
			collectionTitle() {
				return this.showCollection ? String(this.item.collectionTitle) : '';
			},
			hasCollectionLink() {
				return this.showCollection && Number(this.item?.collectionId) > 0;
			},
			hasTrashedDate() {
				return this.mode === 'detailed' && Boolean(this.item?.trashedAt);
			},
			trashedAtLabel() {
				return this.hasTrashedDate ? this.formatRelativeDate(this.item?.trashedAt) : '';
			},
			trashedAtFullLabel() {
				return this.hasTrashedDate ? this.formatFullDate(this.item?.trashedAt) : '';
			},
			hasArchivedDate() {
				return this.mode === 'detailed' && Boolean(this.item?.archivedAt);
			},
			archivedAtLabel() {
				return this.hasArchivedDate ? this.formatRelativeDate(this.item?.archivedAt) : '';
			},
			archivedAtFullLabel() {
				return this.hasArchivedDate ? this.formatFullDate(this.item?.archivedAt) : '';
			},
			hasAuthor() {
				return this.author !== null;
			},
			hasAttribution() {
				return this.hasTrashedDate || this.hasArchivedDate;
			},
			hasMeta() {
				return this.showCollection || this.hasAuthor || this.hasAttribution;
			},
			hasContent() {
				return this.hasExcerpt || this.hasMeta;
			},
			rootClass() {
				return ['note-document-card', this.mode === 'compact' ? 'note-document-card--compact' : '', this.mode === 'detailed' ? 'note-document-card--detailed' : '', this.mode === 'search' ? 'note-document-card--search' : ''];
			},
			authorInitials() {
				if (this.isSystemAuthor) {
					return '';
				}
				return this.getInitials(this.author?.name);
			},
			docHref() {
				const raw = this.item?.documentId ?? this.item?.id;
				const id = Number(raw);
				return Number.isFinite(id) && id > 0 ? `/note/document/${id}/` : '';
			},
			collectionHref() {
				if (!this.hasCollectionLink) {
					return '';
				}
				const id = Number(this.item?.collectionId);
				return Number.isFinite(id) && id > 0 ? `/note/workspace/${id}/` : '';
			}
		},
		mounted() {
			this.refreshHints();
		},
		updated() {
			this.refreshHints();
		},
		methods: {
			onTitleClick(event) {
				// Let the browser handle modifier keys, middle/right click natively
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.$emit('open', this.item);
			},
			refreshHints() {
				if (this.$el instanceof HTMLElement) {
					ui_hint.Hint.init(this.$el);
				}
			},
			onActionsClick(event) {
				event?.stopPropagation?.();
			},
			onCollectionClick(event) {
				if (!this.hasCollectionLink) {
					return;
				}
				event?.stopPropagation?.();
				// Let the browser handle modifier keys, middle/right click natively
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.$emit('open-collection', {
					collectionId: Number(this.item?.collectionId) || 0,
					collectionTitle: this.collectionTitle
				});
			},
			getInitials(name) {
				const value = String(name ?? '').trim();
				if (value === '') {
					return '';
				}
				const parts = value.split(/\s+/u);
				const first = parts[0]?.charAt(0) ?? '';
				const second = parts[1]?.charAt(0) ?? '';
				return (first + second).toUpperCase();
			},
			toTimestampSec(value) {
				if (typeof value !== 'string' || value === '') {
					return null;
				}
				const ms = Date.parse(value);
				if (Number.isNaN(ms)) {
					return null;
				}
				return Math.floor(ms / 1000);
			},
			formatRelativeDate(value) {
				const ts = this.toTimestampSec(value);
				return ts === null ? '' : main_date.DateTimeFormat.format('x', ts);
			},
			formatFullDate(value) {
				const ts = this.toTimestampSec(value);
				if (ts === null) {
					return '';
				}
				const bitrixFormat = main_core.Loc.getMessage('FORMAT_DATETIME') || 'DD.MM.YYYY HH:MI:SS';
				const phpFormat = main_date.DateTimeFormat.convertBitrixFormat(bitrixFormat);
				return main_date.DateTimeFormat.format(phpFormat, ts);
			}
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
	`
	};

	const DocumentList = {
		name: 'NoteDocumentList',
		components: {
			DocumentListItem,
			Loader: note_ui_loader.Loader
		},
		props: {
			items: {
				type: Array,
				default: () => []
			},
			hasMore: {
				type: Boolean,
				default: false
			},
			loading: {
				type: Boolean,
				default: false
			},
			mode: {
				type: String,
				default: 'cards',
				validator: value => value === 'cards' || value === 'compact' || value === 'detailed' || value === 'search'
			}
		},
		emits: ['open', 'open-collection', 'load-more'],
		computed: {
			isEmpty() {
				return !this.loading && this.items.length === 0;
			},
			emptyMessage() {
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_EMPTY') || '';
			},
			rootClass() {
				return ['note-document-cards', this.mode === 'compact' ? 'note-document-cards--compact' : ''];
			}
		},
		mounted() {
			this.observer = null;
			this.setupObserver();
		},
		updated() {
			this.setupObserver();
		},
		beforeUnmount() {
			this.destroyObserver();
		},
		methods: {
			onOpen(item) {
				this.$emit('open', item);
			},
			onOpenCollection(payload) {
				this.$emit('open-collection', payload);
			},
			setupObserver() {
				this.destroyObserver();
				const sentinel = this.$refs.sentinel;
				if (!(sentinel instanceof HTMLElement)) {
					return;
				}
				this.observer = new IntersectionObserver(entries => {
					const entry = entries[0];
					if (entry?.isIntersecting && this.hasMore && !this.loading) {
						this.$emit('load-more');
					}
				}, {
					rootMargin: '100px'
				});
				this.observer.observe(sentinel);
			},
			destroyObserver() {
				if (this.observer) {
					this.observer.disconnect();
					this.observer = null;
				}
			}
		},
		// language=Vue
		template: `
		<div :class="rootClass">
			<div v-if="loading && items.length === 0" class="note-document-cards__loader">
				<Loader />
			</div>
			<div v-else-if="isEmpty" class="note-document-cards__empty">{{ emptyMessage }}</div>
			<template v-else>
				<div class="note-document-cards__grid">
					<DocumentListItem
						v-for="item in items"
						:key="item.id"
						:item="item"
						:mode="mode"
						@open="onOpen"
						@open-collection="onOpenCollection"
					>
						<template v-if="$slots.actions" #actions="slotProps">
							<slot name="actions" :item="slotProps.item" />
						</template>
					</DocumentListItem>
				</div>
				<div v-if="hasMore" ref="sentinel" class="note-document-cards__sentinel">
					<div v-if="loading" class="note-document-cards__loader">
						<Loader />
					</div>
				</div>
			</template>
		</div>
	`
	};

	exports.DocumentList = DocumentList;
	exports.DocumentListItem = DocumentListItem;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX, BX, BX.Note.Ui, BX.Main, BX.UI);
//# sourceMappingURL=document-list.bundle.js.map
