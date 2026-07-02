import { BitrixVue } from 'ui.vue3';
import { createPinia } from 'ui.vue3.pinia';

import { useWizardStore } from './store/wizard';
import {
	type MailboxSettingsConfig,
	type MassconnectFeatures,
	type MassconnectPermissions,
} from './store/type';

import WizardContainer from './components/wizard/wizard-container.js';

type MassconnectFormOptions = {
	appContainerId: string;
	settingsConfig: ?MailboxSettingsConfig;
	source: ?string;
	isSmtpAvailable: boolean;
	features: MassconnectFeatures;
	permissions: MassconnectPermissions;
}

export class MassconnectForm
{
	#application;
	rootNode: ?Element;
	settingsConfig: ?MailboxSettingsConfig = null;
	source: ?string = null;
	isSmtpAvailable: boolean = false;
	features: MassconnectFeatures = {
		isPasswordlessConnectAvailable: false,
	};

	permissions: MassconnectPermissions = {
		allowedLevels: null,
		canEditCrmIntegration: null,
	};

	constructor(options: MassconnectFormOptions = {})
	{
		this.rootNode = document.querySelector(`#${options.appContainerId}`);
		this.settingsConfig = options?.settingsConfig ?? null;
		this.source = options?.source;
		this.isSmtpAvailable = options.isSmtpAvailable ?? false;
		this.features = options?.features ?? this.features;

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
		wizardStore.setFeatures(this.features);
		wizardStore.setPermissions(this.permissions);

		if (this.settingsConfig)
		{
			wizardStore.setMailboxSettingsConfig(this.settingsConfig);
		}

		this.#application.mount(this.rootNode);
	}
}
