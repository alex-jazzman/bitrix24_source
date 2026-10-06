import 'ui.buttons';
import 'ui.icon-set.outline';
import { Loader } from 'note.ui.loader';

export const DocumentContentComponent = {
	name: 'NoteEditorDocumentContent',
	components: {
		Loader,
	},
	props: {
		isLoading: {
			type: Boolean,
			required: true,
		},
		loadingLabel: {
			type: String,
			required: true,
		},
		editorMountId: {
			type: String,
			required: true,
		},
		hasChildrenBlock: {
			type: Boolean,
			default: false,
		},
		isEditMode: {
			type: Boolean,
			default: false,
		},
		canEdit: {
			type: Boolean,
			default: false,
		},
		isArchived: {
			type: Boolean,
			default: false,
		},
		isTrashed: {
			type: Boolean,
			default: false,
		},
		trashedAt: {
			type: [String, null],
			default: null,
		},
		isOrphan: {
			type: Boolean,
			default: false,
		},
		canRestore: {
			type: Boolean,
			default: false,
		},
		isSaving: {
			type: Boolean,
			default: false,
		},
		messages: {
			type: Object,
			default: () => ({}),
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-document-page">
			<div
				class="note-editor-document-content"
				:class="{
					'note-editor-document-content--with-children': hasChildrenBlock,
					'note-editor-document-content--edit-mode': isEditMode,
				}"
			>
				<div
					v-if="isLoading"
					class="note-editor-document-loading"
					role="status"
					:aria-label="loadingLabel"
				>
					<Loader :label="loadingLabel" />
				</div>
				<div
					v-show="!isLoading"
					:id="editorMountId"
					class="note-editor-document-host"
				></div>
				<slot v-if="!isLoading" />
			</div>
		</div>
	`,
};
