import { Loc, Type } from 'main.core';
import { TileWidgetComponent } from 'ui.uploader.tile-widget';
import { FileStatus, UploaderEvent } from 'ui.uploader.core';
import { VueUploaderAdapter } from 'ui.uploader.vue';
import { markRaw } from 'ui.vue3';
import { NoteThemeContext } from 'note.ui.theme-context';
import { MAX_FILE_SIZE } from '../../const';
import { toPositiveInt } from '../../utils/normalize';

function isInProgressStatus(status: string): boolean
{
	return status === FileStatus.PREPARING
		|| status === FileStatus.PENDING
		|| status === FileStatus.UPLOADING
	;
}

function resolveAcceptedFileTypes(assetKind: string): string[]
{
	switch (assetKind)
	{
		case 'image':
			return ['image/*'];
		case 'video':
			return ['video/*'];
		default:
			return [];
	}
}

export const UploadAssetNodeViewComponent = {
	name: 'NoteUploadAssetNodeView',
	components: {
		TileWidgetComponent,
	},
	props: {
		attrs: {
			type: Object,
			required: true,
		},
		onComplete: {
			type: Function,
			required: true,
		},
	},
	data()
	{
		return {
			localError: '',
			uploaderOptions: null,
			uploaderAdapter: null,
			currentThemeContextClass: NoteThemeContext.getDesignSystemContext(),
			unsubscribeTheme: null,
		};
	},
	computed: {
		widgetOptions(): Object
		{
			return {
				autoCollapse: false,
				forceDisableSelection: true,
				showItemMenuButton: false,
				removeFromServer: false,
				contextClass: this.currentThemeContextClass,
			};
		},
		assetKind(): string
		{
			const value = String(this.attrs.assetKind || 'file').toLowerCase();

			return ['file', 'image', 'video'].includes(value) ? value : 'file';
		},
		documentId(): number | null
		{
			return toPositiveInt(this.attrs.documentId);
		},
		collectionId(): number | null
		{
			return toPositiveInt(this.attrs.collectionId);
		},
		isContextValid(): boolean
		{
			return this.documentId !== null;
		},
		nodeTitle(): string
		{
			switch (this.assetKind)
			{
				case 'image':
					return Loc.getMessage('NOTE_EDITOR_UPLOAD_NODE_TITLE_IMAGE');
				case 'video':
					return Loc.getMessage('NOTE_EDITOR_UPLOAD_NODE_TITLE_VIDEO');
				default:
					return Loc.getMessage('NOTE_EDITOR_UPLOAD_NODE_TITLE_FILE');
			}
		},
		errorMessage(): string
		{
			if (!this.isContextValid)
			{
				return Loc.getMessage('NOTE_EDITOR_UPLOAD_NODE_ERROR_CONTEXT');
			}

			return this.localError || String(this.attrs.errorMessage || '');
		},
		maxFileSize(): number
		{
			return MAX_FILE_SIZE;
		},
	},
	created()
	{
		this.uploaderOptions = this.buildUploaderOptions();
		this.uploaderAdapter = this.createUploaderAdapter(this.uploaderOptions);
		this.unsubscribeTheme = NoteThemeContext.subscribe((theme: string): void => {
			this.currentThemeContextClass = NoteThemeContext.resolveDesignSystemContext(theme);
		});
	},
	beforeUnmount()
	{
		this.unsubscribeTheme?.();
		this.unsubscribeTheme = null;

		if (this.uploaderAdapter)
		{
			this.uploaderAdapter.destroy();
			this.uploaderAdapter = null;
		}
	},
	methods: {
		createUploaderAdapter(uploaderOptions: Object): Object
		{
			const adapter = new VueUploaderAdapter(uploaderOptions);
			adapter.setRemoveFilesFromServerWhenDestroy(false);

			return markRaw(adapter);
		},
		buildUploaderOptions(): Object
		{
			const events = {
				[UploaderEvent.FILE_STATUS_CHANGE]: this.handleFileStatusChange,
				[UploaderEvent.FILE_UPLOAD_COMPLETE]: this.handleFileUploadComplete,
				[UploaderEvent.FILE_ERROR]: this.handleFileError,
				[UploaderEvent.ERROR]: this.handleFileError,
			};
			const acceptedFileTypes = resolveAcceptedFileTypes(this.assetKind);
			const acceptedFileTypesOptions = acceptedFileTypes.length > 0
				? { acceptedFileTypes }
				: {}
			;

			if (!this.isContextValid)
			{
				return {
					autoUpload: false,
					multiple: false,
					events,
					...acceptedFileTypesOptions,
				};
			}

			const controllerOptions: Object = { documentId: this.documentId };
			if (this.collectionId !== null)
			{
				controllerOptions.collectionId = this.collectionId;
			}

			return {
				controller: 'note.infrastructure.controller.editorUploaderController',
				controllerOptions,
				multiple: false,
				autoUpload: true,
				maxFileSize: this.maxFileSize,
				events,
				...acceptedFileTypesOptions,
			};
		},
		handleFileStatusChange(event: Object): void
		{
			const file = event.getData?.()?.file;
			const status = file?.getStatus?.();
			if (isInProgressStatus(status))
			{
				this.localError = '';
			}
		},
		handleFileUploadComplete(event: Object): void
		{
			const file = event.getData?.()?.file;
			const payload = this.buildPayload(file);
			if (!payload)
			{
				this.handleUploadError(Loc.getMessage('NOTE_EDITOR_UPLOAD_NODE_ERROR_UPLOAD'));

				return;
			}

			this.localError = '';
			this.onComplete(payload);
		},
		handleFileError(event: Object): void
		{
			const message = event?.getData?.()?.error?.getMessage?.()
				|| Loc.getMessage('NOTE_EDITOR_UPLOAD_NODE_ERROR_UPLOAD')
			;

			this.handleUploadError(message);
		},
		handleUploadError(message: string): void
		{
			this.localError = String(message || '');
		},
		buildPayload(file: Object | null): Object | null
		{
			if (!file)
			{
				return null;
			}

			const customData = file.getCustomData?.();
			if (!Type.isPlainObject(customData))
			{
				return null;
			}

			const fileId = toPositiveInt(customData.fileId);
			const showUrl = Type.isStringFilled(customData.showUrl) ? customData.showUrl : '';
			if (fileId === null || !Type.isStringFilled(showUrl))
			{
				return null;
			}

			const viewerAttrs = Type.isPlainObject(customData.viewerAttrs) ? customData.viewerAttrs : {};
			const downloadUrl = Type.isStringFilled(customData.downloadUrl) ? customData.downloadUrl : showUrl;

			return {
				assetKind: this.assetKind,
				name: file.getName?.() || '',
				size: Number(file.getSize?.() ?? 0) || 0,
				mimeType: file.getType?.() || '',
				fileId,
				documentId: this.documentId,
				showUrl,
				downloadUrl,
				previewUrl: Type.isStringFilled(file.getPreviewUrl?.()) ? file.getPreviewUrl() : showUrl,
				viewerAttrs,
			};
		},
	},
	// language=Vue
	template: `
		<div ref="container" class="note-editor-upload-asset-inner" :class="{'--error': errorMessage !== ''}">
			<div class="note-editor-upload-asset-title">{{ nodeTitle }}</div>
				<TileWidgetComponent
					ref="uploader"
					:uploader-adapter="uploaderAdapter"
					:widgetOptions="widgetOptions"
				/>
			<div v-if="errorMessage" class="note-editor-upload-asset-error">{{ errorMessage }}</div>
		</div>
	`,
};
