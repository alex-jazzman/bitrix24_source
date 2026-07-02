/**
 * @module layout/socialnetwork/project-v2/create/src/manager/project-create-edit-manager
 */
jn.define('layout/socialnetwork/project-v2/create/src/manager/project-create-edit-manager', (require, exports, module) => {
	const { Haptics } = require('haptics');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { isEqual } = require('utils/object');
	const { ProjectCreateApi } = require('layout/socialnetwork/project-v2/create/src/helpers/project-create-api');
	const { ProjectCreateBaseManager } = require('layout/socialnetwork/project-v2/create/src/manager/project-create-base-manager');
	const { ProjectCreateMode } = require('layout/socialnetwork/project-v2/create/src/enum/project-create-mode');
	const { ProjectCreateStage } = require('layout/socialnetwork/project-v2/create/src/enum/project-create-stage');
	const {
		buildProjectPayload,
		getCreatedProjectId,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-create-settings');

	class ProjectCreateEditManager extends ProjectCreateBaseManager
	{
		static getMode()
		{
			return ProjectCreateMode.EDIT;
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

		static getWidgetTitleType()
		{
			return 'entity';
		}

		static resolveStage()
		{
			return ProjectCreateStage.EDITING;
		}

		static getWidgetTitleText(stage, settings = {})
		{
			if (!stage.equal(ProjectCreateStage.EDITING))
			{
				return super.getWidgetTitleText(stage, settings);
			}

			const title = settings.name?.trim();

			return title || Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_EDIT_TITLE');
		}

		static shouldShowLoadingIndicator()
		{
			return true;
		}

		static getBackdrop(parentWidget)
		{
			if (parentWidget === PageManager)
			{
				return this.getPageManagerBackdrop();
			}

			return {
				bounceEnable: true,
				swipeAllowed: true,
				showOnTop: true,
				hideNavigationBar: false,
				horizontalSwipeAllowed: false,
				navigationBarColor: Color.bgPrimary.toHex(),
			};
		}

		static loadInitialSettings({ props })
		{
			return ProjectCreateApi.getEditSettings(Number(props.projectId ?? 0));
		}

		submitSettings()
		{
			if (this.#isSubmitPayloadUnchanged())
			{
				return Promise.resolve({
					data: {
						projectId: Number(this.props.projectId ?? 0),
					},
				});
			}

			return ProjectCreateApi.update(Number(this.props.projectId ?? 0), this.settings);
		}

		handleSubmitSuccess(response)
		{
			const projectId = getCreatedProjectId(response) || Number(this.props.projectId ?? 0);
			if (projectId <= 0)
			{
				return this.handleSubmitError(response);
			}

			Haptics.notifySuccess();
			void this.closeAfterSubmit(() => {
				BX.onCustomEvent('ProjectEdit:close', [{ id: projectId }]);
			});
			this.props.onUpdate?.(response);

			return true;
		}

		#isSubmitPayloadUnchanged()
		{
			return isEqual(
				buildProjectPayload(this.initialSettings, true),
				buildProjectPayload(this.settings, true),
			);
		}
	}

	module.exports = { ProjectCreateEditManager };
});
