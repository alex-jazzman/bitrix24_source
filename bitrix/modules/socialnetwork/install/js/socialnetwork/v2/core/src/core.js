import { Extension } from 'main.core';
import { createPinia } from 'ui.vue3.pinia';

import { useInterfaceStore, TYPES_PROJECT_WIZARD_ACTION } from 'socialnetwork.v2.model.interface';
import { useProjectStore, isValidNotificationCatalog, type NotificationCatalog } from 'socialnetwork.v2.model.project';

const settingsExtension = Extension.getSettings('socialnetwork.v2.core');

export type Settings = {
	action?: string;
	currentUserId: number;
	isOldPortal: boolean;
	isAccessRestricted: boolean;
	canProposeProjectsTrial: boolean;
	notificationDefaults?: NotificationCatalog | null;
}

type ProjectWizardCoreParams = {
	action: string;
	projectId: number | null;
	publication?: boolean;
	scrollToStartupTool?: boolean;
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
			scrollToStartupTool,
		} = params;
		const settings = this.getSettings();
		const isCreate = (action === TYPES_PROJECT_WIZARD_ACTION.CREATE || !action);
		const notificationDefaults = (
			isCreate && isValidNotificationCatalog(settings.notificationDefaults)
		)
			? settings.notificationDefaults
			: null;

		const optionsStoreProject = {
			projectId: projectId || null,
			publication,
			notifications: notificationDefaults,
		};
		const optionsStoreInterface = {
			...settings,
			action,
			scrollToStartupTool: scrollToStartupTool === true,
		};

		useProjectStore().init(optionsStoreProject);
		useInterfaceStore().init(optionsStoreInterface);
	}
}

export const Core = new CoreApplication();
