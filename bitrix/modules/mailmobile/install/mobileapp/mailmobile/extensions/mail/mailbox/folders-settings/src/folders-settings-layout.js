/**
 * @module mail/mailbox/folders-settings/src/folders-settings-layout
 */
jn.define('mail/mailbox/folders-settings/src/folders-settings-layout', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Component, Indent } = require('tokens');
	const { Notify } = require('notify');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { Selector: FolderSelector } = require('mail/folder/selector');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { DialogFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Text3 } = require('ui-system/typography/text');
	const { FoldersSettingsService } = require('mail/mailbox/folders-settings/src/folders-settings-service');
	const { FoldersSettingsTree } = require('mail/mailbox/folders-settings/src/folders-tree');
	const { SyncFoldersList } = require('mail/mailbox/folders-settings/src/sync-folders-list');
	const { FoldersAssignments } = require('mail/mailbox/folders-settings/src/folders-assignments');

	class FoldersSettingsLayout extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.service = new FoldersSettingsService();
			this.tree = new FoldersSettingsTree();

			this.state = {
				loading: true,
				saving: false,
				loadError: false,
				loadErrorMessage: '',
				folders: [],
				assignments: {
					outcome: null,
					trash: null,
					spam: null,
				},
				maxLevel: 0,
				footerHeight: 0,
			};

			this.saveSettings = this.saveSettings.bind(this);
			this.handleFooterHeightChange = this.handleFooterHeightChange.bind(this);
			this.handleSelectAllPress = this.handleSelectAllPress.bind(this);
			this.handleFolderRowPress = this.handleFolderRowPress.bind(this);
			this.handleFolderExpandPress = this.handleFolderExpandPress.bind(this);
			this.openOutcomeSelector = this.openOutcomeSelector.bind(this);
			this.openTrashSelector = this.openTrashSelector.bind(this);
			this.openSpamSelector = this.openSpamSelector.bind(this);
		}

		componentDidMount()
		{
			this.loadData();
		}

		render()
		{
			if (this.state.loading)
			{
				return this.renderLoading();
			}

			if (this.state.loadError)
			{
				return this.renderLoadError();
			}

			return View(
				{
					testId: 'mailbox-folders-settings',
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				ScrollView(
					{
						style: {
							flex: 1,
						},
					},
					View(
						{
							style: {
								paddingBottom: this.state.footerHeight + Indent.XL.toNumber(),
							},
						},
						this.renderContent(),
					),
				),
				this.renderFooter(),
			);
		}

		renderLoading()
		{
			return View(
				{
					testId: 'mailbox-folders-settings-loading',
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Loader({
					style: {
						width: 50,
						height: 50,
					},
					tintColor: Color.accentMainPrimary.toHex(),
					animating: true,
					size: 'large',
				}),
			);
		}

		renderContent()
		{
			const sections = [
				{
					testId: 'mailbox-folders-settings-sync-area',
					title: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_SYNC_TITLE'),
					content: new SyncFoldersList({
						folders: this.state.folders,
						maxLevel: this.state.maxLevel,
						onSelectAllPress: this.handleSelectAllPress,
						onFolderRowPress: this.handleFolderRowPress,
						onFolderExpandPress: this.handleFolderExpandPress,
					}),
				},
				{
					testId: 'mailbox-folders-settings-assign-area',
					title: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_ASSIGN_TITLE'),
					content: new FoldersAssignments({
						outcomeLabel: this.getAssignmentLabel('outcome'),
						trashLabel: this.getAssignmentLabel('trash'),
						spamLabel: this.getAssignmentLabel('spam'),
						onOutcomePress: this.openOutcomeSelector,
						onTrashPress: this.openTrashSelector,
						onSpamPress: this.openSpamSelector,
					}),
				},
			];

			return AreaList(
				{
					testId: 'mailbox-folders-settings-area-list',
					withScroll: false,
				},
				...sections.flatMap((section, index) => {
					const sectionArea = Area(
						{
							testId: section.testId,
							title: section.title,
							isFirst: index === 0,
							divider: false,
						},
						section.content,
					);

					if (index === sections.length - 1)
					{
						return [sectionArea];
					}

					return [
						sectionArea,
						View(
							{
								testId: `${section.testId}-divider-wrap`,
								style: {
									marginLeft: Component.areaPaddingLr.toNumber(),
									marginRight: Component.areaPaddingLr.toNumber(),
								},
							},
							this.renderSectionDivider(`${section.testId}-divider`),
						),
					];
				}),
			);
		}

		renderSectionDivider(testId)
		{
			return View({
				testId,
				style: {
					height: 1,
					backgroundColor: Color.bgSeparatorPrimary.toHex(),
				},
			});
		}

		renderFooter()
		{
			return DialogFooter(
				{
					testId: 'mailbox-folders-settings-footer',
					onLayoutFooterHeight: this.handleFooterHeightChange,
				},
				Button({
					testId: 'mailbox-folders-settings-save-button',
					text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_SAVE_BUTTON'),
					size: ButtonSize.XL,
					design: ButtonDesign.FILLED,
					stretched: true,
					disabled: this.state.saving || this.state.loadError,
					loading: this.state.saving,
					onClick: this.saveSettings,
				}),
			);
		}

		renderLoadError()
		{
			return View(
				{
					testId: 'mailbox-folders-settings-load-error',
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
					},
				},
				Text3({
					text: this.state.loadErrorMessage || Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_LOAD_ERROR'),
					color: Color.base2,
				}),
				View(
					{
						style: {
							marginTop: Indent.XL2.toNumber(),
						},
					},
					Button({
						testId: 'mailbox-folders-settings-load-error-close',
						text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_CLOSE_BUTTON'),
						size: ButtonSize.L,
						design: ButtonDesign.OUTLINE,
						onClick: () => {
							this.props.layoutWidget?.close();
						},
					}),
				),
			);
		}

		updateFolders(updater)
		{
			this.setState((state) => ({
				folders: updater(state.folders),
			}));
		}

		updateAssignment(type, assignment)
		{
			this.setState((state) => ({
				assignments: {
					...state.assignments,
					[type]: assignment,
				},
			}));
		}

		loadData()
		{
			this.service.load(this.props.mailboxId)
				.then((data) => {
					this.setState({
						loading: false,
						folders: this.tree.normalizeFolders(data.items),
						assignments: {
							outcome: this.tree.normalizeAssignment(data.assignedDirectories?.outcome),
							trash: this.tree.normalizeAssignment(data.assignedDirectories?.trash),
							spam: this.tree.normalizeAssignment(data.assignedDirectories?.spam),
						},
						maxLevel: Number(data.maxLevel || 0),
					}, () => {
						void this.loadContainerFolders();
					});
				})
				.catch((response) => {
					const serverMessage = response?.errors?.[0]?.message;
					const loadErrorMessage = serverMessage || Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_LOAD_ERROR');

					this.setState({
						loading: false,
						loadError: true,
						loadErrorMessage,
					});
				});
		}

		async loadContainerFolders()
		{
			const containers = this.tree.collectContainerFolders(this.state.folders, []);

			for (const dirMd5 of containers)
			{
				// eslint-disable-next-line no-await-in-loop
				await this.loadChildren(dirMd5, { silent: true });
			}
		}

		async loadChildren(dirMd5, { silent = false } = {})
		{
			this.updateFolders((folders) => this.tree.updateFolderTree(folders, dirMd5, (node) => ({
				...node,
				expanded: true,
				isLoading: true,
			})));

			try
			{
				const data = await this.service.loadChildren(this.props.mailboxId, dirMd5);
				const items = Array.isArray(data.items) ? data.items : [];

				this.updateFolders((folders) => this.tree.mergeLoadedChildren(
					folders,
					dirMd5,
					items,
					items.length > 0,
				));

				if (!silent && items.length === 0)
				{
					Notify.showIndicatorSuccess({
						text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_NO_NESTED_FOLDERS'),
						hideAfter: 2000,
					});
				}
			}
			catch (response)
			{
				const serverMessage = response?.errors?.[0]?.message;

				this.updateFolders((folders) => this.tree.updateFolderTree(folders, dirMd5, (node) => ({
					...node,
					expanded: false,
					isLoading: false,
				})));

				if (!silent)
				{
					Notify.showIndicatorError({
						text: serverMessage || Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_LOAD_ERROR'),
						hideAfter: 3000,
					});
				}
			}
		}

		getDirsTypes()
		{
			return [
				['outcome', DefaultFolderType.OUTCOME.value],
				['trash', DefaultFolderType.TRASH.value],
				['spam', DefaultFolderType.SPAM.value],
			]
				.map(([key, type]) => {
					const assignment = this.state.assignments[key];

					if (!assignment?.dirMd5)
					{
						return null;
					}

					return {
						dirMd5: assignment.dirMd5,
						type,
					};
				})
				.filter(Boolean)
			;
		}

		saveSettings()
		{
			if (this.state.saving)
			{
				return;
			}

			this.setState({ saving: true });

			this.service.save(this.props.mailboxId, {
				dirs: this.tree.collectSyncFolders(this.state.folders, []),
				dirsTypes: this.getDirsTypes(),
			})
				.then(() => {
					this.setState({ saving: false });

					BX.postComponentEvent('Mail.Mailbox::significantChangesInStructure', [this.props.mailboxId]);
					this.props.onSave?.();
				})
				.catch((response) => {
					const serverMessage = response?.errors?.[0]?.message;

					this.setState({ saving: false });

					Notify.showIndicatorError({
						text: serverMessage || Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_SAVE_ERROR'),
						hideAfter: 3000,
					});
				});
		}

		handleFooterHeightChange({ height })
		{
			if (this.state.footerHeight !== height)
			{
				this.setState({ footerHeight: height });
			}
		}

		handleSelectAllPress()
		{
			const checked = !this.tree.isAllSelected(this.state.folders);

			this.updateFolders((folders) => this.tree.setAllFoldersSync(folders, checked));
		}

		handleFolderRowPress(dirMd5)
		{
			const folder = this.tree.findFolder(this.state.folders, dirMd5);

			if (!folder)
			{
				return;
			}

			if (folder.isDisabled)
			{
				if (this.tree.canExpandNode(folder, this.state.maxLevel))
				{
					this.handleFolderExpandPress(dirMd5);
				}

				return;
			}

			this.updateFolders((folders) => this.tree.updateFolderTree(folders, dirMd5, (node) => ({
				...node,
				isSync: !node.isSync,
			})));
		}

		handleFolderExpandPress(dirMd5)
		{
			const folder = this.tree.findFolder(this.state.folders, dirMd5);

			if (!folder || !this.tree.canExpandNode(folder, this.state.maxLevel) || folder.isLoading)
			{
				return;
			}

			if (folder.childrenLoaded)
			{
				this.updateFolders((folders) => this.tree.updateFolderTree(folders, dirMd5, (node) => ({
					...node,
					expanded: !node.expanded,
				})));

				return;
			}

			void this.loadChildren(dirMd5);
		}

		getAssignmentSelectorFolders()
		{
			return this.tree.collectAssignmentSelectorFolders(this.state.folders, null, []);
		}

		getAssignmentLabel(type)
		{
			return this.state.assignments[type]?.formattedName || Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_NOT_SPECIFIED');
		}

		openOutcomeSelector()
		{
			this.openAssignmentSelector('outcome');
		}

		openTrashSelector()
		{
			this.openAssignmentSelector('trash');
		}

		openSpamSelector()
		{
			this.openAssignmentSelector('spam');
		}

		handleAssignmentFolderSelect(type, props)
		{
			const assignment = this.tree.createAssignmentFromSelectorFolder(props?.folder);

			if (!assignment)
			{
				return;
			}

			this.updateAssignment(type, assignment);
		}

		openAssignmentSelector(type)
		{
			const folders = this.getAssignmentSelectorFolders();

			if (folders.length === 0)
			{
				Notify.showIndicatorError({
					text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_EMPTY_MENU'),
					hideAfter: 3000,
				});

				return;
			}

			const parentWidget = typeof this.props.layoutWidget?.openWidget === 'function'
				? this.props.layoutWidget
				: PageManager
			;

			parentWidget.openWidget(
				'layout',
				{
					...FolderSelector.FOLDER_LAYOUT_PROPERTIES_MOVE,
					titleParams: {
						text: Loc.getMessage('MAILBOX_FOLDERS_SETTINGS_SELECT_FOLDER_TITLE'),
						type: 'dialog',
					},
					onReady: (layoutWidget) => {
						layoutWidget.showComponent(new FolderSelector({
							parentWidget,
							layoutWidget,
							mode: FolderSelector.MOVE_MODE,
							folders,
							selectedFolderId: this.state.assignments[type]?.dirMd5 ?? null,
							onSelect: this.handleAssignmentFolderSelect.bind(this, type),
						}));
					},
				},
			);
		}
	}

	module.exports = { FoldersSettingsLayout };
});
