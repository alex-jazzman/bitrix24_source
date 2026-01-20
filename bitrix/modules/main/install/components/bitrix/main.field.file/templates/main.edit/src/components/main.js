import { Type, Event } from 'main.core';
import { FileStatus, UploaderEvent } from 'ui.uploader.core';
import { TileWidgetComponent } from 'ui.uploader.tile-widget';

export { Main, AppContext };

declare type AppContext = {
	id: number,
	entityId: string,
	entityValueId: string,
	fieldName: string,
	multiple: boolean,
	sessionId: string,
	controllerOptions: Object
};

const Main = {
	components: {
		TileWidgetComponent,
	},
	data(): Object
	{
		return {
			deletedValues: [],
			uploadedValues: [],
			uploadInProgress: false,
		};
	},
	props: {
		fieldName: {
			type: String,
			required: true,
		},
		controlId: {
			type: String,
			required: true,
		},
		context: {
			type: Object,
			required: true,
		},
		values: {
			type: Object,
		},
	},

	computed: {
		sessionInputName(): string
		{
			return `${this.context.fieldName}_session_id`;
		},
		valueInputName(): string
		{
			return this.context.fieldName + (this.context.multiple ? '[]' : '');
		},
		deletedValueInputName(): string
		{
			return `${this.context.fieldName}_del${this.context.multiple ? '[]' : ''}`;
		},
		sessionId(): string
		{
			return this.context.sessionId;
		},
		currentValues(): Array
		{
			const values = [
				...this.values,
				...this.uploadedValues,
			];

			return this.context.multiple ? values : values.slice(-1);
		},
		uploaderOptions(): Object
		{
			return {
				controller: 'main.fileUploader.fieldFileUploaderController',
				controllerOptions: this.context.controllerOptions,
				files: this.values,
				events: {
					[UploaderEvent.FILE_UPLOAD_COMPLETE]: (event) => {
						const newFileId = event.getData()?.file?.getCustomData()?.realFileId;
						if (newFileId)
						{
							this.uploadedValues.push(newFileId);
						}

						this.emitChangeEvent();
					},
					[UploaderEvent.FILE_REMOVE]: (event) => {
						const justUploadedDeletedFileId = event.getData()?.file?.getCustomData()?.realFileId;
						if (
							justUploadedDeletedFileId
							&& this.uploadedValues.includes(justUploadedDeletedFileId)
						) // just uploaded file was deleted
						{
							this.uploadedValues = this.uploadedValues.filter((id) => id !== justUploadedDeletedFileId);
						}

						const deletedFileId = event.getData()?.file?.getServerFileId();

						if (deletedFileId && Type.isInteger(deletedFileId)) // existed file was deleted
						{
							this.deletedValues.push(deletedFileId);
						}

						this.emitChangeEvent();
					},
					[UploaderEvent.FILE_STATUS_CHANGE]: (event) => {
						const files = event.getTarget()?.getFiles();
						if (!files)
						{
							return;
						}
						const inProgress = files.some((file) => {
							const status = file.getStatus();

							return status === FileStatus.UPLOADING
								|| status === FileStatus.PREPARING
								|| status === FileStatus.PENDING
								|| status === FileStatus.UPLOADING
							;
						});
						if (this.uploadInProgress !== inProgress)
						{
							this.uploadInProgress = inProgress;
							if (inProgress)
							{
								this.emitUploadStartEvent();
							}
							else
							{
								this.emitUploadCompleteEvent();
							}
						}
					},
				},
				multiple: this.context.multiple,
				autoUpload: true,
				treatOversizeImageAsFile: true,
			};
		},
		widgetOptions(): Object
		{
			return {};
		},
	},
	methods: {
		emitChangeEvent(): void
		{
			BX.onCustomEvent(window, 'onUIEntityEditorUserFieldExternalChanged', [this.fieldName]);
			BX.onCustomEvent(window, 'onCrmEntityEditorUserFieldExternalChanged', [this.fieldName]);
		},
		emitUploadStartEvent(): void
		{
			Event.EventEmitter.emit('BX.UI.EntityEditor:onUserFieldFileUploadStart', { fieldName: this.fieldName });
		},
		emitUploadCompleteEvent(): void
		{
			Event.EventEmitter.emit('BX.UI.EntityEditor:onUserFieldFileUploadComplete', { fieldName: this.fieldName });
		},
	},
	template: `
		<div class="main-field-file-wrapper">
			<input type="hidden" :name="sessionInputName" :value="sessionId" />
			<input v-if="currentValues.length" v-for="(value, index) in currentValues" :key="index" type="hidden" :name="valueInputName" :value="value"/>
			<input v-else type="hidden" :name="valueInputName" />

			<input v-for="(value, index) in deletedValues" :key="index" type="hidden" :name="deletedValueInputName" :value="value"/>

			<TileWidgetComponent
				ref="uploader"
				:uploaderOptions="uploaderOptions"
				:widgetOptions="widgetOptions"
			/>
		</div>
	`,
};
