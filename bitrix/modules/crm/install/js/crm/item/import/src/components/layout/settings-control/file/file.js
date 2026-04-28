import { BitrixVueComponentProps } from 'ui.vue3';
import { Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import type { UploaderOptions, Uploader } from 'ui.uploader.core';
import { TileWidgetComponent, TileWidgetOptions, TileWidgetSlot } from 'ui.uploader.tile-widget';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

import { RequiredMark, ErrorMessage } from '../../index';

import './file.css';
import { UploadButton } from './upload-button';

export const File: BitrixVueComponentProps = {
	name: 'File',

	components: {
		TileWidgetComponent,
		RequiredMark,
		ErrorMessage,
	},

	props: {
		fieldName: {
			type: String,
			required: true,
		},
		model: {
			type: Object,
			required: true,
		},
		fieldCaption: {
			type: String,
			required: true,
		},
		widgetOptions: {
			type: Object,
			default: () => {},
		},
		uploaderOptions: {
			/** @type UploaderOptions */
			type: Object,
			default: () => {},
		},
		required: {
			type: Boolean,
			default: () => false,
		},
	},

	data(): Object
	{
		return {
			error: null,
		};
	},

	mounted(): void
	{
		this.startDestroy = false;

		this.$Bitrix.eventEmitter.subscribe(`crm:item:import:field-${this.fieldName}:validate`, this.onFileValidate);

		if (this.model.get(this.fieldName))
		{
			this.getUploader().addFile(this.model.get(this.fieldName), { preload: true });
		}
	},

	beforeUnmount()
	{
		this.getAdapter().setRemoveFilesFromServerWhenDestroy(false);
		this.$Bitrix.eventEmitter.unsubscribe(`crm:item:import:field-${this.fieldName}:validate`, this.onFileValidate);
	},

	methods: {
		getUploaderOptions(): UploaderOptions
		{
			return {
				...this.uploaderOptions,
				events: {
					onUploadComplete: () => {
						const file = this.getUploader().getFiles()[0];
						if (file && file.isComplete())
						{
							this.error = null;
							this.model.set(this.fieldName, file.getServerFileId());

							const encoding = file.getCustomData('detectedEncoding');
							if (encoding)
							{
								this.model.set(`${this.fieldName}DetectedEncoding`, encoding);
							}

							const binary = file.getBinary();
							if (binary)
							{
								this.model.set(`${this.fieldName}Binary`, binary);
							}
						}
					},
					onDestroy: () => {
						this.startDestroy = true;
					},
					'File:onRemove': () => {
						if (!this.startDestroy)
						{
							this.model.set(this.fieldName, null);
							this.model.set(`${this.fieldName}Binary`, null);
						}
					},
					onError: () => {
						this.model.set(this.fieldName, null);
						this.model.set(`${this.fieldName}Binary`, null);
					},
					'File:onError': () => {
						this.model.set(this.fieldName, null);
						this.model.set(`${this.fieldName}Binary`, null);
					},
				},
			};
		},

		getWidgetOptions(): TileWidgetOptions
		{
			return {
				...this.widgetOptions,
				hideDropArea: true,
				slots: {
					[TileWidgetSlot.BEFORE_TILE_LIST]: UploadButton,
				},
			};
		},

		onFileValidate(event: BaseEvent): void
		{
			if (!this.validate())
			{
				this.error = this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE_REQUIRED_ERROR');
				event.preventDefault();
			}
		},

		validate(): boolean
		{
			return !this.required || Type.isStringFilled(this.model.get(this.fieldName));
		},

		getUploader(): Uploader
		{
			return this.$refs.uploader.uploader;
		},

		getAdapter(): VueUploaderAdapter
		{
			return this.$refs.uploader.adapter;
		},
	},

	template: `
		<div class="crm-item-import__field --file ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<TileWidgetComponent
					ref="uploader"
					:widget-options="getWidgetOptions()"
					:uploader-options="getUploaderOptions()"
				/>
			</div>
			<ErrorMessage :error="this.error" />
		</div>
	`,
};
