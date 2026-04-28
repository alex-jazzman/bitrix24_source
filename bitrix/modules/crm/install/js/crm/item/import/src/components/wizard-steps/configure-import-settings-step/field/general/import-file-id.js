import { BitrixVueComponentProps } from 'ui.vue3';
import { File } from '../../../../layout';

export const ImportFileId: BitrixVueComponentProps = {
	name: 'ImportFileId',

	components: {
		File,
	},

	props: {
		model: {
			type: Object,
			required: true,
		},
		title: {
			type: String,
			default: () => null,
		},
		uploaderOptions: {
			type: Object,
			default: () => {},
		},
	},

	template: `
		<File
			field-name="importFileId"
			:model="model"
			:field-caption="title ?? this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE')"
			:uploader-options="{
				id: 'importFileIdUploader',
				multiple: false,
				acceptedFileTypes: [
					'.csv',
				],
				controller: 'crm.Import.File.Uploader.ImportFileUploaderController',
				controllerOptions: {
					entityTypeId: this.model.get('entityTypeId'),
				},
				...this.uploaderOptions,
			}"
			:required="true"
		/>
	`,
};
