import { BitrixVue } from 'ui.vue3';
import { Chart } from './app';
import { ensureChartPinia } from './shared/stores';
import { TestId } from './shared/utils/test-id';

export { elementId, useProcessDataStore } from './entities/process-data';
export { makeDialogDraggable } from './shared/utils/dialog-popup';
export type {
	Mechanics,
	ProcessDataElement,
	ProcessDataProperty,
	ProcessDataUsage,
	Purpose,
	SharedAccess,
} from './entities/process-data';

export class App
{
	static mount(containerId: string, rootProps?: {[key: string]: any} | null): void
	{
		const container = document.getElementById(containerId);
		const app = BitrixVue.createApp(Chart, rootProps);
		// Kept reachable for the windows the editor mounts as applications of their own.
		const store = ensureChartPinia();
		// @chef-ignore
		app.use(store);
		// @chef-ignore
		app.use(TestId);
		app.provide('debug', false);
		app.mount(container);
	}
}
