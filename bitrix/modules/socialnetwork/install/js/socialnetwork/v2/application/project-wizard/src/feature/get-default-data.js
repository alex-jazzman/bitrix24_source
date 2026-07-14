import { markRaw } from 'ui.vue3';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { AccessRightsService } from 'socialnetwork.v2.provider.services.project-service';

export class GetDefaultData
{
	static async getDefaultData(): Promise<void>
	{
		const projectStore = useProjectStore();

		const defaultPermissions = await AccessRightsService.getDefaultPermissions();

		projectStore.patchProject({ defaultPermissions: markRaw(defaultPermissions) });
	}
}
