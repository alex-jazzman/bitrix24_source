import { markRaw } from 'ui.vue3';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { Core } from 'socialnetwork.v2.core';
import { AccessRightsService, mapDtoToggleableFeatures } from 'socialnetwork.v2.provider.services.project-service';

/**
 * Legacy tools a project which does not exist yet may still be switched on in the wizard.
 * The server answers with the toggles of a project id, and a project being created has none,
 * so the portal answers for the create form in the settings of `socialnetwork.v2.core`. The
 * policy stays on the server alone: a tool this portal does not offer is not listed there, and
 * create would refuse its state anyway.
 */
function getToggleableFeaturesOnCreate(): string[]
{
	return mapDtoToggleableFeatures(Core.getSettings()?.toggleableFeaturesOnCreate);
}

export class GetDefaultData
{
	static async getDefaultData(): Promise<void>
	{
		const projectStore = useProjectStore();

		const defaultPermissions = await AccessRightsService.getDefaultPermissions();

		projectStore.patchProject({
			defaultPermissions: markRaw(defaultPermissions),
			// An existing project has been asked about its own toggles already — its answer stays.
			...(projectStore.id > 0 ? {} : { toggleableFeatures: getToggleableFeaturesOnCreate() }),
		});
	}
}
