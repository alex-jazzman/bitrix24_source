import { BitrixVue } from 'ui.vue3';
import { createStore } from 'ui.vue3.vuex';

import { Main } from './components/main';
import store from './store/index';

export class SettingsSliderApplication
{
	application = null;
	store = null;

	constructor(rootNode, options = {})
	{
		this.rootNode = document.querySelector(`#${rootNode}`);
		this.options = options;
	}

	start(): void
	{
		this.store = createStore(store(this.options));
		this.application = BitrixVue.createApp({
			name: 'SettingsSlider',
			components: { Main },
			template: '<Main/>',
		});

		this.store.install(this.application);
		this.application.mount(this.rootNode);
	}

	stop(): void
	{
		this.application?.unmount();
		this.application = null;
		this.store = null;
	}
}
