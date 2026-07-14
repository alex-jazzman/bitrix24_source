import { Type } from 'main.core';

import { ProjectErrorCode } from 'socialnetwork.v2.const';
import { useProjectStore, type ProjectModel } from 'socialnetwork.v2.model.project';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { projectService } from 'socialnetwork.v2.provider.services.project-service';

export class CopyProjectFeature
{
	async copy(): Promise<ProjectModel | null>
	{
		const projectStore = useProjectStore();
		const interfaceStore = useInterfaceStore();
		const { invalid } = this.#validate(projectStore.$state);
		if (invalid)
		{
			return null;
		}

		const dataCopyProject = {
			sourceProjectId: projectStore.$state.id,
			project: projectStore.$state,
			copyOptions: interfaceStore.copyOptions,
		};

		const [error, project] = await projectService.copy(dataCopyProject);
		if (error)
		{
			this.#setInvalidState(error);

			return null;
		}

		projectStore.patchProject(project);

		return project;
	}

	#setInvalidState(error: mixed = {}): void
	{
		if (Type.isPlainObject(error) && error?.code === ProjectErrorCode.GroupNameExist)
		{
			const interfaceStore = useInterfaceStore();
			interfaceStore.setValidation('title', { uniq: true });
		}
	}

	#validate(project: ProjectModel): { invalid: boolean }
	{
		const interfaceStore = useInterfaceStore();

		const isTitleInvalid = !Type.isStringFilled(project.title);
		interfaceStore.setValidation('title', { required: isTitleInvalid });

		return { invalid: isTitleInvalid };
	}
}
