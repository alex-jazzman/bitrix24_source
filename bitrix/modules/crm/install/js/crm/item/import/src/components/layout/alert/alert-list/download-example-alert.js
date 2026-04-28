import { BitrixVueComponentProps } from 'ui.vue3';
import { ServiceLocator } from '../../../../lib/service-locator';
import { DownloadAlert } from './download-alert';

export const DownloadExampleAlert: BitrixVueComponentProps = {
	name: 'DownloadExampleAlert',

	props: {
		importSettings: {
			type: Object,
			required: true,
		},
	},

	components: {
		DownloadAlert,
	},

	methods: {
		getDownloadUrl(): string
		{
			return ServiceLocator.instance().getController().getDownloadExampleUrl(this.importSettings);
		},
	},

	template: `
		<DownloadAlert
			phrase="CRM_ITEM_IMPORT_DOWNLOAD_IMPORT_FILE_EXAMPLE"
			:download-url="getDownloadUrl"
		/>
	`,
};
