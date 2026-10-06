import { BitrixVue } from 'ui.vue3';
import { RootLayout } from '../layout/root-layout';
import { buildStore } from './store';
import type {
	AppParams,
	ExtraAppOptions,
	InitialData,
} from '../types/state';

export class AppFactory
{
	static getApp(
		sourceId: string,
		initialData: InitialData = {},
		appParams: AppParams = ({} as AppParams),
		extra: ExtraAppOptions = {},
	): ReturnType<typeof BitrixVue.createApp>
	{
		const store = buildStore(initialData);

		const app = BitrixVue.createApp({
			name: 'DatasetImportV2',
			components: { RootLayout },
			data(): { sourceId: string, appParams: AppParams, extra: ExtraAppOptions }
			{
				return {
					sourceId,
					appParams,
					extra,
				};
			},
			// language=Vue
			template: `
				<RootLayout :source-id="sourceId" />
			`,
		});

		app.use(store);

		// Provide appParams/extra/sourceId to nested components without prop drilling.
		app.provide('appParams', appParams);
		app.provide('extra', extra);
		app.provide('sourceId', sourceId);

		return app;
	}
}
