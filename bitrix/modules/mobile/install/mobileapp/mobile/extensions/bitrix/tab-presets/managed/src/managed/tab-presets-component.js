/**
 * @module tab-presets/managed/src/managed/tab-presets-component
 */
jn.define('tab-presets/managed/src/managed/tab-presets-component', (require, exports, module) => {
	const {
		changeCurrentPreset,
		deleteManagedPreset,
		getPresetGetDataRequestExecutor,
		getManagedPresetId,
		getSortedPresets,
		isManagedPresetId,
		removePresetFromCache,
		setCurrentPreset,
		setPortalDefaultInCache,
		setPortalDefaultPreset,
		updatePresetInCache,
	} = require('tab-presets/managed/src/managed/utils');
	const { Icon: AssetsIcon } = require('assets/icons');
	const { FloatingActionButton } = require('ui-system/form/buttons/floating-action-button');
	const { Alert } = require('alert');
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { showToast } = require('toast');
	const { Tourist } = require('tourist');
	const {
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsRole,
		PresetBottomMenuAnalyticsType,
	} = require('tab-presets');
	const { TabPresetsContent } = require('tab-presets/managed/src/managed/tab-presets-content');
	const {
		openPresetInfoScreen,
		openManagedPresetEditor,
		openStockPresetEditor,
		openRecipientPicker,
	} = require('tab-presets/managed/src/managed/tab-presets-navigation');

	const ITEM_KEY_MANUAL = 'manual';

	/**
	 * @extends {LayoutComponent<TabPresetsComponentProps, TabPresetsComponentState>}
	 */
	class TabPresetsComponent extends LayoutComponent
	{
		/**
		 * @param {TabPresetsComponentProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				shouldShowBanner: Tourist.firstTime('show_tab_presets_banner'),
				isLoading: true,
			};
			this.isMounted = false;
			this.openSectionAnalyticsSent = false;

			this.loadData(true);
		}

		/**
		 * @param {boolean} [useCache]
		 * @return {Promise<void | null>}
		 */
		loadData(useCache = false)
		{
			const executor = getPresetGetDataRequestExecutor();

			if (useCache)
			{
				executor.setCacheHandler((result) => {
					if (this.#isValidLoadResult(result))
					{
						this.updateState(result.data, true);
					}
				});
			}

			return executor
				.call(useCache)
				.then((result) => this.#handleLoadResult(result))
				.catch((error) => {
					this.#handleLoadError(error);

					return null;
				})
			;
		}

		/**
		 * @return {void}
		 */
		componentDidMount()
		{
			this.isMounted = true;
			this.setUserVisitedTabPresets();
			this.#actualizeCreateManagedPresetButton();
			this.#sendOpenSectionAnalytics(this.state.capabilities);
		}

		/**
		 * @return {void}
		 */
		componentDidUpdate()
		{
			this.#actualizeCreateManagedPresetButton();
		}

		/**
		 * @return {void}
		 */
		componentWillUnmount()
		{
			this.isMounted = false;
			this.createManagedPresetButton?.hide();
		}

		/**
		 * @return {TabPresetsContent}
		 */
		render()
		{
			return new TabPresetsContent({
				testId: this.testId,
				isLoading: this.state.isLoading,
				presets: this.state.presets,
				tabs: this.state.tabs,
				capabilities: this.state.capabilities,
				onOpenPresetInfo: (params) => this.openPresetInfoScreen(params),
				onOpenManagedPresetEditor: (preset) => this.openManagedPresetEditor(preset),
				onOpenStockPresetEditor: (preset) => this.openStockPresetEditor(preset),
				onInstallPreset: (presetId) => this.setPreset(presetId),
				onSetPortalDefaultPreset: (presetId) => this.setPortalDefaultPreset(presetId),
				onDeleteManagedPreset: (preset) => this.deleteManagedPreset(preset),
			});
		}

		/**
		 * @param {TabPresetsCapabilities | undefined} capabilities
		 * @return {void}
		 */
		#sendOpenSectionAnalytics(capabilities)
		{
			if (this.openSectionAnalyticsSent || capabilities?.managedTabPresetsEnabled !== true)
			{
				return;
			}

			this.openSectionAnalyticsSent = true;
			PresetBottomMenuAnalytics.send({
				event: PresetBottomMenuAnalyticsEvent.OPEN_SECTION,
				role: PresetBottomMenuAnalytics.getRole(capabilities),
			});
		}

		/**
		 * @return {void}
		 */
		#actualizeCreateManagedPresetButton()
		{
			if (!this.#canCreateManagedPreset())
			{
				this.createManagedPresetButton?.hide();

				return;
			}

			if (!this.createManagedPresetButton)
			{
				this.createManagedPresetButton = new FloatingActionButton({
					testId: `${this.testId}-fab-create-menu`,
					layout: this.props.parentWidget || PageManager,
					onClick: () => this.#handleCreateManagedPresetButtonClick(),
				});
			}

			this.createManagedPresetButton.show();
		}

		/**
		 * @return {boolean}
		 */
		#canCreateManagedPreset()
		{
			return this.state.capabilities?.canCreateManagedPreset === true;
		}

		/**
		 * @return {void}
		 */
		#handleCreateManagedPresetButtonClick()
		{
			if (this.state.capabilities?.isManagedPresetLimitReached === true)
			{
				showToast({
					message: (
						Loc.getMessage('TAB_PRESETS_MANAGED_CREATE_LIMIT_EXCEEDED')
						|| Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR')
					),
					icon: AssetsIcon.ALERT,
				}, this.props.parentWidget);

				return;
			}

			void this.openManagedPresetEditor();
		}

		/**
		 * @return {void}
		 */
		setUserVisitedTabPresets()
		{
			if (Tourist.firstTime('visited_tab_presets'))
			{
				Tourist.remember('visited_tab_presets')
					.then(() => {
						BX.postComponentEvent('onSetUserCounters', [
							{
								[String(env.siteId)]: { menu_tab_presets: 0 },
							},
						]);
					})
					.catch(console.error)
				;
			}
		}

		/**
		 * @param {TabPresetsLoadData} newState
		 * @param {boolean} [init]
		 * @return {void}
		 */
		updateState(newState, init = false)
		{
			if (!newState?.presets?.list || !newState?.tabs?.list)
			{
				throw new Error('Tab presets data has invalid structure');
			}

			const presets = newState.presets;
			if (init)
			{
				presets.list = getSortedPresets(presets.list, presets.current);
			}

			this.setState({
				presets,
				tabs: newState.tabs,
				capabilities: newState.capabilities ?? {},
				isLoading: false,
			});
			if (this.isMounted)
			{
				this.#sendOpenSectionAnalytics(newState.capabilities ?? {});
			}
		}

		/**
		 * @param {TabPresetsLoadResult} result
		 * @return {boolean}
		 */
		#isValidLoadResult(result)
		{
			return Boolean(result?.data?.presets?.list && result?.data?.tabs?.list);
		}

		/**
		 * @param {TabPresetsLoadResult} result
		 * @return {void}
		 */
		#handleLoadResult(result)
		{
			if (this.#isValidLoadResult(result))
			{
				this.updateState(result.data, true);

				return;
			}

			this.#handleLoadError(new Error('Tab presets data is empty'));
		}

		/**
		 * @param {unknown} error
		 * @return {void}
		 */
		#handleLoadError(error)
		{
			console.error(error);
			this.setState({ isLoading: false });
		}

		/**
		 * @param {TabPresetInfoParams} params
		 * @return {Promise<void>}
		 */
		async openPresetInfoScreen(params)
		{
			const { presetId } = params;

			await openPresetInfoScreen({
				...params,
				parentWidget: this.props.parentWidget,
				testId: this.testId,
				preset: this.state.presets?.list?.[presetId],
				tabs: this.state.tabs,
				onPresetSelected: () => this.setPreset(presetId),
			});
		}

		/**
		 * @param {TabPreset | null} [preset]
		 * @return {Promise<void>}
		 */
		async openManagedPresetEditor(preset = null)
		{
			await openManagedPresetEditor({
				parentWidget: this.props.parentWidget,
				preset,
				getEditorContext: () => ({
					tabs: this.state.tabs,
					capabilities: this.state.capabilities,
				}),
				onSave: (savedPreset) => this.onManagedPresetSaved(savedPreset),
				onInstallSelf: (presetId) => this.setPreset(presetId, null, {
					throwOnError: true,
					sendAnalytics: false,
					showFeedback: false,
				}),
				onSetMainTool: (presetId) => this.setPortalDefaultPreset(presetId, {
					throwOnError: true,
					sendAnalytics: false,
					showFeedback: false,
				}),
				onOpenRecipientPicker: (editablePreset) => this.openRecipientPicker(editablePreset),
			});
		}

		/**
		 * @param {TabPresetItem} preset
		 * @return {Promise<void>}
		 */
		async openStockPresetEditor(preset)
		{
			if (!preset)
			{
				return;
			}

			await openStockPresetEditor({
				parentWidget: this.props.parentWidget,
				preset,
				getEditorContext: () => ({
					tabs: this.state.tabs,
					capabilities: this.state.capabilities,
				}),
				onInstallSelf: (presetId, tabs) => this.setPreset(presetId, tabs, { throwOnError: true }),
				onSetMainTool: (presetId) => this.setPortalDefaultPreset(presetId, { throwOnError: true }),
				onOpenRecipientPicker: (editablePreset) => this.openRecipientPicker(editablePreset),
			});
		}

		/**
		 * @param {TabPreset | null} [preset]
		 * @return {void}
		 */
		openManagedPresetAssignments(preset = null)
		{
			if (preset)
			{
				void this.openRecipientPicker(preset);
			}
		}

		/**
		 * @param {TabPreset} preset
		 * @return {Promise<void>}
		 */
		async openRecipientPicker(preset)
		{
			await openRecipientPicker({
				parentWidget: this.props.parentWidget,
				preset,
				getEditorContext: () => ({
					capabilities: this.state.capabilities,
				}),
			});
		}

		/**
		 * @param {TabPreset} preset
		 * @return {void}
		 */
		deleteManagedPreset(preset)
		{
			Alert.confirm(
				Loc.getMessage('TAB_PRESETS_MANAGED_DELETE_CONFIRM_TITLE'),
				Loc.getMessage('TAB_PRESETS_MANAGED_DELETE_CONFIRM_DESCRIPTION'),
				[
					{
						text: Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_CLOSE'),
						onPress: () => {},
					},
					{
						text: Loc.getMessage('TAB_PRESETS_MANAGED_ACTION_DELETE'),
						onPress: () => this.deleteManagedPresetConfirmed(preset),
					},
				],
			);
		}

		/**
		 * @param {TabPreset} preset
		 * @return {void}
		 */
		deleteManagedPresetConfirmed(preset)
		{
			const presetId = String(preset?.key ?? '');
			const id = getManagedPresetId(presetId);
			if (id === null)
			{
				return;
			}

			Haptics.impactLight();
			void Notify.showIndicatorLoading();

			deleteManagedPreset(id)
				.then(() => {
					removePresetFromCache(presetId);

					return this.loadData(false);
				})
				.then(() => {
					PresetBottomMenuAnalytics.send({
						event: PresetBottomMenuAnalyticsEvent.DELETE_PRESET,
						type: PresetBottomMenuAnalyticsType.CUSTOM_MANAGER,
						role: PresetBottomMenuAnalyticsRole.MANAGER,
					});
					void Notify.showIndicatorSuccess({ hideAfter: 1000 });
					Haptics.notifySuccess();
				})
				.catch(() => {
					Haptics.notifyFailure();
					void Notify.showIndicatorError({
						hideAfter: 2000,
						text: Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR'),
					});
				})
			;
		}

		/**
		 * @param {TabPreset} preset
		 * @return {void}
		 */
		onManagedPresetSaved(preset)
		{
			if (!preset?.id || !this.state.presets || !this.state.tabs)
			{
				return;
			}

			const presetId = isManagedPresetId(preset.id) ? preset.id : `managed:${preset.id}`;
			updatePresetInCache(presetId, preset);
			this.updateState({
				presets: {
					...this.state.presets,
					list: {
						...this.state.presets.list,
						[presetId]: preset,
					},
				},
				tabs: this.state.tabs,
				capabilities: this.state.capabilities,
			});
			void this.loadData(false);
		}

		/**
		 * @param {string} presetId
		 * @param {SetPresetOptions} [options]
		 * @return {Promise<void>}
		 */
		setPortalDefaultPreset(presetId, options = {})
		{
			const { throwOnError = false, sendAnalytics = true, showFeedback = true } = options;
			if (showFeedback)
			{
				Haptics.impactLight();
				void Notify.showIndicatorLoading();
			}

			return setPortalDefaultPreset(presetId)
				.then(() => {
					setPortalDefaultInCache(presetId);

					return this.loadData(false);
				})
				.then(() => {
					if (sendAnalytics)
					{
						PresetBottomMenuAnalytics.send({
							event: PresetBottomMenuAnalyticsEvent.SET_DEFAULT_PRESET,
							type: PresetBottomMenuAnalyticsType.PORTAL_DEFAULT,
							role: PresetBottomMenuAnalyticsRole.ADMIN,
						});
					}
					if (showFeedback)
					{
						void Notify.showIndicatorSuccess({ hideAfter: 1000 });
						showToast({
							message: Loc.getMessage('TAB_PRESETS_MANAGED_PORTAL_DEFAULT_SAVED'),
							icon: AssetsIcon.CHECK,
						}, this.props.parentWidget);
					}
				})
				.catch((error) => {
					if (showFeedback)
					{
						Haptics.notifyFailure();
						void Notify.showIndicatorError({
							hideAfter: 2000,
							text: Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR'),
						});
					}
					if (throwOnError)
					{
						throw error;
					}
				})
			;
		}

		/**
		 * @param {string} presetId
		 * @return {void}
		 */
		onPresetSelected(presetId)
		{
			if (this.isPresetManual(presetId))
			{
				return;
			}

			if (this.isPresetSelected(presetId))
			{
				Haptics.notifyWarning();

				return;
			}

			Haptics.impactLight();
			Alert.confirm(
				Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_TITLE'),
				Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_DESCRIPTION'),
				[
					{
						text: Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_CLOSE'),
						onPress: () => {},
					},
					{
						text: Loc.getMessage('TAB_PRESETS_NEW_CONFIRM_ACCEPT'),
						onPress: () => this.setPreset(presetId),
					},
				],
			);
		}

		/**
		 * @param {string} presetId
		 * @param {Record<string, number> | null} [tabs]
		 * @param {SetPresetOptions} [options]
		 * @return {Promise<void>}
		 */
		setPreset(presetId, tabs = null, options = {})
		{
			const { throwOnError = false, sendAnalytics = true, showFeedback = true } = options;
			if (showFeedback)
			{
				Haptics.impactLight();
				void Notify.showIndicatorLoading();
			}

			return setCurrentPreset(presetId, tabs)
				.then(() => {
					const preset = this.state.presets?.list?.[presetId];
					changeCurrentPreset(presetId);

					if (this.state.presets && this.state.tabs)
					{
						this.updateState({
							presets: {
								...this.state.presets,
								current: presetId,
							},
							tabs: this.state.tabs,
							capabilities: this.state.capabilities,
						});
					}

					if (sendAnalytics)
					{
						PresetBottomMenuAnalytics.send({
							event: PresetBottomMenuAnalyticsEvent.CHANGE_PRESET,
							type: PresetBottomMenuAnalytics.getPresetType(presetId, preset),
							role: PresetBottomMenuAnalytics.getRole(this.state.capabilities ?? {}),
						});
					}

					if (showFeedback)
					{
						Haptics.notifySuccess();
						void Notify.showIndicatorSuccess({ hideAfter: 1000 });
					}

					setTimeout(() => Application.relogin(), 1500);
				})
				.catch((error) => {
					if (showFeedback)
					{
						Haptics.notifyFailure();
						void Notify.showIndicatorError({
							hideAfter: 2000,
							text: Loc.getMessage('TAB_PRESETS_NEW_APPLY_ERROR'),
						});
					}
					if (throwOnError)
					{
						throw error;
					}
				})
			;
		}

		/**
		 * @param {string} presetId
		 * @return {boolean}
		 */
		isPresetSelected(presetId)
		{
			return presetId === this.state.presets?.current;
		}

		/**
		 * @param {string} presetId
		 * @return {boolean}
		 */
		isPresetManual(presetId)
		{
			return presetId === ITEM_KEY_MANUAL;
		}

		/**
		 * @return {string}
		 */
		get testId()
		{
			return 'tab_presets';
		}
	}

	module.exports = { TabPresetsComponent };
});
