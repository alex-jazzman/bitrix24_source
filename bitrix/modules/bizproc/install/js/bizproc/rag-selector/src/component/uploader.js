import { Extension, Type } from 'main.core';
import { TileWidgetComponent } from 'ui.uploader.tile-widget';
import { UploaderEvent, UploaderFile, Uploader } from 'ui.uploader.core';

import type { FileIdReplaces, PersistentFileId, TempFileId } from '../types';
import type { TileWidgetOptions } from 'ui.uploader.tile-widget';
import type { UploaderOptions } from 'ui.uploader.core';

// @vue/component
export const RagFileUploader = {
	name: 'RagFileUploader',
	components: { TileWidgetComponent },
	props: {
		knowledgeBaseUid: {
			type: String,
			default: '',
		},
		fileIds: {
			type: Array,
			default: () => [],
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		fileIdsReplaces: {
			type: [Object, null],
			default: null,
		},
	},
	emits: ['filesChanged'],
	computed: {
		uploaderOptions(): UploaderOptions
		{
			const settings = Extension.getSettings('bizproc.rag-selector');

			return {
				controller: 'bizproc.fileUploader.KnowledgeBaseUploaderController',
				controllerOptions: {
					knowledgeBaseUid: this.knowledgeBaseUid,
				},
				files: this.fileIds,
				multiple: true,
				maxFileCount: settings.get('maxFilesCount', 0),
				maxFileSize: settings.get('maxFileSize', 0),
				autoUpload: true,
				hiddenFieldsContainer: this.$refs.ragUploaderHiddenFields,
				acceptedFileTypes: settings.get('acceptedFileTypes', []),
				events: {
					[UploaderEvent.FILE_COMPLETE]: (): void => {
						this.emitFilesChanged();
					},
					[UploaderEvent.FILE_REMOVE]: (): void => {
						this.emitFilesChanged();
					},
				},
			};
		},
		widgetOptions(): TileWidgetOptions
		{
			return {
				readonly: this.readonly,
				hideDropArea: this.readonly,
			};
		},
	},
	watch: {
		fileIdsReplaces(newValue: FileIdReplaces): void
		{
			if (!Type.isObject(newValue))
			{
				return;
			}

			const uploader: Uploader = this.$refs?.tileWidget?.uploader;
			if (!uploader)
			{
				return;
			}

			for (const [tempFileId: TempFileId, persistentFileId: PersistentFileId] of Object.entries(newValue))
			{
				uploader
					.getFiles()
					.forEach((file: UploaderFile): void => {
						if (file.getServerFileId() === tempFileId)
						{
							file.setServerFileId(persistentFileId);
						}
					})
				;
			}
		},
	},
	methods: {
		emitFilesChanged(): void
		{
			const uploader: Uploader = this.$refs?.tileWidget?.uploader;
			if (!uploader)
			{
				return;
			}

			const fileIds: Array<string | number> = uploader
				.getFiles()
				.map((value: UploaderFile): string => value.getServerFileId())
			;
			this.$emit('filesChanged', fileIds);
		},
	},
	template: `
		<div ref="ragUploaderHiddenFields"></div>
		<TileWidgetComponent :uploaderOptions="uploaderOptions" :widgetOptions="widgetOptions" ref="tileWidget"/>
	`,
};
