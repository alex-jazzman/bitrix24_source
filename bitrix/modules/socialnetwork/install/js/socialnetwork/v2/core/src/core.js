import { Extension } from 'main.core';
import { createPinia } from 'ui.vue3.pinia';

import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { useProjectStore } from 'socialnetwork.v2.model.project';

const settingsExtension = Extension.getSettings('socialnetwork.v2.core');

export type Settings = {
	action?: string;
	currentUserId: number;
	isOldPortal: boolean;
	isAccessRestricted: boolean;
}

type ProjectWizardCoreParams = {
	action: string;
	projectId: number | null;
	publication?: boolean;
}

class CoreApplication
{
	getSettings(): Settings
	{
		return settingsExtension;
	}

	createStore(): Object
	{
		return createPinia();
	}

	initStores(params: ProjectWizardCoreParams): void
	{
		const {
			action,
			projectId,
			publication,
		} = params;
		const settings = this.getSettings();
		const optionsStoreProject = {
			projectId: projectId || null,
			publication,
		};
		const optionsStoreInterface = {
			...settings,
			action,
		};

		useProjectStore().init(optionsStoreProject);
		useInterfaceStore().init(optionsStoreInterface);
	}
}

export const Core = new CoreApplication();
