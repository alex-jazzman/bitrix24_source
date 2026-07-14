import { Type } from 'main.core';
import { useProjectStore } from 'socialnetwork.v2.model.project';

export class ResetAccessRights
{
	static execute(): void
	{
		const projectStore = useProjectStore();

		const defaultPermission = projectStore.defaultPermissions;

		if (Type.isNull(defaultPermission))
		{
			return;
		}

		projectStore.patchProject({
			permissions: structuredClone(defaultPermission),
		});
	}
}
