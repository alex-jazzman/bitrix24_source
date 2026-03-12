import { TileWidgetComponent, TileWidgetSlot } from 'ui.uploader.tile-widget';

import { Uploader } from '../classes/uploader';
import { UploadButton } from '../components/upload-button/upload-button';

import type { TileWidgetOptions } from 'ui.uploader.tile-widget';
import type { UploaderOptions } from 'ui.uploader.core';

const UploaderWidgetOptions: TileWidgetOptions = {
	readonly: false,
	hideDropArea: false,
	slots: {
		[TileWidgetSlot.BEFORE_DROP_AREA]: UploadButton,
	},
};

export const UploaderWidget = {
	name: 'UploaderWidget',
	components: { TileWidgetComponent },
	emits: ['uploadedFiles'],
	computed: {
		UploaderWidgetOptions: () => UploaderWidgetOptions,
		uploaderOptions(): UploaderOptions
		{
			return this.uploader.getOptions();
		},
	},
	created()
	{
		this.uploader = new Uploader();
		this.uploader.subscribe(Uploader.UPLOAD_EVENT, (event) => {
			const fileIds = event.getData();
			this.$emit('uploadedFiles', fileIds);
		});
	},
	template: `
		<TileWidgetComponent
			:uploaderOptions="uploaderOptions"
			:widgetOptions="UploaderWidgetOptions"
		/>
	`,
};
