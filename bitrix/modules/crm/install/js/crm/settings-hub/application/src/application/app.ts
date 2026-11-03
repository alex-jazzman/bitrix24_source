import { Loc, Type } from 'main.core';
import { Center } from 'ui.notification';
import { BitrixVue } from 'ui.vue3';

import { CrmSettingsHubRoot } from '../component/root/root';
import { createNavigationContext, navigationContextKey } from '../context/navigation';
import { hydrateSettingsHubBootstrap } from '../infrastructure/service/navigation/mappers';
import { SettingsService } from '../infrastructure/service/settings/settings-service';

export class App
{
	static #application: ReturnType<typeof BitrixVue.createApp> | null = null;

	static start(container: HTMLElement, bootstrap: unknown): void
	{
		if (!Type.isElementNode(container))
		{
			throw new TypeError('App.start expects an existing DOM element');
		}

		const { settings: settingsState, navigation } = hydrateSettingsHubBootstrap(bootstrap);
		const settingsService = new SettingsService();
		this.stop();
		const application = BitrixVue.createApp(CrmSettingsHubRoot, {
			settingsState,
			settingsService,
			onUpdateError: (): void => {
				Center.notify({
					content: Loc.getMessage('CRM_SETTINGS_HUB_SAVE_ERROR') ?? '',
					autoHideDelay: 5000,
				});
			},
		});
		application.provide(navigationContextKey, createNavigationContext(navigation));
		this.#application = application;

		try
		{
			application.mount(container);
		}
		catch (error)
		{
			this.stop();

			throw error;
		}
	}

	static stop(): void
	{
		try
		{
			this.#application?.unmount();
		}
		finally
		{
			this.#application = null;
		}
	}
}
