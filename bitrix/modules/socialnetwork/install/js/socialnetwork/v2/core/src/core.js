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
	isTeamsAvailable: boolean;
	isExtranetConfigured: boolean;
	// Tools the create form may offer a switch for, named as the server names them.
	toggleableFeaturesOnCreate?: string[] | null;
	notificationDefaults?: NotificationCatalog | null;
}

type ProjectWizardCoreParams = {
	action: string;
	projectId: number | null;
	currentUser?: {
		id: number;
		name: string;
		image: { src: string } | null;
	} | null;
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
			currentUser,
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
			ownerId: isCreate ? (currentUser?.id ?? settings.currentUserId) : null,
			owner: isCreate && currentUser
				? {
					name: currentUser.name,
					image: currentUser.image,
				}
				: null,
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
