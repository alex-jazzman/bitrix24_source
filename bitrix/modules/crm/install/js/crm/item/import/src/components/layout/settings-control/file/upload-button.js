import { BitrixVueComponentProps } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle } from 'ui.vue3.components.button';

import { UploaderEvent } from 'ui.uploader.core';

export const UploadButton: BitrixVueComponentProps = {
	name: 'UploadButton',

	inject: [
		'uploader',
		'adapter',
	],

	components: {
		UiButton,
	},

	data(): Object
	{
		return {
			items: [],
			isUploading: false,
			AirButtonStyle,
		};
	},

	created() {
		this.items = this.adapter.getReactiveItems();

		this.uploader.subscribe(UploaderEvent.UPLOAD_START, () => {
			this.isUploading = true;
		});

		this.uploader.subscribe(UploaderEvent.UPLOAD_COMPLETE, () => {
			this.isUploading = false;
		});
	},

	methods: {
		browse(): void
		{
			if (!this.browseElement)
			{
				this.browseElement = document.createElement('div');
				this.uploader.assignBrowse(this.browseElement);
			}

			this.browseElement.click();
		},
	},

	computed: {
		containerClass(): Object
		{
			return {
				'crm-item-import__upload-button-container': true,
				'--with-file': this.items.length > 0,
			};
		},
	},

	template: `
		<div :class="containerClass">
			<template v-if="items.length === 0">
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE_UPLOAD')"
					@click="browse"
					:style="AirButtonStyle.FILLED"
					:disabled="isUploading"
				/>
			</template>
			<template v-else>
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE_UPDATE')"
					@click="browse"
					:style="AirButtonStyle.OUTLINE"
					:disabled="isUploading"
				/>
			</template>
		</div>
	`,
};
