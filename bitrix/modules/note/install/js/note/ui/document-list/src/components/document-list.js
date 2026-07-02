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
	},
	emits: ['open', 'open-collection', 'load-more'],
	computed: {
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
	`,
};
