/**
 * @module tab-presets/managed/editors/src/preset-managed/stock-preset-editor
 */
jn.define('tab-presets/managed/editors/src/preset-managed/stock-preset-editor', (require, exports, module) => {
	const { assignPreset, getApplyErrorMessage } = require('tab-presets/managed');
	const { Loc } = require('loc');
	const { isEqual } = require('utils/object');
	const { Notify } = require('notify');
	const { Haptics } = require('haptics');
	const {
		createManagedPresetFormState,
		getPresetTabsConfig,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-form-state');
	const {
		ManagedPresetMenuEditor,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-menu-editor');
	const {
		StockPresetEditorContent,
	} = require('tab-presets/managed/editors/src/preset-managed/stock-preset-editor-content');

	/**
	 * @extends {LayoutComponent<StockPresetEditorProps, StockPresetEditorState>}
	 */
	class StockPresetEditor extends LayoutComponent
	{
		/** @type {ManagedPresetMenuItem[]} */
		#inactiveItems = [];
		/** @type {ManagedPresetMenuItem[]} */
		#activeItems = [];

		/**
		 * @param {StockPresetEditorProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				configError: '',
				configureMode: false,
				selfAssign: false,
				mainTool: Boolean(props.preset?.isPortalDefault),
				selectedRecipients: this.#getInitialRecipients(props.preset),
				selectedRecipientTargets: this.#getInitialRecipientTargets(props.preset),
				recipientsChanged: false,
			};

			const { activeItems, inactiveItems } = createManagedPresetFormState({
				tabs: props.tabs,
				preset: props.preset,
			});
			this.#activeItems = activeItems;
			this.#inactiveItems = inactiveItems;
			/** @type {Record<string, number>} */
			this.initialConfig = getPresetTabsConfig(this.#activeItems);
		}

		render()
		{
			if (this.state.configureMode && this.#canConfigureMenu())
			{
				return new ManagedPresetMenuEditor({
					testId: this.testId,
					parentWidget: this.parentWidget,
					activeItems: this.#activeItems,
					inactiveItems: this.#inactiveItems,
					configError: this.state.configError,
					onChange: this.#onMenuItemsChange,
					onDone: this.#closeConfigureMode,
				});
			}

			return StockPresetEditorContent({
				testId: this.testId,
				preset: this.props.preset,
				configError: this.state.configError,
				mainTool: this.state.mainTool,
				mainToolLocked: this.props.preset?.isPortalDefault === true,
				selfAssign: this.state.selfAssign,
				selectedRecipients: this.state.selectedRecipients,
				activeItems: this.#activeItems,
				canConfigureMenu: this.#canConfigureMenu(),
				canSetMainTool: this.props.preset?.canSetMainTool === true,
				canSelfInstall: this.props.preset?.canSelfInstall === true,
				canAssign: this.props.preset?.isAssignable === true,
				onConfigure: this.#openConfigureMode,
				onMainToolChange: this.#onMainToolChange,
				onSelfAssignChange: this.#onSelfAssignChange,
				onOpenRecipientPicker: this.#openRecipientPicker,
				onSave: this.save,
			});
		}

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

		#openConfigureMode = () => {
			this.setState({ configureMode: true });
		};

		#closeConfigureMode = () => {
			this.setState({ configureMode: false });
		};

		/**
		 * @param {{ activeItems: ManagedPresetMenuItem[], inactiveItems: ManagedPresetMenuItem[] }} items
		 */
		#onMenuItemsChange = ({ activeItems, inactiveItems }) => {
			this.#activeItems = activeItems;
			this.#inactiveItems = inactiveItems;
			this.#clearConfigError();
		};

		#openRecipientPicker = () => {
			this.props.onOpenRecipientPicker?.({
				...this.props.preset,
				assignmentSelectorOptions: this.props.assignmentSelectorOptions,
				assignmentTabs: getPresetTabsConfig(this.#activeItems),
				selectedRecipients: this.state.selectedRecipients,
				onRecipientsSelected: this.#onRecipientsSelected,
			});
		};

		/**
		 * @param {StockPresetRecipientSelection} selection
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
		 * @returns {boolean}
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
		 * @returns {string[]}
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
			if (this.#activeItems.length === 0)
			{
				this.setState({
					configError: Loc.getMessage('TAB_PRESETS_MANAGED_EDITOR_EMPTY_CONFIG'),
				});

				return;
			}

			const presetId = this.props.preset?.key;
			const config = getPresetTabsConfig(this.#activeItems);
			const configChanged = !isEqual(config, this.initialConfig);
			/** @type {Array<() => void | Promise<unknown>>} */
			const operations = [];

			if (this.state.mainTool && this.props.preset?.canSetMainTool && !this.props.preset?.isPortalDefault)
			{
				operations.push(() => this.props.onSetMainTool?.(presetId));
			}

			if (this.state.selfAssign && this.props.preset?.canSelfInstall)
			{
				operations.push(() => this.props.onInstallSelf?.(presetId, config));
			}

			if (
				this.state.recipientsChanged
				|| (configChanged && this.state.selectedRecipientTargets.length > 0)
			)
			{
				operations.push(() => assignPreset(
					presetId,
					this.state.selectedRecipientTargets,
					config,
				));
			}

			if (operations.length === 0)
			{
				this.#close();

				return;
			}

			void Notify.showIndicatorLoading();
			/** @type {Promise<unknown>} */
			const initialPromise = Promise.resolve();
			operations
				.reduce((promise, operation) => promise.then(operation), initialPromise)
				.then(() => {
					void Notify.showIndicatorSuccess({ hideAfter: 1000 });
					Haptics.notifySuccess();
					this.#close();
				})
				.catch(this.#handleSaveError)
			;
		};

		/**
		 * @param {unknown} error
		 */
		#handleSaveError = (error) => {
			Haptics.notifyFailure();
			void Notify.showIndicatorError({
				hideAfter: 2000,
				text: getApplyErrorMessage(error),
			});
		};

		/**
		 * @param {StockPreset | undefined} preset
		 * @returns {StockPresetRecipient[]}
		 */
		#getInitialRecipients(preset)
		{
			return Array.isArray(preset?.assignmentRecipients) ? preset.assignmentRecipients : [];
		}

		/**
		 * @param {StockPreset | undefined} preset
		 * @returns {ManagedPresetRecipientTarget[]}
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

		#clearConfigError()
		{
			if (this.state.configError)
			{
				this.setState({ configError: '' });
			}
		}

		/** @returns {boolean} */
		handleBackButton()
		{
			if (this.state.configureMode && this.#canConfigureMenu())
			{
				this.#closeConfigureMode();

				return true;
			}

			return false;
		}

		/** @returns {boolean} */
		#canConfigureMenu()
		{
			return this.props.preset?.canConfigureMenu === true;
		}

		#close = () => {
			this.parentWidget.close();
		};

		/** @returns {TabPresetLayoutWidget} */
		get parentWidget()
		{
			return this.props.parentWidget;
		}

		/** @returns {string} */
		get testId()
		{
			return 'stock_preset_editor';
		}
	}

	module.exports = { StockPresetEditor };
});
