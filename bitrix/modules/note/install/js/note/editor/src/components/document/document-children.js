import { BIcon, Set } from 'ui.icon-set.api.vue';
import { DocumentList } from 'note.ui.document-list';

export const DocumentChildrenComponent = {
	name: 'NoteEditorDocumentChildren',
	components: {
		BIcon,
		DocumentList,
	},
	props: {
		children: {
			type: Array,
			default: () => [],
		},
		childrenLoading: {
			type: Boolean,
			default: false,
		},
		childrenHasMore: {
			type: Boolean,
			default: false,
		},
		loadMoreChildren: {
			type: Function,
			default: () => {},
		},
		documentsLabel: {
			type: String,
			default: 'Documents',
		},
	},
	emits: ['open-child'],
	data()
	{
		return {
			collapsed: false,
		};
	},
	computed: {
		visible(): boolean
		{
			return this.children.length > 0;
		},
		toggleIcon(): string
		{
			return this.collapsed ? Set.CHEVRON_DOWN : Set.CHEVRON_UP;
		},
	},
	methods: {
		toggle(): void
		{
			this.collapsed = !this.collapsed;
		},
		onOpen(item): void
		{
			this.$emit('open-child', item);
		},
		onLoadMore(): void
		{
			this.loadMoreChildren();
		},
	},
	// language=Vue
	template: `
		<div v-if="visible" class="note-editor-children-block">
			<div class="note-editor-children-header" @click="toggle">
				<span class="note-editor-children-header-label">{{ documentsLabel }}</span>
				<button class="note-editor-children-toggle" type="button">
					<BIcon :name="toggleIcon" :size="16" />
				</button>
			</div>
			<template v-if="!collapsed">
				<DocumentList
					mode="compact"
					:items="children"
					:has-more="childrenHasMore"
					:loading="childrenLoading"
					@open="onOpen"
					@load-more="onLoadMore"
				/>
			</template>
		</div>
	`,
};
