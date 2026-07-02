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
	emits: ['enter-edit-mode', 'finish-edit', 'copy-link', 'open-more'],
	computed: {
		canShowEditButton(): boolean
		{
			return !this.isArchived && !this.isTrashed;
		},
		primaryButtonDisabled(): boolean
		{
			if (this.isLoading)
			{
				return true;
			}

			if (this.isEditMode)
			{
				return this.isSaving;
			}

			return this.isSaving || !this.canEdit;
		},
		secondaryActionsDisabled(): boolean
		{
			return this.isLoading;
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
				<div class="note-page-document-actions">
					<button
						v-if="canShowEditButton && !isEditMode"
						type="button"
						class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps --with-left-icon"
						:disabled="primaryButtonDisabled"
						@click="$emit('enter-edit-mode')"
					>
						<div class="ui-icon-set --edit-l"></div>
						{{ messages.edit }}
					</button>
					<button
						v-else-if="canShowEditButton"
						type="button"
						class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps"
						:disabled="primaryButtonDisabled"
						@click="$emit('finish-edit')"
					>
						{{ messages.done }}
					</button>
					<button
						type="button"
						class="note-page-document-action-icon"
						:title="messages.copyLink"
						:aria-label="messages.copyLink"
						:disabled="secondaryActionsDisabled"
						@click="$emit('copy-link')"
					>
						<div class="ui-icon-set --o-link"></div>
					</button>
					<button
						type="button"
						class="note-page-document-action-icon"
						:title="messages.more"
						:aria-label="messages.more"
						:disabled="secondaryActionsDisabled"
						@click="(e) => $emit('open-more', e.currentTarget)"
					>
						<div class="ui-icon-set --more-l"></div>
					</button>
				</div>
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
