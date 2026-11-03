import { DocumentList, DocumentSection } from 'note.ui.document-list';

export const DocumentChildrenComponent = {
	name: 'NoteEditorDocumentChildren',
	components: {
		DocumentList,
		DocumentSection,
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
	computed: {
		// Whether the block is shown at all stays here: the shared section renders whatever it is
		// given and knows nothing about documents.
		visible(): boolean
		{
			return this.children.length > 0;
		},
	},
	methods: {
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
		<DocumentSection
			v-if="visible"
			class="note-editor-children-block"
			:label="documentsLabel"
			:heading-level="2"
			test-id="note-editor-children"
		>
			<DocumentList
				mode="compact"
				data-testid="note-editor-children-list"
				:items="children"
				:has-more="childrenHasMore"
				:loading="childrenLoading"
				@open="onOpen"
				@load-more="onLoadMore"
			/>
		</DocumentSection>
	`,
};
