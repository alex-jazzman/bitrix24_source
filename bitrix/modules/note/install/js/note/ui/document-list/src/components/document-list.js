import { Loc } from 'main.core';
import { Loader } from 'note.ui.loader';
import { DocumentListItem } from './document-list-item';

export const DocumentList = {
	name: 'NoteDocumentList',
	components: {
		DocumentListItem,
		Loader,
	},
	props: {
		items: {
			type: Array,
			default: () => [],
		},
		hasMore: {
			type: Boolean,
			default: false,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		mode: {
			type: String,
			default: 'cards',
			validator: (value: string): boolean =>
				value === 'cards' || value === 'compact' || value === 'detailed' || value === 'search',
		},
		selectionEnabled: {
			type: Boolean,
			default: false,
		},
		// List supports multi-select: enables the desktop hover checkbox on each card.
		selectable: {
			type: Boolean,
			default: false,
		},
		isMobile: {
			type: Boolean,
			default: false,
		},
		selectedIds: {
			type: [Set, Array],
			default: () => [],
		},
		// The last "load more" came back with a failure. Automatic paging stops until the user asks
		// again: the sentinel of a list that did not grow stays in view, and every re-render builds a
		// new IntersectionObserver whose starting callback reports it as intersecting - left alone
		// that walks the host into the same failing request over and over. Announcing the failure is
		// the host's job (its live region outlives the list), so the block below keeps aria-live off.
		loadMoreFailed: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['open', 'open-collection', 'load-more', 'retry-load-more', 'select'],
	computed: {
		selectedSet(): Set
		{
			return this.selectedIds instanceof Set ? this.selectedIds : new Set(this.selectedIds);
		},
		isEmpty(): boolean
		{
			return !this.loading && this.items.length === 0;
		},
		emptyMessage(): string
		{
			return Loc.getMessage('NOTE_DOCUMENT_LIST_EMPTY') || '';
		},
		loadMoreErrorMessage(): string
		{
			return Loc.getMessage('NOTE_DOCUMENT_LIST_LOAD_MORE_ERROR') || '';
		},
		loadMoreRetryLabel(): string
		{
			return Loc.getMessage('NOTE_DOCUMENT_LIST_LOAD_MORE_RETRY') || '';
		},
		rootClass(): Array<string>
		{
			return [
				'note-document-cards',
				this.mode === 'compact' ? 'note-document-cards--compact' : '',
				// Reserve room at the bottom while the floating bulk-actions pill is up (shown once
				// something is selected), so the last card can scroll clear of it and stay reachable.
				this.selectedSet.size > 0 ? 'note-document-cards--bulk-active' : '',
			];
		},
	},
	mounted()
	{
		this.observer = null;
		this.setupObserver();
	},
	updated()
	{
		this.setupObserver();
	},
	beforeUnmount()
	{
		this.destroyObserver();
	},
	methods: {
		onOpen(item): void
		{
			this.$emit('open', item);
		},
		onOpenCollection(payload): void
		{
			this.$emit('open-collection', payload);
		},
		onSelect(payload): void
		{
			this.$emit('select', payload);
		},
		// A deliberate request for the page that failed. It travels as its own event so the host can
		// keep refusing the automatic one while still serving this one.
		// The button sits in the branch that the paging loader takes over as soon as the host starts
		// the request, so the focus has to leave it first or it ends up in <body> (WCAG 2.4.3). It
		// goes to the last card. The list root and the grid survive the swap just as well, but the
		// root sends the next Tab back to the top of the list and drags the viewport there, while
		// the card keeps the user where they were: tabbing on walks its own controls and then goes
		// straight into whatever arrived, because new cards are appended right after it. The card
		// also outlives the last page, which takes the sentinel away with hasMore.
		// preventScroll, because a card is 100-200px tall and the button the user just pressed sits
		// right below it: on a short window the default focus would scroll the card into view and
		// take the answer the user is waiting for out of it. The card is where it is by being next
		// to that button, and a Tab from it scrolls on its own if it did end up out of sight.
		onRetryLoadMore(): void
		{
			const lastCard = this.$refs.grid?.lastElementChild;
			if (lastCard instanceof HTMLElement)
			{
				lastCard.focus({ preventScroll: true });
			}

			this.$emit('retry-load-more');
		},
		isSelected(id): boolean
		{
			return this.selectedSet.has(Number(id));
		},
		setupObserver(): void
		{
			this.destroyObserver();

			const sentinel = this.$refs.sentinel;
			if (!(sentinel instanceof HTMLElement))
			{
				return;
			}

			this.observer = new IntersectionObserver((entries) => {
				const entry = entries[0];
				if (entry?.isIntersecting && this.hasMore && !this.loading && !this.loadMoreFailed)
				{
					this.$emit('load-more');
				}
			}, {
				rootMargin: '100px',
			});

			this.observer.observe(sentinel);
		},
		destroyObserver(): void
		{
			if (this.observer)
			{
				this.observer.disconnect();
				this.observer = null;
			}
		},
		// Move focus to the list root. Called by the host page when the floating bulk-actions bar
		// collapses (exit / select-all off / after an action): the bar is teleported to <body>, so
		// once it hides the focus that sat on its buttons would be lost, breaking keyboard/AT flow
		// (WCAG 2.4.3). Landing on the (programmatically focusable, tabindex=-1) list root keeps the
		// next Tab anchored to the content instead of jumping to the end of the document.
		focusRoot(): void
		{
			const root = this.$refs.root;
			if (root instanceof HTMLElement)
			{
				root.focus();
			}
		},
	},
	// language=Vue
	template: `
		<div :class="rootClass" ref="root" tabindex="-1">
			<div v-if="loading && items.length === 0" class="note-document-cards__loader">
				<Loader />
			</div>
			<div v-else-if="isEmpty" class="note-document-cards__empty">{{ emptyMessage }}</div>
			<template v-else>
				<div class="note-document-cards__grid" ref="grid">
					<DocumentListItem
						v-for="item in items"
						:key="item.id"
						:item="item"
						:mode="mode"
						:selection-enabled="selectionEnabled"
						:selectable="selectable"
						:is-mobile="isMobile"
						:selected="isSelected(item.id)"
						@open="onOpen"
						@open-collection="onOpenCollection"
						@select="onSelect"
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
					<div
						v-else-if="loadMoreFailed"
						class="note-document-cards__load-more-error"
						role="status"
						aria-live="off"
						data-testid="note-document-list-load-more-error"
					>
						<span class="note-document-cards__load-more-error-text">{{ loadMoreErrorMessage }}</span>
						<button
							type="button"
							class="ui-btn --air ui-btn-md --style-tinted ui-btn-no-caps"
							data-testid="note-document-list-load-more-retry"
							@click="onRetryLoadMore"
						>
							{{ loadMoreRetryLabel }}
						</button>
					</div>
				</div>
			</template>
		</div>
	`,
};
