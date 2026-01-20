import { BitrixVue } from 'ui.vue3';
import { createPinia } from 'ui.vue3.pinia';
import { useWizardStore } from './store/wizard';

import WizardContainer from './components/wizard/wizard-container.js';

type MassconnectFormOptions = {
	appContainerId: string;
	source: ?string;
	allowedLevel: ?string;
	isSmtpAvailable: boolean;
}

export class MassconnectForm
{
	#application;
	rootNode: ?Element;
	source: ?string = null;
	allowedLevels: ?[string] = null;
	isSmtpAvailable: boolean = false;

	constructor(options: MassconnectFormOptions = {})
	{
		this.rootNode = document.querySelector(`#${options.appContainerId}`);
		this.source = options?.source;
		this.allowedLevels = options.allowedLevel ? [options.allowedLevel] : null;
		this.isSmtpAvailable = options.isSmtpAvailable ?? false;
	}

	start(): void
	{
		const pinia = createPinia();

		this.#application = BitrixVue.createApp({
			components: {
				WizardContainer,
			},
			data: () => {
				return {
					allowedLevels: this.allowedLevels,
				};
			},
			// language=Vue
			template: '<WizardContainer :allowed-levels="allowedLevels" />',
		});

		this.#application.use(pinia);

		const wizardStore = useWizardStore();
		wizardStore.setAnalyticsSource(this.source);
		wizardStore.setSmtpStatus(this.isSmtpAvailable);

		this.#application.mount(this.rootNode);
	}
}
