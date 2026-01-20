import { BitrixVue } from 'ui.vue3';
import { RagAppComponent } from './component/app';
export { RagAppComponent } from './component/app';

export function initRagDevApp(
	container: HTMLElement,
	isMultiple: boolean = false,
	existedKnowledgeBases: Array = [],
): void
{
	const app = BitrixVue.createApp(RagAppComponent, {
		isMultiple,
		existedKnowledgeBases,
	});
	app.mount(container);
}
