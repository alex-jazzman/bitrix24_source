/* eslint-disable */
type DataFormatsInitialData = {
	current: Record<string, string>;
	templates: Templates;
};

type Templates = Record<string, Array<{
	type: string;
	value: string;
	title?: string;
}>>;

declare namespace BX.BIConnector.DatasetImportV2 {
	class DataFormatsAppFactory {
		static getApp(initialData: DataFormatsInitialData): ReturnType<typeof BX.Vue3.BitrixVue.createApp>;
	}
}
