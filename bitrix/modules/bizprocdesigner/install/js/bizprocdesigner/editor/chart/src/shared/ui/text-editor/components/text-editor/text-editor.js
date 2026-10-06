import { HtmlFormatterComponent, type HtmlFormatterOptions } from 'ui.bbcode.formatter.html-formatter';
import { TextEditorComponent } from 'ui.text-editor';
import { type VueUploaderAdapter } from 'ui.uploader.vue';
import { markRaw } from 'ui.vue3';

import { UserFieldWidgetComponent, type UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import {
	fileServices,
	textEditorServices,
	TextEditorService,
	FileService,
} from '../../services';
import { AbortButton } from '../abort-button/abort-button';
import { AttachButton } from '../attach-button/attach-button';
import { SaveButton } from '../save-button/save-button';
import { SaveConfirmDialog } from '../save-confirm-dialog/save-confirm-dialog';

import './text-editor.css';

type TextEditorSetup = {
	textEditorServices: typeof textEditorServices;
	fileServices: typeof textEditorServices;
	fileService: typeof TextEditorService;
	editorService: typeof TextEditorService;
	formatterOptions: HtmlFormatterOptions;
};

const FORMATTER_OPTIONS: HtmlFormatterOptions = { fileMode: 'disk' };

const EDITOR_CONTENT_CLASS_NAMES = {
	base: 'editor-chart-text-editor__editor-content',
	hasFiles: '--has-files',
};

const PREVIEW_CONTENT_CLASS_NAMES = {
	base: 'editor-chart-text-editor__preview-content',
	hasFiles: '--has-files',
};

// @vue/component
export const TextEditor = {
	name: 'TextEditor',
	components: {
		TextEditorComponent,
		UserFieldWidgetComponent,
		HtmlFormatterComponent,
		AttachButton,
		AbortButton,
		SaveButton,
		SaveConfirmDialog,
	},
	props: {
		id: {
			type: String,
			required: true,
		},
		text: {
			type: String,
			default: '',
		},
		files: {
			type: Array,
			default: () => ([]),
		},
		height: {
			type: Number,
			default: 0,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		removeFromServer: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'update:text',
		'update:files',
	],
	setup(props): TextEditorSetup
	{
		const fileService = fileServices.get(props.id);
		fileService.loadInitialFiles(props.files);
		const editorService = textEditorServices.get(props.id);

		return {
			/** @type TextEditor */
			textEditorServices,
			fileServices,
			fileService,
			editorService,
			formatterOptions: FORMATTER_OPTIONS,
		};
	},
	data(): Object
	{
		return {
			// markRaw: formatData is replaced as a whole, never mutated field by field,
			// so the formatter has no use for a reactive proxy of it.
			formatData: markRaw({ files: this.files }),
		};
	},
	computed: {
		isEdit(): boolean
		{
			return this.editorService?.isEdit.value ?? false;
		},
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				insertIntoText: this.isEdit,
				tileWidgetOptions: {
					compact: true,
					enableDropzone: false,
					hideDropArea: true,
					readonly: !this.isEdit,
					autoCollapse: false,
					removeFromServer: this.removeFromServer,
					events: {
						onInsertIntoText: this.handleInsertFile,
					},
				},
			};
		},
		filesSignature(): string
		{
			return JSON.stringify(this.files);
		},
		hasFiles(): boolean
		{
			return this.files.length > 0;
		},
		isShowSaveConfirm(): boolean
		{
			return this.editorService?.isShowSaveConfirm.value ?? false;
		},
		editorContentClassNames(): { [string]: boolean }
		{
			return {
				[EDITOR_CONTENT_CLASS_NAMES.base]: true,
				[EDITOR_CONTENT_CLASS_NAMES.hasFiles]: this.hasFiles,
			};
		},
		previewContentClassNames(): { [string]: boolean }
		{
			return {
				[PREVIEW_CONTENT_CLASS_NAMES.base]: true,
				[PREVIEW_CONTENT_CLASS_NAMES.hasFiles]: this.hasFiles,
			};
		},
	},
	watch: {
		// The diagram hands out deep clones of block data on every graph change, so the files
		// prop gets a new reference with unchanged content. Rebuilding formatData only on a real
		// content change keeps the formatter from re-rendering the preview and reloading images.
		filesSignature(): void
		{
			this.formatData = markRaw({ files: this.files });
		},
		height(newHeight: number): void
		{
			this.getEditor()?.setMinHeight(newHeight * 2);
		},
		isEdit(value: boolean): void
		{
			if (value)
			{
				this.editorService.setText(this.text);
			}
		},
	},
	mounted()
	{
		this.subscribeListeners();
	},
	unmounted()
	{
		this.unsubscribeListeners();
	},
	methods: {
		getEditor(): TextEditor
		{
			return this.editorService.getEditor();
		},
		getUploaderAdapter(): VueUploaderAdapter
		{
			return this.fileService.getAdapter();
		},
		subscribeListeners(): void
		{
			this.editorService
				.subscribe(TextEditorService.EVENT_NAMES.ON_SAVE, this.handleSave)
				.subscribe(TextEditorService.EVENT_NAMES.ON_ABORT, this.handleAbort);
			this.fileService
				.subscribe(FileService.EVENT_NAMES.ON_FILE_ADD, this.handleAddFile)
				.subscribe(FileService.EVENT_NAMES.ON_FILE_REMOVE, this.handleRemoveFile);
		},
		unsubscribeListeners(): void
		{
			this.editorService
				.unsubscribe(TextEditorService.EVENT_NAMES.ON_SAVE, this.handleSave)
				.unsubscribe(TextEditorService.EVENT_NAMES.ON_ABORT, this.handleAbort);
			this.fileService
				.unsubscribe(FileService.EVENT_NAMES.ON_FILE_ADD, this.handleAddFile)
				.unsubscribe(FileService.EVENT_NAMES.ON_FILE_REMOVE, this.handleRemoveFile);
		},
		handleSave(event: BaseEvent): void
		{
			this.$emit('update:text', event.data);
		},
		handleAbort(): void
		{
			this.editorService.setText(this.text);
		},
		handleInsertFile(event: BaseEvent): void
		{
			const fileInfo = { ...event.getData().item };
			this.editorService.insertFile(fileInfo);
		},
		handleAddFile(): void
		{
			this.$emit('update:files', this.fileService.getFileItems());
		},
		handleRemoveFile(): void
		{
			this.$emit('update:files', this.fileService.getFileItems());
		},
		onEditorFocus(): void
		{
			this.editorService.onFocus();
		},
		onSaveConfirm(): void
		{
			this.editorService.onSaveConfirm();
		},
		onAbortConfirm(): void
		{
			this.editorService.onAbortConfirm();
		},
		onCloseConfirm(): void
		{
			this.editorService.onCloseConfirm();
		},
		getFiles()
		{
			return { files: this.fileService.getFileItems() };
		},
	},
	template: `
		<div class="editor-chart-text-editor">
			<div
				v-if="isEdit"
				class="editor-chart-text-editor__editor"
			>
				<div
					class="editor-chart-text-editor__editor-container"
					@click="onEditorFocus"
				>
					<div :class="editorContentClassNames">
						<TextEditorComponent :editorInstance="getEditor()"/>
					</div>

					<div
						v-if="hasFiles"
						class="editor-chart-text-editor__editor-files-container"
					>
						<div class="editor-chart-text-editor__editor-files">
							<UserFieldWidgetComponent
								:uploaderAdapter="getUploaderAdapter()"
								:widgetOptions="widgetOptions"
							/>
						</div>
					</div>
				</div>

				<div class="editor-chart-text-editor__footer">
					<div class="editor-chart-text-editor__footer-container">
						<div class="editor-chart-text-editor__footer-left">
							<slot
								name="footer-left"
								:fileService="fileService"
							>
								<AttachButton :fileService="fileService"/>
							</slot>
						</div>
						<div class="editor-chart-text-editor__footer-right">
							<slot
								name="footer-right"
								:fileService="fileService"
							>
								<SaveButton :editor="editorService"/>
								<AbortButton :editor="editorService"/>
							</slot>
						</div>
					</div>
				</div>
			</div>

			<div
				v-if="!isEdit"
				class="editor-chart-text-editor__preview"
			>
				<div :class="previewContentClassNames">
					<HtmlFormatterComponent
						:bbcode="text"
						:options="formatterOptions"
						:formatData="formatData"
						ref="htmlFormatter"
					/>
				</div>

				<div
					v-if="hasFiles"
					class="editor-chart-text-editor__preview-files"
				>
					<UserFieldWidgetComponent
						:uploaderAdapter="getUploaderAdapter()"
						:widgetOptions="widgetOptions"
					/>
				</div>
			</div>
		</div>

		<slot
			v-if="isShowSaveConfirm"
			name="saveConfirm"
		>
			<SaveConfirmDialog
				@save="onSaveConfirm"
				@abort="onAbortConfirm"
				@close="onCloseConfirm"
			/>
		</slot>
	`,
};
