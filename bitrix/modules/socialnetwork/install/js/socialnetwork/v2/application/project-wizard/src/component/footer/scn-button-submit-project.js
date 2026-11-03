import { Event } from 'main.core';
import { Notifier } from 'ui.notification-manager';
import { Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { mapState } from 'ui.vue3.pinia';

import { EventName, EntitySelectorEntity } from 'socialnetwork.v2.const';
import { CreateProjectFeature } from 'socialnetwork.v2.features.project.create-project-feature';
import { UpdateProjectFeature } from 'socialnetwork.v2.features.project.update-project-feature';
import { CopyProjectFeature } from 'socialnetwork.v2.features.project.copy-project-feature';
import { type ProjectModel, useProjectStore } from 'socialnetwork.v2.model.project';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { ProjectAnalytics } from 'socialnetwork.v2.lib.event-sender';

// @vue/component
export const ScnButtonSubmitProject = {
	name: 'ScnButtonSubmitProject',
	components: {
		UiButton,
	},
	setup(): Object
	{
		return {
			ButtonSize,
			tracker: new ProjectAnalytics(),
		};
	},
	data(): Object
	{
		return {
			fetching: false,
		};
	},
	computed: {
		...mapState(useInterfaceStore, [
			'isActionCopy',
			'isActionUpdate',
		]),
		title(): string
		{
			let title = '';

			if (this.isActionCopy)
			{
				title = this.loc('SONET_EXT_PROJECT_WIZARD_COPY_BUTTON');
			}
			else if (this.isActionUpdate)
			{
				title = this.loc('SONET_EXT_PROJECT_WIZARD_UPDATE_BUTTON');
			}
			else
			{
				title = this.loc('SONET_EXT_PROJECT_WIZARD_CREATE_BUTTON');
			}

			return title;
		},
	},
	methods: {
		async createProject()
		{
			const createProjectFeature = new CreateProjectFeature();
			const createdProject: ProjectModel | null = await createProjectFeature.create();

			this.trackCreateFinish(createdProject);

			if (createdProject)
			{
				Event.EventEmitter.emit(EventName.SaveProjectWizard, {
					id: createdProject.id,
					name: createdProject.title,
					chatId: createdProject.chatId,
				});
			}
		},
		trackCreateFinish(createdProject: ProjectModel | null): void
		{
			const projectStore = useProjectStore();
			const interfaceStore = useInterfaceStore();
			const members = projectStore.members ?? [];

			const defaultPermissions = projectStore.defaultPermissions;
			const permissions = projectStore.permissions;

			const normalizeProject = (project) => {
				if (!project)
				{
					return project;
				}

				const { messagesAutoDeleteDelay: _, ...rest } = project;

				return rest;
			};

			const permissionsWithoutDelay = { ...permissions, project: normalizeProject(permissions?.project) };
			const defaultPermissionsWithoutDelay = defaultPermissions
				? { ...defaultPermissions, project: normalizeProject(defaultPermissions?.project) }
				: null;

			const accessRightsState = defaultPermissionsWithoutDelay
				? (JSON.stringify(permissionsWithoutDelay) !== JSON.stringify(defaultPermissionsWithoutDelay) ? 1 : 0)
				: 0;

			const normalizeDelay = (delay) => (delay === '' || delay === null || delay === undefined ? 0 : Number(delay));
			const defaultDelay = normalizeDelay(defaultPermissions?.project?.messagesAutoDeleteDelay);
			const currentDelay = normalizeDelay(permissions?.project?.messagesAutoDeleteDelay);
			const additionalSettingsAutoDelete = currentDelay !== defaultDelay ? 1 : 0;

			const dates = projectStore.dates;
			const additionalSettingsCalendar = (dates?.startTs || dates?.finishTs) ? 1 : 0;

			this.tracker.trackCreateFinish(
				createdProject?.id ?? 0,
				createdProject ? 'success' : 'error',
				{
					ownerChange: projectStore.ownerId !== interfaceStore.currentUserId ? 1 : 0,
					moderators: (projectStore.moderators ?? []).length,
					participants: members.filter((m) => m.type === EntitySelectorEntity.User).length,
					departments: members.filter((m) => m.type === EntitySelectorEntity.Department).length,
					projectType: projectStore.privacyType === 'closed' ? 'closed' : 'open',
					mainTool: projectStore.baseFeatureId ?? '',
					accessRightsState,
					additionalSettingsCalendar,
					additionalSettingsAutoDelete,
				},
			);
		},
		async updateProject()
		{
			const updateProjectFeature = new UpdateProjectFeature();
			const updatedProject = await updateProjectFeature.update();

			if (updatedProject)
			{
				Notifier.notifyViaBrowserProvider({
					id: 'socialnetwork-project-wizard-project-updated',
					text: this.loc('SONET_EXT_PROJECT_WIZARD_UPDATED'),
				});
				Event.EventEmitter.emit(EventName.SaveProjectWizard, {
					id: updatedProject.id,
					name: updatedProject.title,
					chatId: updatedProject.chatId,
				});
			}
		},
		async copyProject()
		{
			const copyProjectFeature = new CopyProjectFeature();
			const copiedProject = await copyProjectFeature.copy();

			if (copiedProject)
			{
				Notifier.notifyViaBrowserProvider({
					id: 'socialnetwork-project-wizard-project-copied',
					text: this.loc('SONET_EXT_PROJECT_WIZARD_COPIED'),
				});
				Event.EventEmitter.emit(EventName.SaveProjectWizard, {
					id: copiedProject.id,
					name: copiedProject.title,
					chatId: copiedProject.chatId,
				});
			}
		},
		async submitProject()
		{
			if (this.fetching)
			{
				return;
			}

			this.fetching = true;

			if (this.isActionCopy)
			{
				await this.copyProject();
			}
			else if (this.isActionUpdate)
			{
				await this.updateProject();
			}
			else
			{
				await this.createProject();
			}

			this.fetching = false;
		},
		handleClickSubmit()
		{
			this.submitProject();
		},

	},
	template: `
		<UiButton
			:size="ButtonSize.LARGE"
			:text="title"
			:loading="fetching"
			:dataset="{ testid: 'socialnetwork-project-wizard-submit' }"
			@click="handleClickSubmit"
		/>
	`,
};
