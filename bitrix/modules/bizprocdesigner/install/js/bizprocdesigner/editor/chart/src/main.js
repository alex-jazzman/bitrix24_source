import { BitrixVue } from 'ui.vue3';
import { createPinia } from 'ui.vue3.pinia';
import { Chart } from './app';

const TestId = {
	install(app) {
		// eslint-disable-next-line no-param-reassign
		app.config.globalProperties.$testId = (id: string, ...args: Array<string>): string => {
			if (!id)
			{
				throw new Error('bizprocdesiner: not found test id');
			}

			const preparedArgs = args.reduce((acc, arg) => {
				return `${acc}-${arg}`;
			}, '');

			return `${id}${preparedArgs}`;
		};
	},
};

export class App
{
	static mount(containerId: string, rootProps?: {[key: string]: any} | null): void
	{
		const container = document.getElementById(containerId);
		const app = BitrixVue.createApp(Chart, rootProps);
		const store = createPinia();
		app.use(store);
		app.use(TestId);
		app.provide('debug', false);
		app.mount(container);
	}
}
