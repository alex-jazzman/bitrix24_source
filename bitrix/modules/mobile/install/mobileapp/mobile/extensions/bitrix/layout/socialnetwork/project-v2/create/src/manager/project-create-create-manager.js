/**
 * @module layout/socialnetwork/project-v2/create/src/manager/project-create-create-manager
 */
jn.define('layout/socialnetwork/project-v2/create/src/manager/project-create-create-manager', (require, exports, module) => {
	const { Haptics } = require('haptics');
	const { ProjectCreateApi } = require('layout/socialnetwork/project-v2/create/src/helpers/project-create-api');
	const { ProjectCreateBaseManager } = require('layout/socialnetwork/project-v2/create/src/manager/project-create-base-manager');
	const { ProjectCreateMode } = require('layout/socialnetwork/project-v2/create/src/enum/project-create-mode');
	const { ProjectCreateStage } = require('layout/socialnetwork/project-v2/create/src/enum/project-create-stage');
	const {
		getCreatedProjectId,
		getCreatedProjectChatId,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-create-settings');

	class ProjectCreateCreateManager extends ProjectCreateBaseManager
	{
		static getMode()
		{
			return ProjectCreateMode.CREATE;
		}

		static async open(props = {}, parentWidget = PageManager)
		{
			const stage = this.resolveStage(props);
			const openContext = await this.prepareOpenContext(props, parentWidget, stage);
			if (!openContext)
			{
				return null;
			}

			return this.openWithContext(openContext);
		}

		static resolveStage(props = {})
		{
			return props.stage === ProjectCreateStage.EDITING.getValue()
				? ProjectCreateStage.EDITING
				: ProjectCreateStage.INTRO;
		}

		static getBackdrop(parentWidget)
		{
			if (parentWidget === PageManager)
			{
				return this.getPageManagerBackdrop();
			}

			return null;
		}

		static async loadInitialSettings({ stage })
		{
			if (!stage.equal(ProjectCreateStage.EDITING))
			{
				return null;
			}

			return ProjectCreateApi.getCreateSettings();
		}

		loadDeferredSettings()
		{
			return ProjectCreateApi.getCreateSettings();
		}

		submitSettings()
		{
			return ProjectCreateApi.create(this.settings);
		}

		handleSubmitSuccess(response)
		{
			const projectId = getCreatedProjectId(response);
			if (projectId <= 0)
			{
				return this.handleSubmitError(response);
			}

			Haptics.notifySuccess();
			void this.closeAfterSubmit(() => this.openCreatedEntity(
				projectId,
				getCreatedProjectChatId(response),
				response?.data?.isTrialTurnedOn === true,
			));
			this.props.onCreate?.(response);

			return true;
		}
	}

	module.exports = { ProjectCreateCreateManager };
});
