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
	},
	emits: ['open', 'open-collection', 'load-more', 'select'],
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
				if (entry?.isIntersecting && this.hasMore && !this.loading)
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
				<div class="note-document-cards__grid">
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
				</div>
			</template>
		</div>
	`,
};
