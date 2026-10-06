/**
 * @module layout/socialnetwork/project-v2/create/src/manager/project-create-base-manager
 */
jn.define('layout/socialnetwork/project-v2/create/src/manager/project-create-base-manager', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { Notify } = require('notify');
	const { showErrorToast } = require('toast');
	const { ProjectOpener } = require('project/opener');
	const { requireLazy } = require('require-lazy');
	const { ProjectCreateIntro } = require('layout/socialnetwork/project-v2/create/src/view/intro');
	const { ProjectCreateEdit } = require('layout/socialnetwork/project-v2/create/src/view/edit');
	const { ProjectTrialFeatureActivation } = require('layout/socialnetwork/project-v2/create/src/view/trial-feature-activation');
	const { ProjectCreateMode } = require('layout/socialnetwork/project-v2/create/src/enum/project-create-mode');
	const { ProjectCreateStage } = require('layout/socialnetwork/project-v2/create/src/enum/project-create-stage');
	const {
		getNormalizedSettings,
		getSubmitErrorMessage,
		normalizeSettings,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-create-settings');
	const {
		createProjectSettingsCloseGuard,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-settings-close-guard');
	const {
		hasInvalidDateRange,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/settings-normalizer');

	class ProjectCreateBaseManager extends LayoutComponent
	{
		static getMode()
		{
			throw new Error('ProjectCreateBaseManager#getMode should be implemented in a subclass');
		}

		static getWidgetTitleType()
		{
			return 'section';
		}

		static resolveStage(props = {})
		{
			return props.stage === ProjectCreateStage.INTRO.getValue()
				? ProjectCreateStage.INTRO
				: ProjectCreateStage.EDITING;
		}

		static shouldShowLoadingIndicator()
		{
			return false;
		}

		static async loadInitialSettings()
		{
			return null;
		}

		static getBackdrop()
		{
			return null;
		}

		static getPageManagerBackdrop()
		{
			return {
				hideNavigationBar: false,
				mediumPositionPercent: 85,
				onlyMediumPosition: true,
				horizontalSwipeAllowed: false,
			};
		}

		static createOpenContext(props = {})
		{
			const userId = Number(props.userId ?? env.userId ?? 0);

			return {
				userId,
				settingsLoaded: props.settingsLoaded ?? Boolean(props.settings),
				settings: getNormalizedSettings(props.settings, userId),
			};
		}

		static async prepareOpenContext(props = {}, parentWidget = PageManager, stage = null)
		{
			const resolvedStage = stage ?? this.resolveStage(props);
			const openContext = {
				props,
				parentWidget,
				stage: resolvedStage,
				...this.createOpenContext(props),
			};

			try
			{
				return await this.loadInitialSettingsIfNeeded(openContext);
			}
			catch (error)
			{
				console.error(error);
				showErrorToast({
					message: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_LOAD_ERROR'),
				}, parentWidget === PageManager ? null : parentWidget);

				return null;
			}
		}

		static async loadInitialSettingsIfNeeded(openContext)
		{
			const {
				props,
				stage,
				userId,
			} = openContext;
			let {
				settingsLoaded,
				settings,
			} = openContext;

			if (settingsLoaded)
			{
				return openContext;
			}

			const shouldHideLoadingIndicator = !settingsLoaded && this.shouldShowLoadingIndicator(stage);

			try
			{
				if (shouldHideLoadingIndicator)
				{
					await Notify.showIndicatorLoading();
				}

				const loadedSettings = await this.loadInitialSettings({
					props,
					stage,
					settings,
					userId,
				});

				if (loadedSettings)
				{
					settings = normalizeSettings({
						...settings,
						...loadedSettings,
					});
					settingsLoaded = true;
				}
			}
			finally
			{
				if (shouldHideLoadingIndicator)
				{
					Notify.hideCurrentIndicator();
				}
			}

			return {
				...openContext,
				settings,
				settingsLoaded,
			};
		}

		static async openWithContext(openContext)
		{
			const {
				props,
				parentWidget,
				stage,
				userId,
				settings,
				settingsLoaded,
			} = openContext;
			const layoutWidget = await parentWidget.openWidget('layout', this.getOpenWidgetParams(parentWidget, stage, settings));
			const instance = new this({
				...props,
				userId,
				mode: this.getMode().getValue(),
				stage: stage.getValue(),
				settings,
				settingsLoaded,
				layoutWidget,
				parentWidget,
				rootLayoutWidget: props.rootLayoutWidget ?? layoutWidget,
			});

			layoutWidget.showComponent(instance);
			layoutWidget.enableNavigationBarBorder?.(false);
			this.setLeftButtons(layoutWidget, () => instance.requestClose());

			return instance;
		}

		static getOpenWidgetParams(parentWidget, stage, settings)
		{
			const openWidgetParams = {
				backgroundColor: Color.bgPrimary.toHex(),
				titleParams: this.getWidgetTitleParams(stage, settings),
			};
			const backdrop = this.getBackdrop(parentWidget);
			if (backdrop)
			{
				openWidgetParams.backdrop = backdrop;
			}

			return openWidgetParams;
		}

		static getInitialInstanceSettings(props)
		{
			const userId = Number(props.userId ?? env.userId ?? 0);

			return getNormalizedSettings(props.settings, userId);
		}

		static setLeftButtons(layoutWidget, onClose = null)
		{
			layoutWidget?.setLeftButtons([
				{
					type: 'back',
					callback: () => {
						if (onClose)
						{
							onClose();

							return;
						}

						layoutWidget.close();
					},
				},
			]);
		}

		static getWidgetTitleParams(stage, settings = {})
		{
			return {
				text: this.getWidgetTitleText(stage, settings),
				type: this.getWidgetTitleType(),
			};
		}

		static getWidgetTitleText(stage, settings = {})
		{
			return Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TITLE');
		}

		constructor(props)
		{
			super(props);

			this.settings = this.constructor.getInitialInstanceSettings(props);
			this.initialSettings = normalizeSettings(this.settings);
			this.isSettingsLoaded = props.settingsLoaded === true;
			this.settingsLoadPromise = null;
			this.currentStepInstance = null;
			this.closeGuard = null;
		}

		componentDidMount()
		{
			if (this.props.stage !== ProjectCreateStage.EDITING.getValue())
			{
				return;
			}

			this.closeGuard = createProjectSettingsCloseGuard({
				layoutWidget: this.props.layoutWidget,
				initialFields: this.initialSettings,
				getCurrentFields: () => this.settings,
				normalizeFields: normalizeSettings,
				onSaveAndClose: () => this.submit(),
				onDiscardAndClose: () => this.closeWidget(this.props.layoutWidget),
			});
		}

		getMode()
		{
			return this.constructor.getMode();
		}

		isEditMode()
		{
			return this.getMode().equal(ProjectCreateMode.EDIT);
		}

		render()
		{
			if (this.props.stage === ProjectCreateStage.INTRO.getValue())
			{
				return ProjectCreateIntro({
					onContinue: this.openEditStage,
				});
			}

			this.currentStepInstance = ProjectCreateEdit({
				...this.settings,
				projectId: this.props.projectId,
				isLegacyProject: this.settings.isLegacyProject === true,
				layoutWidget: this.props.layoutWidget,
				rootLayoutWidget: this.props.layoutWidget,
				autoDeleteEnabledInPortalSettings: this.settings.autoDeleteEnabledInPortalSettings,
				showKnowledgeBasePermissions: this.isEditMode(),
				selectorParentWidget: this.props.parentWidget === PageManager
					? this.props.layoutWidget
					: this.props.parentWidget,
				submitButtonText: this.isEditMode()
					? Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_SAVE_BUTTON')
					: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_CREATE_BUTTON'),
				onChange: this.onSettingsChange,
				onSubmitButtonClick: this.onSubmitButtonClick,
			});

			return this.currentStepInstance;
		}

		openEditStage = async () => {
			const isLoaded = await this.ensureSettingsLoaded();
			if (!isLoaded)
			{
				return;
			}

			void this.constructor.open({
				...this.props,
				stage: ProjectCreateStage.EDITING.getValue(),
				settings: this.settings,
				settingsLoaded: this.isSettingsLoaded,
				rootLayoutWidget: this.props.rootLayoutWidget,
			}, this.props.layoutWidget);
		};

		onSettingsChange = (settings) => {
			this.settings = normalizeSettings({
				...this.settings,
				...settings,
			});

			this.syncWidgetTitle();
			this.closeGuard?.update();
		};

		onSubmitButtonClick = async (disablePending) => {
			const success = await this.submit();
			if (!success)
			{
				disablePending?.();
			}
		};

		async ensureSettingsLoaded()
		{
			if (this.isSettingsLoaded)
			{
				return true;
			}

			this.settingsLoadPromise ??= this.loadDeferredSettings();

			try
			{
				const loadedSettings = await this.settingsLoadPromise;
				if (loadedSettings)
				{
					this.settings = normalizeSettings({
						...this.settings,
						...loadedSettings,
					});
					this.initialSettings = normalizeSettings(this.settings);
					this.isSettingsLoaded = true;
				}

				return true;
			}
			catch (error)
			{
				console.error(error);
				this.settingsLoadPromise = null;
				showErrorToast({
					message: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_LOAD_ERROR'),
				}, this.props.layoutWidget);

				return false;
			}
		}

		loadDeferredSettings()
		{
			return Promise.resolve(null);
		}

		syncWidgetTitle()
		{
			this.props.layoutWidget?.setTitle(
				this.constructor.getWidgetTitleParams(
					this.constructor.resolveStage(this.props),
					this.settings,
				),
			);
		}

		async submit()
		{
			if (!this.validateSettingsBeforeSubmit())
			{
				return false;
			}

			let success = false;
			this.closeGuard?.allowClose();
			void Notify.showIndicatorLoading();

			try
			{
				const response = await this.submitSettings();

				success = this.handleSubmitSuccess(response);

				return success;
			}
			catch (response)
			{
				success = this.handleSubmitError(response);

				return success;
			}
			finally
			{
				if (!success)
				{
					this.closeGuard?.update();
				}

				Notify.hideCurrentIndicator();
			}
		}

		validateSettingsBeforeSubmit()
		{
			if (this.settings.name.trim() === '')
			{
				showErrorToast({
					message: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_ERROR_NO_TITLE'),
				}, this.props.layoutWidget);

				return false;
			}

			if (hasInvalidDateRange(this.settings))
			{
				showErrorToast({
					message: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_ERROR_INVALID_DATE_RANGE'),
				}, this.props.layoutWidget);

				return false;
			}

			return true;
		}

		submitSettings()
		{
			throw new Error('ProjectCreateBaseManager#submitSettings should be implemented in a subclass');
		}

		handleSubmitSuccess()
		{
			throw new Error('ProjectCreateBaseManager#handleSubmitSuccess should be implemented in a subclass');
		}

		handleSubmitError(response)
		{
			this.showSubmitError(response);

			return false;
		}

		showSubmitError(response)
		{
			showErrorToast({
				message: getSubmitErrorMessage(response, this.getMode()),
			}, this.props.layoutWidget);
		}

		async openCreatedEntity(projectId, chatId = 0, showTrial = false)
		{
			const chatWasOpened = await this.openCreatedProjectChat(chatId);
			if (!chatWasOpened)
			{
				await this.openCreatedProject(projectId, showTrial);

				return;
			}

			if (showTrial)
			{
				ProjectTrialFeatureActivation.open();
			}
		}

		async openCreatedProjectChat(chatId)
		{
			if (chatId <= 0)
			{
				return false;
			}

			try
			{
				const { openNestedNavigation } = await requireLazy('im:messenger/api/navigation');

				await openNestedNavigation(chatId);

				return true;
			}
			catch (error)
			{
				console.error(error);

				return false;
			}
		}

		async openCreatedProject(projectId, showTrial = false)
		{
			try
			{
				await ProjectOpener.open({
					item: {
						id: projectId,
						title: this.settings.name.trim() ?? '',
					},
					projectId,
					siteId: env.siteId,
					siteDir: env.siteDir,
					currentUserId: Number(this.props.userId ?? env.userId ?? 0),
				});
			}
			catch (error)
			{
				console.error(error);

				return;
			}

			if (showTrial)
			{
				ProjectTrialFeatureActivation.open();
			}
		}

		closeAfterSubmit(closeCallback)
		{
			this.closeWidget(this.props.layoutWidget, () => {
				void closeCallback?.();
			});
		}

		closeWidget(widget, callback = null)
		{
			if (!widget)
			{
				void callback?.();

				return;
			}

			widget.close(() => {
				void callback?.();
			});
		}

		requestClose = () => {
			if (this.closeGuard)
			{
				this.closeGuard.handleCloseRequest();

				return;
			}

			this.closeWidget(this.props.layoutWidget);
		};
	}

	module.exports = { ProjectCreateBaseManager };
});
