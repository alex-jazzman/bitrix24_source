import { Type } from 'main.core';
import { TileWidgetComponent } from 'ui.uploader.tile-widget';
import { UploaderEvent, UploaderFile, Uploader } from 'ui.uploader.core';

import type { TileWidgetOptions } from 'ui.uploader.tile-widget';
import type { UploaderOptions } from 'ui.uploader.core';

// @vue/component
export const ConstantFile = {
	name: 'ConstantFile',
	components: {
		TileWidgetComponent,
	},
	inject: ['templateId'],
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: [String, Array, Number],
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		uploaderOptions(): UploaderOptions
		{
			return {
				controller: 'bizproc.fileUploader.setupTemplateUploaderController',
				controllerOptions: {
					templateId: this.templateId,
				},
				files: this.normalizeModelValues(),
				multiple: this.item.multiple,
				autoUpload: true,
				hiddenFieldsContainer: this.$refs.uploaderHiddenFields,
				events: {
					[UploaderEvent.FILE_COMPLETE]: (): void => {
						this.syncValue();
					},
					[UploaderEvent.FILE_REMOVE]: (): void => {
						this.syncValue();
					},
				},
			};
		},
		widgetOptions(): TileWidgetOptions
		{
			return {
				readonly: this.disabled,
				hideDropArea: this.disabled,
			};
		},
	},
	methods: {
		syncValue(): void
		{
			const uploader: Uploader = this.$refs?.tileWidget?.uploader;
			if (!uploader)
			{
				return;
			}

			const fileIds: Array<string | number> = uploader
				.getFiles()
				.map((value: UploaderFile): string => value.getServerFileId())
				.filter((id) => Type.isStringFilled(id) || Type.isNumber(id))
			;

			if (this.item.multiple)
			{
				this.$emit('update:modelValue', fileIds);
			}
			else
			{
				this.$emit('update:modelValue', fileIds.length > 0 ? fileIds[0] : '');
			}
		},
		normalizeModelValues(): Array<number | string>
		{
			if (Type.isArray(this.modelValue))
			{
				return this.modelValue;
			}

			return this.modelValue ? [this.modelValue] : [];
		},
	},
	template: `
		<div ref="uploaderHiddenFields"></div>
		<TileWidgetComponent :uploaderOptions="uploaderOptions" :widgetOptions="widgetOptions" ref="tileWidget"/>
	`,
};
