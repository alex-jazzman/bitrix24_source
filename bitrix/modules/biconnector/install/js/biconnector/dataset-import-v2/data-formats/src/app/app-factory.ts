import { BitrixVue } from 'ui.vue3';
import { DataFormatsDialog } from '../dialog';

type Templates = Record<string, Array<{ type: string, value: string, title?: string }>>;

export type DataFormatsInitialData = {
	current: Record<string, string>,
	templates: Templates,
};

export class DataFormatsAppFactory
{
	static getApp(initialData: DataFormatsInitialData): ReturnType<typeof BitrixVue.createApp>
	{
		return BitrixVue.createApp({
			name: 'DataFormatsApp',
			components: { DataFormatsDialog },
			data(): { initialData: DataFormatsInitialData }
			{
				return { initialData };
			},
			// language=Vue
			template: '<DataFormatsDialog :initial="initialData" />',
		});
	}
}
