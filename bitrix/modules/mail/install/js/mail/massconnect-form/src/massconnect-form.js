import { BitrixVue } from 'ui.vue3';
import { createPinia } from 'ui.vue3.pinia';
import { useWizardStore } from './store/wizard';
import type { MassconnectPermissions } from './store/type';

import WizardContainer from './components/wizard/wizard-container.js';

type MassconnectFormOptions = {
	appContainerId: string;
	source: ?string;
	isSmtpAvailable: boolean;
	permissions: MassconnectPermissions;
}

export class MassconnectForm
{
	#application;
	rootNode: ?Element;
	source: ?string = null;
	isSmtpAvailable: boolean = false;
	permissions: MassconnectPermissions = {
		allowedLevels: null,
		canEditCrmIntegration: null,
	};

	constructor(options: MassconnectFormOptions = {})
	{
		this.rootNode = document.querySelector(`#${options.appContainerId}`);
		this.source = options?.source;
		this.isSmtpAvailable = options.isSmtpAvailable ?? false;

		if (options?.permissions)
		{
			this.permissions = options.permissions;
		}
	}

	start(): void
	{
		const pinia = createPinia();

		this.#application = BitrixVue.createApp({
			components: {
				WizardContainer,
			},
			// language=Vue
			template: '<WizardContainer />',
		});

		this.#application.use(pinia);

		const wizardStore = useWizardStore();
		wizardStore.setAnalyticsSource(this.source);
		wizardStore.setSmtpStatus(this.isSmtpAvailable);
		wizardStore.setPermissions(this.permissions);

		this.#application.mount(this.rootNode);
	}
}
