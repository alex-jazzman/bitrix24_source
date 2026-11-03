/**
 * @module tab-presets/managed/editors/src/preset-managed/managed-preset-editor
 */
jn.define('tab-presets/managed/editors/src/preset-managed/managed-preset-editor', (require, exports, module) => {
	const {
		assignPreset,
		getApplyErrorMessage,
		isManagedPresetId,
		isRecipientNotAllowedError,
		saveManagedPreset,
		updatePresetInCache,
	} = require('tab-presets/managed');
	const { Loc } = require('loc');
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const {
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsRole,
		PresetBottomMenuAnalyticsType,
	} = require('tab-presets');
	const {
		createManagedPresetFormState,
		getManagedPresetId,
		getPresetTabsConfig,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-form-state');
	const {
		createManagedPresetPostSaveOperations,
		ManagedPresetPostSaveOperationType,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-post-save-operations');
	const {
		ManagedPresetEditorContent,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-editor-content');
	const {
		ManagedPresetMenuEditor,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-menu-editor');

	/**
	 * @extends {LayoutComponent<ManagedPresetEditorProps, ManagedPresetEditorState>}
	 */
	class ManagedPresetEditor extends LayoutComponent
	{
		/** @type {ManagedPresetMenuItem[]} */
		#inactiveItems = [];
		/** @type {ManagedPresetMenuItem[]} */
		#activeItems = [];

		/**
		 * @param {ManagedPresetEditorProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				title: props.preset?.title ?? '',
				titleError: '',
				configError: '',
				configureMode: false,
				selfAssign: false,
				mainTool: Boolean(props.preset?.isPortalDefault),
				selectedRecipients: this.#getInitialRecipients(props.preset),
				selectedRecipientTargets: this.#getInitialRecipientTargets(props.preset),
				recipientsChanged: false,
			};

			this.parseTabs(props.tabs, props.preset);
		}

		/**
		 * @param {ManagedPresetFormTabs | undefined} tabs
		 * @param {ManagedPresetEditorPreset | null | undefined} preset
		 */
		parseTabs(tabs, preset)
		{
			const { activeItems, inactiveItems } = createManagedPresetFormState({ tabs, preset });

			this.#activeItems = activeItems;
			this.#inactiveItems = inactiveItems;
		}

		render()
		{
			if (this.state.configureMode)
			{
				return new ManagedPresetMenuEditor({
					testId: this.testId,
					parentWidget: this.parentWidget,
					activeItems: this.#activeItems,
					inactiveItems: this.#inactiveItems,
					configError: this.state.configError,
					onChange: this.#onMenuItemsChanged,
					onDone: this.#closeConfigureMode,
				});
			}

			return ManagedPresetEditorContent({
				testId: this.testId,
				title: this.state.title,
				titleError: this.state.titleError,
				configError: this.state.configError,
				mainTool: this.state.mainTool,
				mainToolLocked: this.props.preset?.isPortalDefault === true,
				selfAssign: this.state.selfAssign,
				selectedRecipients: this.state.selectedRecipients,
				activeItems: this.#activeItems,
				canSetMainTool: this.#canSetMainTool(),
				canAssign: this.#canAssign(),
				onTitleChange: this.#onTitleChange,
				onConfigure: this.#openConfigureMode,
				onMainToolChange: this.#onMainToolChange,
				onSelfAssignChange: this.#onSelfAssignChange,
				onOpenRecipientPicker: this.#openRecipientPicker,
				onSave: this.save,
			});
		}

		/**
		 * @param {string} title
		 */
		#onTitleChange = (title) => {
			this.setState({ title, titleError: '' });
		};

		#openConfigureMode = () => {
			this.setState({ configureMode: true });
		};

		#closeConfigureMode = () => {
			this.setState({ configureMode: false });
		};

		/**
		 * @param {boolean} mainTool
		 */
		#onMainToolChange = (mainTool) => {
			this.setState({ mainTool });
		};

		/**
		 * @param {boolean} selfAssign
		 */
		#onSelfAssignChange = (selfAssign) => {
			this.setState({ selfAssign });
		};

		/**
		 * @param {{ activeItems: ManagedPresetMenuItem[], inactiveItems: ManagedPresetMenuItem[] }} items
		 */
		#onMenuItemsChanged = ({ activeItems, inactiveItems }) => {
			this.#activeItems = activeItems;
			this.#inactiveItems = inactiveItems;

			if (this.state.configError)
			{
				this.setState({ configError: '' });
			}
		};

		#openRecipientPicker = () => {
			if (!this.#canAssign())
			{
				return;
			}

			this.props.onOpenRecipientPicker?.({
				...this.props.preset,
				assignmentSelectorOptions: this.props.assignmentSelectorOptions,
				assignmentTabs: getPresetTabsConfig(this.#activeItems),
				selectedRecipients: this.state.selectedRecipients,
				onRecipientsSelected: this.#onRecipientsSelected,
			});
		};

		/**
		 * @param {ManagedPresetRecipientSelection} selection
		 */
		#onRecipientsSelected = ({ recipients = [], items = [] }) => {
			this.setState({
				selectedRecipients: items,
				selectedRecipientTargets: recipients,
				recipientsChanged: this.#areRecipientTargetsChanged(recipients),
			});
		};

		/**
		 * @param {ManagedPresetRecipientTarget[]} recipients
		 * @return {boolean}
		 */
		#areRecipientTargetsChanged(recipients)
		{
			const currentKeys = this.#getRecipientTargetKeys(recipients);
			const initialKeys = this.#getRecipientTargetKeys(this.#getInitialRecipientTargets(this.props.preset));

			if (currentKeys.length !== initialKeys.length)
			{
				return true;
			}

			return currentKeys.some((key, index) => key !== initialKeys[index]);
		}

		/**
		 * @param {unknown} recipients
		 * @return {string[]}
		 */
		#getRecipientTargetKeys(recipients)
		{
			if (!Array.isArray(recipients))
			{
				return [];
			}

			return recipients
				.map((recipient) => {
					const type = String(recipient?.type ?? '');
					const id = Number(recipient?.id ?? 0);
					const scope = String(recipient?.scope ?? '');

					return `${type}:${id}:${scope}`;
				})
				.sort()
			;
		}

		save = () => {
			const title = this.state.title.trim();
			if (title === '')
			{
				this.setState({
					titleError: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_TITLE_REQUIRED'),
				});

				return;
			}

			if (this.#activeItems.length === 0)
			{
				this.setState({
					configError: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_EMPTY_CONFIG'),
				});

				return;
			}

			void Notify.showIndicatorLoading();
			const saveAnalyticsTarget = PresetBottomMenuAnalytics.getTargetType({
				recipients: this.state.selectedRecipientTargets,
				selfAssign: this.state.selfAssign,
			});
			let presetSaved = false;

			saveManagedPreset({
				id: getManagedPresetId(this.props.preset),
				title,
				tabs: getPresetTabsConfig(this.#activeItems),
			})
				.then((result) => {
					const preset = result?.data?.preset;
					const presetId = this.#getPresetKey(preset);
					if (presetId)
					{
						presetSaved = true;
						updatePresetInCache(presetId, preset);

						const operations = createManagedPresetPostSaveOperations({
							presetId,
							tabs: getPresetTabsConfig(this.#activeItems),
							mainTool: this.state.mainTool,
							canSetMainTool: this.#canSetMainTool(),
							isPortalDefault: this.props.preset?.isPortalDefault === true,
							selfAssign: this.state.selfAssign,
							canAssign: this.#canAssign(),
							recipientsChanged: this.state.recipientsChanged,
							selectedRecipientTargets: this.state.selectedRecipientTargets,
						});

						return this.#executeSaveOperations(operations).then((failedOperations) => ({
							preset,
							failedOperations,
						}));
					}

					throw result;
				})
				.then(({ preset, failedOperations }) => {
					PresetBottomMenuAnalytics.send({
						event: PresetBottomMenuAnalyticsEvent.SAVE_PRESET,
						type: PresetBottomMenuAnalyticsType.CUSTOM_MANAGER,
						role: PresetBottomMenuAnalyticsRole.MANAGER,
						target: saveAnalyticsTarget,
					});
					this.props.onSave?.(preset);

					if (failedOperations.length > 0)
					{
						void Notify.showIndicatorError({
							hideAfter: 3000,
							text: this.#getPartialSaveErrorMessage(failedOperations),
						});
						Haptics.notifyFailure();
						this.#close();

						return;
					}

					void Notify.showIndicatorSuccess({ hideAfter: 1000 });
					Haptics.notifySuccess();
					this.#close();
				})
				.catch((error) => {
					void Notify.showIndicatorError({
						hideAfter: presetSaved ? 3000 : 2000,
						text: presetSaved
							? Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_PARTIAL_SAVE_ERROR')
							: getApplyErrorMessage(error)
						,
					});
					Haptics.notifyFailure();
					if (presetSaved)
					{
						this.#close();
					}
				})
			;
		};

		/**
		 * @param {ManagedPresetPostSaveOperation[]} operations
		 * @return {Promise<ManagedPresetFailedPostSaveOperation[]>}
		 */
		async #executeSaveOperations(operations)
		{
			/** @type {ManagedPresetFailedPostSaveOperation[]} */
			const failedOperations = [];
			for (const operation of operations)
			{
				try
				{
					await this.#executeSaveOperation(operation);
				}
				catch (error)
				{
					console.error(error);
					failedOperations.push({
						type: operation.type,
						error,
					});
				}
			}

			return failedOperations;
		}

		/**
		 * @param {ManagedPresetFailedPostSaveOperation[]} failedOperations
		 * @return {string}
		 */
		#getPartialSaveErrorMessage(failedOperations)
		{
			if (failedOperations.length !== 1)
			{
				return Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_PARTIAL_SAVE_ERROR');
			}

			const [{ type, error }] = failedOperations;
			switch (type)
			{
				case ManagedPresetPostSaveOperationType.SET_MAIN_TOOL:
					return Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_PARTIAL_SET_MAIN_TOOL_ERROR');

				case ManagedPresetPostSaveOperationType.INSTALL_SELF:
					return Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_PARTIAL_INSTALL_SELF_ERROR');

				case ManagedPresetPostSaveOperationType.ASSIGN_RECIPIENTS:
					if (isRecipientNotAllowedError(error))
					{
						return Loc.getMessage(
							'TAB_PRESETS_MANAGED_EDITOR_PARTIAL_ASSIGN_RECIPIENT_NOT_ALLOWED_ERROR',
						);
					}

					return Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_PARTIAL_ASSIGN_ERROR');

				default:
					return Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_PARTIAL_SAVE_ERROR');
			}
		}

		/**
		 * @param {ManagedPresetPostSaveOperation} operation
		 * @return {void | Promise<unknown> | null}
		 */
		#executeSaveOperation(operation)
		{
			switch (operation.type)
			{
				case ManagedPresetPostSaveOperationType.SET_MAIN_TOOL:
					return this.props.onSetMainTool?.(operation.presetId);

				case ManagedPresetPostSaveOperationType.INSTALL_SELF:
					return this.props.onInstallSelf?.(operation.presetId);

				case ManagedPresetPostSaveOperationType.ASSIGN_RECIPIENTS:
					return assignPreset(
						operation.presetId,
						operation.recipients,
						operation.tabs,
					);

				default:
					return null;
			}
		}

		/**
		 * @param {ManagedPresetEditorPreset | undefined} preset
		 * @return {string | null}
		 */
		#getPresetKey(preset)
		{
			const presetId = preset?.id;
			if (!presetId)
			{
				return null;
			}

			return isManagedPresetId(presetId) ? presetId : `managed:${presetId}`;
		}

		/**
		 * @param {ManagedPresetEditorPreset | null | undefined} preset
		 * @return {ManagedPresetDisplayRecipient[]}
		 */
		#getInitialRecipients(preset)
		{
			return Array.isArray(preset?.assignmentRecipients) ? preset.assignmentRecipients : [];
		}

		/**
		 * @param {ManagedPresetEditorPreset | null | undefined} preset
		 * @return {ManagedPresetRecipientTarget[]}
		 */
		#getInitialRecipientTargets(preset)
		{
			return this.#getInitialRecipients(preset)
				.map(({ type, id, scope }) => ({
					type,
					id,
					scope,
				}))
				.filter(({ type, id }) => type && id > 0)
			;
		}

		/** @return {boolean} */
		#canSetMainTool()
		{
			return Boolean(this.props.canSetMainTool || this.props.preset?.canSetMainTool);
		}

		/** @return {boolean} */
		#canAssign()
		{
			return this.props.canAssign === true || this.props.preset?.canAssign === true;
		}

		/** @return {boolean} */
		handleBackButton()
		{
			if (this.state.configureMode)
			{
				this.setState({ configureMode: false });

				return true;
			}

			return false;
		}

		#close = () => {
			this.parentWidget.close();
		};

		/** @return {TabPresetLayoutWidget} */
		get parentWidget()
		{
			return this.props.parentWidget;
		}

		/** @return {string} */
		get testId()
		{
			return 'managed_preset_editor';
		}
	}

	module.exports = { ManagedPresetEditor };
});
