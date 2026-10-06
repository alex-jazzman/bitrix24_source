import { Type } from 'main.core';
import { Notifier } from 'ui.notification-manager';

import { ProjectErrorCode } from 'socialnetwork.v2.const';
import { useProjectStore, type ProjectModel } from 'socialnetwork.v2.model.project';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { projectService } from 'socialnetwork.v2.provider.services.project-service';

export class UpdateProjectFeature
{
	async update(): Promise<ProjectModel | null>
	{
		const projectStore = useProjectStore();
		const { invalid } = this.#validate(projectStore.$state);
		if (invalid)
		{
			return null;
		}

		const [error] = await projectService.update(projectStore.$state);
		if (error)
		{
			this.#setInvalidState(error);

			return null;
		}

		return projectStore.$state;
	}

	#setInvalidState(error: mixed = {}): void
	{
		if (Type.isPlainObject(error) && error?.code === ProjectErrorCode.GroupNameExist)
		{
			const interfaceStore = useInterfaceStore();
			interfaceStore.setValidation('title', { uniq: true });

			return;
		}

		if (Type.isPlainObject(error) && Type.isStringFilled(error?.message))
		{
			Notifier.notifyViaBrowserProvider({
				id: 'socialnetwork-project-wizard-update-error',
				text: error.message,
			});
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
