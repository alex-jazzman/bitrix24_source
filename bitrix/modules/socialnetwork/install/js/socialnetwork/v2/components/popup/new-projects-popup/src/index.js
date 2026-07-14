import { Event } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { BannerDispatcher } from 'ui.banner-dispatcher';

import { NewProjectsPopup } from './new-projects-popup.js';

export { NewProjectsPopup };

const containerId = 'scn-new-projects-popup-mount-container';

Event.ready(() => {
	BannerDispatcher.high.toQueue((onDone) => {
		if (document.getElementById(containerId))
		{
			return;
		}

		const container = document.createElement('div');
		container.id = containerId;
		document.body.appendChild(container);

		BitrixVue.createApp({
			components: { NewProjectsPopup },
			template: '<NewProjectsPopup @close="handleClosePopup"/>',
			methods: {
				handleClosePopup()
				{
					onDone();
					container.remove();
				},
			},
		}).mount(container);
	});
});
