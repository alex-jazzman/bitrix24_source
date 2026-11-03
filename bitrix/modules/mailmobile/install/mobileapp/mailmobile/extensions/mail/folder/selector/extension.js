/**
 * @module mail/folder/selector
 */
jn.define('mail/folder/selector', (require, exports, module) => {
	const {
		setCurrentFolder,
	} = require('mail/statemanager/redux/slices/folders');
	const {
		selectAll,
		selectSystemFolders,
		selectRootCustomFolders,
		selectCurrentFolder,
		selectCurrentVirtualFolderKey,
		selectLabelsAvailable,
	} = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { selectCurrentLabelId } = require('mail/statemanager/redux/slices/labels/selector');
	const { fetchLabels } = require('mail/statemanager/redux/slices/labels/thunk');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { selectMessageDeleteAvailable } = require('mail/statemanager/redux/slices/messages/selector');
	const {
		VirtualFolder,
		ALL_MESSAGES,
		FAVORITES,
		LABEL,
		getNameByKey: getVirtualFolderNameByKey,
		getCounterByKey: getVirtualFolderCounterByKey,
		callAction: callVirtualFolderAction,
		getFavoritesVirtualFolder,
		getLabelVirtualFolders,
	} = require('mail/folder/virtual');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { ScrollView } = require('layout/ui/scroll-view');
	const { Box } = require('ui-system/layout/box');
	const { Color, Corner, Indent } = require('tokens');
	const { Text3, Text5 } = require('ui-system/typography/text');
	const { Selector: MailboxSelector } = require('mail/mailbox/selector');
	const { observeFoldersChange } = require('mail/statemanager/redux/slices/folders/observers/stateful-list');
	const { observeLabelsChange } = require('mail/statemanager/redux/slices/labels/observers/stateful-list');
	const { Loc } = require('loc');
	const { DraftConnector } = require('mail/draft/connector');
	const {
		SWITCH_MODE,
		SECTION_FOLDERS,
		SECTION_COLLECTIONS,
		SECTION_LABELS,
		applyFavoritesAvailability,
		buildDraftsNavigationItem,
		buildFolderSections,
		buildLabelSectionItems,
		isDraftsButtonVisible,
		isSectionCollapsed,
		isSystemFolderVisible,
		isVirtualFolderVisible,
		readCollapsedSections,
		toggleSectionCollapsed,
		writeCollapsedSections,
	} = require('mail/folder/selector/src/sections');
	const MESSAGE_GRID_MODE_DRAFTS = 'drafts';
	const MESSAGE_GRID_MODE_MESSAGES = 'messages';
	let draftsAvailabilityPromise = null;
	let draftsAvailability = null;

	function getDraftsAvailability(loader = () => new DraftConnector().getConfig())
	{
		if (draftsAvailabilityPromise === null)
		{
			draftsAvailabilityPromise = loader()
				.then(({ data }) => data?.available === true)
				.then((available) => {
					draftsAvailability = available;

					return available;
				})
				.catch(() => {
					draftsAvailabilityPromise = null;

					return false;
				})
			;
		}

		return draftsAvailabilityPromise;
	}

	function resetDraftsAvailabilityCache()
	{
		draftsAvailabilityPromise = null;
		draftsAvailability = null;
	}

	function getInitialDraftsAvailability(preloadedAvailability, cachedAvailability = draftsAvailability)
	{
		if (typeof preloadedAvailability === 'boolean')
		{
			return preloadedAvailability;
		}

		return cachedAvailability === true;
	}













	function getDraftsNavigationDividerStyle()
	{
		return {
			height: 1,
			backgroundColor: Color.bgSeparatorPrimary.toHex(),
			marginTop: Indent.M.toNumber(),
			marginBottom: Indent.M.toNumber(),
			marginHorizontal: Indent.M.toNumber(),
		};
	}

	function getFolderIcon(type, isDraftsNavigation = false)
	{
		if (isDraftsNavigation)
		{
			return Icon.MAIL_IN_PROGRESS;
		}

		const icons = {
			[ALL_MESSAGES]: Icon.MAIL,
			[FAVORITES]: Icon.FAVORITE,
			// The tag glyph, the same as --o-sale-tag of the label rows of the web menu; Icon.TAG is a hash.
			[LABEL]: Icon.SALE_TAG,
			default: Icon.MAIL_SEND,
			drafts: Icon.FILE,
			outcome: Icon.SEND,
			trash: Icon.TRASHCAN,
			spam: Icon.ALERT,
			custom: Icon.FOLDER,
		};

		return icons[type] || icons.custom;
	}

	function handleDraftsSelection({
		onModeSelect = () => {},
		close = (callback) => callback(),
		schedule = (callback) => setTimeout(callback, 0),
	})
	{
		close(() => schedule(() => onModeSelect(MESSAGE_GRID_MODE_DRAFTS)));
	}

	function handleMessagesSelection({
		onModeSelect = () => {},
		afterModeSelect = () => {},
		close = (callback) => callback(),
		schedule = (callback) => setTimeout(callback, 0),
	})
	{
		close(() => schedule(() => {
			onModeSelect(MESSAGE_GRID_MODE_MESSAGES);
			afterModeSelect();
		}));
	}

	/**
	 * @class Selector
	 */
	class Selector extends LayoutComponent
	{
		static SWITCH_MODE = SWITCH_MODE;
		static MOVE_MODE = 1;

		static FOLDER_LAYOUT_PROPERTIES = {
			backgroundColor: Color.bgContentPrimary.toHex(),
			resizableByKeyboard: true,
			rightButtons: [],
			leftButtons: [],
			backdrop: {
				forceDismissOnSwipeDown: true,
				hideNavigationBar: true,
				horizontalSwipeAllowed: false,
				mediumPositionPercent: 80,
				onlyMediumPosition: true,
				shouldResizeContent: true,
				swipeAllowed: true,
				swipeContentAllowed: false,
			},
		};

		static FOLDER_LAYOUT_PROPERTIES_MOVE = {
			titleParams: {
				text: Loc.getMessage('MAIL_FOLDER_SELECTOR_MOVE_TITLE'),
				type: 'dialog',
			},
			backgroundColor: Color.bgContentPrimary.toHex(),
			resizableByKeyboard: true,
			rightButtons: [],
			leftButtons: [],
			backdrop: {
				forceDismissOnSwipeDown: true,
				hideNavigationBar: false,
				horizontalSwipeAllowed: false,
				mediumPositionPercent: 65,
				onlyMediumPosition: true,
				shouldResizeContent: true,
				swipeAllowed: true,
				swipeContentAllowed: false,
			},
		};

		constructor(props = {})
		{
			super(props);

			const {
				layoutWidget,
				parentWidget,
				mode = Selector.SWITCH_MODE,
				onSelect = null,
				additionalPropsForSelect = {},
				customHiddenCallback,
				folders = null,
				selectedFolderId = null,
				onModeSelect = () => {},
				isDraftsSelected = false,
				draftsAvailable: preloadedDraftsAvailability,
			} = props;

			this.additionalPropsForSelect = additionalPropsForSelect;
			this.mode = mode;
			this.layoutWidget = layoutWidget;
			this.parentWidget = parentWidget;
			this.onSelect = onSelect;
			this.customHiddenCallback = customHiddenCallback ?? null;
			this.folders = Array.isArray(folders) ? folders : null;
			this.selectedFolderId = selectedFolderId;
			this.onModeSelect = onModeSelect;
			this.isDraftsSelected = isDraftsSelected;
			this.hasPreloadedDraftsAvailability = typeof preloadedDraftsAvailability === 'boolean';
			this.virtualFolders = [];
			this.state = {
				draftsAvailable: getInitialDraftsAvailability(preloadedDraftsAvailability),
				collapsedSections: this.isSectionedLayout() ? readCollapsedSections() : {},
			};

			if (mode === Selector.SWITCH_MODE && !this.hasCustomFoldersSource())
			{
				this.mailboxSelector = new MailboxSelector({
					parentWidget: layoutWidget,
				});
			}

			this.virtualFolders.push(
				new VirtualFolder(
					getVirtualFolderNameByKey(ALL_MESSAGES),
					ALL_MESSAGES,
					getVirtualFolderCounterByKey(ALL_MESSAGES, store.getState()),
				),
			);
		}

		componentDidMount()
		{
			this.isDisposed = false;

			if (
				this.mode === Selector.SWITCH_MODE
				&& !this.hasCustomFoldersSource()
				&& !this.hasPreloadedDraftsAvailability
			)
			{
				getDraftsAvailability()
					.then((available) => {
						if (available !== this.state.draftsAvailable)
						{
							this.setState({ draftsAvailable: available });
						}
					})
				;
			}

			if (!this.hasCustomFoldersSource())
			{
				this.unsubscribeFoldersObserver = observeFoldersChange(
					store,
					this.onVisibleFoldersChange,
				);
				// The dictionary of labels arrives after the selector is already open, and the folders
				// observer does not watch its slice: without this the section appears only on the next
				// opening.
				this.unsubscribeLabelsObserver = observeLabelsChange(store, this.onLabelsChange);

				this.syncFavoritesVirtualFolder();
				this.syncLabelsSection();
				this.fetchLabelsOnce();
				this.initCurrentFolder();
			}
		}

		/**
		 * The dictionary of labels is read once per opening of the selector: the counter comes with
		 * the answer and is read anew on the next opening.
		 */
		fetchLabelsOnce()
		{
			if (this.mode !== Selector.SWITCH_MODE || this.hasCustomFoldersSource())
			{
				return;
			}

			const mailboxId = selectCurrentMailboxId(store.getState());
			if (mailboxId > 0)
			{
				dispatch(fetchLabels({ mailboxId }));
			}
		}

		/**
		 * Keeps the labels section in sync with the server flag, as syncFavoritesVirtualFolder does for
		 * favorites: a gone flag removes the section and takes an active label back to all messages.
		 */
		syncLabelsSection()
		{
			if (this.mode !== Selector.SWITCH_MODE || this.hasCustomFoldersSource())
			{
				return;
			}

			if (
				!selectLabelsAvailable(store.getState())
				&& selectCurrentVirtualFolderKey(store.getState()) === LABEL
			)
			{
				callVirtualFolderAction(ALL_MESSAGES);
			}
		}

		syncFavoritesVirtualFolder()
		{
			if (this.mode !== Selector.SWITCH_MODE || this.hasCustomFoldersSource())
			{
				return;
			}

			const favoritesFolder = getFavoritesVirtualFolder(store.getState());
			applyFavoritesAvailability({
				favoritesFolder,
				currentVirtualFolderKey: selectCurrentVirtualFolderKey(store.getState()),
				isDisposed: this.isDisposed,
				onAvailable: (folder) => {
					if (!this.virtualFolders.some((item) => item.type === FAVORITES))
					{
						this.virtualFolders.push(folder);
						this.setState({});
					}
				},
				onUnavailable: (shouldResetCurrentFolder) => {
					const foldersCount = this.virtualFolders.length;
					this.virtualFolders = this.virtualFolders.filter((item) => item.type !== FAVORITES);
					if (shouldResetCurrentFolder)
					{
						callVirtualFolderAction(ALL_MESSAGES);
					}
					if (foldersCount !== this.virtualFolders.length)
					{
						this.setState({});
					}
				},
			});
		}

		initCurrentFolder()
		{
			if (selectCurrentVirtualFolderKey(store.getState()) !== null)
			{
				return;
			}

			if (selectCurrentFolder(store.getState()) !== null && selectCurrentFolder(store.getState()) !== undefined)
			{
				return;
			}

			const systemFolders = selectSystemFolders(store.getState());
			const rootCustomFolders = selectRootCustomFolders(store.getState());

			const firstFolder = systemFolders[0] || rootCustomFolders[0] || null;

			if (firstFolder)
			{
				dispatch(setCurrentFolder({ folderPath: firstFolder.path }));
			}
		}

		renderMailboxSelector()
		{
			if (this.mode === Selector.SWITCH_MODE && !this.hasCustomFoldersSource())
			{
				return this.mailboxSelector;
			}

			return null;
		}

		render()
		{
			return View(
				{
					style: {
						paddingTop: Indent.M.toNumber(),
					},
				},
				this.renderMailboxSelector(),
				Box(
					{
						backgroundColor: Color.bgPrimary,
						style: {
							flex: 1,
						},
					},
					this.renderFoldersList(),
				),
			);
		}

		renderLabelsSection()
		{
			const items = buildLabelSectionItems({
				mode: this.mode,
				hasCustomFoldersSource: this.hasCustomFoldersSource(),
				labelsAvailable: selectLabelsAvailable(store.getState()),
				labelFolders: getLabelVirtualFolders(store.getState()),
			});

			if (items.length === 0)
			{
				return null;
			}

			return View(
				{
					testId: 'mail-folder-selector-labels-section',
				},
				View({
					testId: 'mail-folder-selector-secondary-divider',
					style: getDraftsNavigationDividerStyle(),
				}),
				this.renderSectionHeader({
					sectionId: SECTION_LABELS,
					title: Loc.getMessage('MAIL_FOLDER_SELECTOR_LABELS'),
					titleTestId: 'mail-folder-selector-labels-title',
				}),
				...(this.isSectionCollapsed(SECTION_LABELS)
					? []
					: items.map((folder) => this.renderFolderItem(folder))),
			);
		}

		isSectionedLayout()
		{
			return this.mode === Selector.SWITCH_MODE && !this.hasCustomFoldersSource();
		}

		isSectionCollapsed(sectionId)
		{
			return this.isSectionedLayout() && isSectionCollapsed(this.state.collapsedSections, sectionId);
		}

		toggleSection(sectionId)
		{
			const collapsedSections = toggleSectionCollapsed(this.state.collapsedSections, sectionId);

			writeCollapsedSections(collapsedSections);
			this.setState({ collapsedSections });
		}

		renderSectionHeader({ sectionId, title, titleTestId })
		{
			const collapsed = this.isSectionCollapsed(sectionId);

			return View(
				{
					testId: `mail-folder-selector-section-header-${sectionId}`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Indent.XL.toNumber(),
						paddingBottom: Indent.XS.toNumber(),
					},
					onClick: () => this.toggleSection(sectionId),
				},
				Text5({
					testId: titleTestId,
					text: title,
					color: Color.base3,
					style: {
						flex: 1,
					},
				}),
				IconView({
					testId: `mail-folder-selector-section-chevron-${sectionId}`,
					size: 20,
					icon: collapsed ? Icon.CHEVRON_TO_THE_RIGHT : Icon.CHEVRON_DOWN,
					color: Color.base3,
				}),
			);
		}

		renderCollectionsSectionHeader()
		{
			return this.renderSectionHeader({
				sectionId: SECTION_COLLECTIONS,
				title: Loc.getMessage('MAIL_FOLDER_SELECTOR_COLLECTIONS'),
				titleTestId: 'mail-folder-selector-collections-title',
			});
		}

		renderFavoritesNavigationItem()
		{
			const folder = this.virtualFolders.find(({ type }) => type === FAVORITES);
			if (!folder || !isVirtualFolderVisible(folder, this.mode))
			{
				return null;
			}

			// The divider and the header of the collections block belong to all mail, which comes first.
			if (this.isSectionedLayout())
			{
				return this.isSectionCollapsed(SECTION_COLLECTIONS)
					? null
					: View(
						{
							testId: 'mail-folder-selector-favorites-section',
						},
						this.renderFolderItem(folder),
					);
			}

			return View(
				{
					testId: 'mail-folder-selector-favorites-section',
				},
				View({
					testId: 'mail-folder-selector-secondary-divider',
					style: getDraftsNavigationDividerStyle(),
				}),
				this.renderFolderItem(folder),
			);
		}

		/**
		 * The drafts item closes the collections block; its divider and header belong to all mail,
		 * which opens the block. Without the sectioned layout the item keeps its own divider.
		 */
		renderDraftsNavigationItem(withDivider = true)
		{
			if (!isDraftsButtonVisible({
				available: this.state.draftsAvailable,
				mode: this.mode,
				hasCustomFoldersSource: this.hasCustomFoldersSource(),
			}))
			{
				return null;
			}

			const item = this.renderFolderItem(buildDraftsNavigationItem({
				title: Loc.getMessage('MAIL_FOLDER_SELECTOR_DRAFTS'),
				selected: this.isDraftsSelected,
			}));

			if (this.isSectionedLayout())
			{
				return this.isSectionCollapsed(SECTION_COLLECTIONS)
					? null
					: View(
						{
							testId: 'mail-folder-selector-drafts-section',
						},
						item,
					);
			}

			return View(
				{
					testId: 'mail-folder-selector-drafts-section',
				},
				withDivider && View({
					testId: 'mail-folder-selector-secondary-divider',
					style: getDraftsNavigationDividerStyle(),
				}),
				item,
			);
		}

		renderFoldersList()
		{
			const favoritesNavigation = this.renderFavoritesNavigationItem();

			return ScrollView(
				{
					style: {
						flex: 1,
					},
				},
				View(
					{
						style: {
							paddingHorizontal: Indent.M.toNumber(),
						},
					},
					...buildFolderSections({
						virtualFolders: this.renderVirtualFolders(),
						systemFolders: this.renderSystemFolders(),
						customFolders: this.renderCustomFolders(),
						labelsSection: this.renderLabelsSection(),
						favoritesNavigation,
						draftsNavigation: this.renderDraftsNavigationItem(favoritesNavigation === null),
					}),
				),
			);
		}

		buildChildrenMap()
		{
			const allFolders = this.getAllFolders();
			const map = new Map();

			for (const folder of allFolders)
			{
				if (folder.parentId !== null)
				{
					if (!map.has(folder.parentId))
					{
						map.set(folder.parentId, []);
					}

					map.get(folder.parentId).push(folder);
				}
			}

			return map;
		}

		hasCustomFoldersSource()
		{
			return Array.isArray(this.folders);
		}

		getAllFolders()
		{
			return this.hasCustomFoldersSource() ? this.folders : selectAll(store.getState());
		}

		getSystemFoldersData()
		{
			const systemFolders = this.hasCustomFoldersSource()
				? this.folders.filter((folder) => DefaultFolderType.getValues().includes(folder.type))
				: selectSystemFolders(store.getState());
			const isMessageDeleteAvailable = selectMessageDeleteAvailable(store.getState());

			return systemFolders.filter(
				(folder) => isSystemFolderVisible(folder, this.mode, isMessageDeleteAvailable),
			);
		}

		getRootCustomFoldersData()
		{
			if (!this.hasCustomFoldersSource())
			{
				return selectRootCustomFolders(store.getState());
			}

			return this.folders.filter(
				(folder) => folder.parentId === null && !DefaultFolderType.getValues().includes(folder.type),
			);
		}

		/**
		 * All mail opens the collections block: it is not a folder of the mailbox, it stands next to
		 * favorites and drafts. Being first in the block, it draws the divider and the header.
		 */
		renderVirtualFolders()
		{
			if (this.mode !== Selector.SWITCH_MODE)
			{
				return null;
			}

			const folders = this.virtualFolders
				.filter((folder) => folder.type !== FAVORITES && isVirtualFolderVisible(folder, this.mode))
				.map((folder) => this.renderFolderItem(folder));

			if (!this.isSectionedLayout())
			{
				return View({}, ...folders);
			}

			return View(
				{
					testId: 'mail-folder-selector-collections-section',
				},
				View({
					testId: 'mail-folder-selector-secondary-divider',
					style: getDraftsNavigationDividerStyle(),
				}),
				this.renderCollectionsSectionHeader(),
				...(this.isSectionCollapsed(SECTION_COLLECTIONS) ? [] : folders),
			);
		}

		/**
		 * System and custom folders are one block for the user, so the header of the folders section
		 * is drawn here, above the system ones, and collapsing hides both groups at once.
		 */
		renderSystemFolders()
		{
			const systemFolders = this.getSystemFoldersData();
			const rootSystemFolders = systemFolders.filter((folder) => folder.parentId === null);
			const childrenMap = this.buildChildrenMap();
			const rows = this.isSectionCollapsed(SECTION_FOLDERS)
				? []
				: rootSystemFolders.flatMap((folder) => this.renderFolderWithChildren(folder, 0, childrenMap));

			return View(
				{},
				this.renderFoldersSectionHeader(),
				...rows,
			);
		}

		renderFoldersSectionHeader()
		{
			if (!this.isSectionedLayout() || !this.hasFolderRows())
			{
				return null;
			}

			return View(
				{},
				View({
					testId: 'mail-folder-selector-secondary-divider',
					style: getDraftsNavigationDividerStyle(),
				}),
				this.renderSectionHeader({
					sectionId: SECTION_FOLDERS,
					title: Loc.getMessage('MAIL_FOLDER_SELECTOR_FOLDERS'),
					titleTestId: 'mail-folder-selector-folders-title',
				}),
			);
		}

		hasFolderRows()
		{
			return this.getSystemFoldersData().length > 0 || this.getRootCustomFoldersData().length > 0;
		}

		renderCustomFolders()
		{
			const rootCustomFolders = this.getRootCustomFoldersData();

			if (rootCustomFolders.length === 0 || this.isSectionCollapsed(SECTION_FOLDERS))
			{
				return null;
			}

			const childrenMap = this.buildChildrenMap();

			return View(
				{
					style: {},
				},
				...rootCustomFolders.flatMap((folder) => this.renderFolderWithChildren(folder, 0, childrenMap)),
			);
		}

		renderFolderWithChildren(folder, level, childrenMap, visited = new Set())
		{
			if (visited.has(folder.id))
			{
				return [];
			}

			visited.add(folder.id);

			const children = childrenMap.get(folder.id) || [];
			const elements = [this.renderFolderItem(folder, level)];

			for (const child of children)
			{
				elements.push(...this.renderFolderWithChildren(child, level + 1, childrenMap, visited));
			}

			return elements;
		}

		renderFolderItem(folder, level = 0)
		{
			const isSelected = this.isFolderSelected(folder);

			let unreadCount = Number(folder.unreadCount) || '';

			if (this.mode !== Selector.SWITCH_MODE)
			{
				unreadCount = '';
			}

			const nestingPadding = level * 20;

			return View(
				{
					testId: folder.testId,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: 11.5,
						paddingHorizontal: Indent.XL.toNumber(),
						paddingLeft: Indent.XL.toNumber() + nestingPadding,
						backgroundColor: 'transparent',
						borderRadius: Corner.L.toNumber(),
						marginBottom: Indent.XS.toNumber(),
						height: 51,
					},
					onClick: () => this.onFolderClick(folder),
				},
				View(
					{
						style: {
							width: 24,
							height: 24,
							justifyContent: 'center',
							alignItems: 'center',
							marginRight: Indent.XL.toNumber(),
						},
					},
					this.getFolderIcon(folder.type, folder.isDraftsNavigation),
				),
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
						},
					},
					Text3({
						testId: 'mailmobile-folder-selector-item-name',
						text: this.getFolderTitle(folder),
						accent: isSelected,
						color: Color.base1,
						style: {
							paddingRight: Indent.XS.toNumber(),
						},
					}),
					isSelected && SelectedIcon(),
				),
				folder.unreadCount > 0
				&& View(
					{
						style: {
							minWidth: 20,
							borderRadius: 50,
							backgroundColor: (isSelected && unreadCount !== '') ? Color.accentMainPrimary.toHex() : 'transparent',
						},
					},
					Text5({
						testId: 'mailmobile-folder-selector-item-counter',
						text: String(unreadCount),
						numberOfLines: 1,
						ellipsize: 'end',
						accent: true,
						color: isSelected ? Color.baseWhiteFixed : Color.base3,
						style: {
							textAlign: 'center',
							paddingVertical: 1,
							paddingHorizontal: Indent.S.toNumber(),
						},
						}),
					),
			);
		}

		getFolderTitle(folder)
		{
			return folder.formattedName || folder.name;
		}

		isFolderSelected(folder)
		{
			if (folder.isDraftsNavigation === true)
			{
				return folder.isSelected === true;
			}
			if (this.isDraftsSelected)
			{
				return false;
			}
			if (this.mode === Selector.MOVE_MODE && this.selectedFolderId !== null)
			{
				return folder.id === this.selectedFolderId;
			}

			if (this.mode !== Selector.SWITCH_MODE)
			{
				return false;
			}

			const currentVirtualFolderKey = selectCurrentVirtualFolderKey(store.getState());

			if (folder.isVirtual === true)
			{
				if (folder.type === LABEL)
				{
					return currentVirtualFolderKey === LABEL
						&& folder.labelId === selectCurrentLabelId(store.getState())
					;
				}

				return folder.type === currentVirtualFolderKey;
			}

			if (currentVirtualFolderKey !== null)
			{
				return false;
			}

			const currentFolder = selectCurrentFolder(store.getState());

			return currentFolder !== null
				&& currentFolder !== undefined
				&& currentFolder.id === folder.id
			;
		}

		getFolderIcon(type, isDraftsNavigation = false)
		{
			return IconView({
				size: 28,
				icon: getFolderIcon(type, isDraftsNavigation),
				color: Color.accentMainPrimaryalt,
			});
		}

		onFolderClick = (folder) => {
			if (folder.isDraftsNavigation === true)
			{
				handleDraftsSelection({
					onModeSelect: this.onModeSelect,
					close: (callback) => this.layoutWidget.close(callback),
				});

				return;
			}

			if (folder.isVirtual === true)
			{
				const actionParams = folder.type === LABEL ? { labelId: folder.labelId } : {};
				handleMessagesSelection({
					onModeSelect: this.onModeSelect,
					afterModeSelect: () => callVirtualFolderAction(folder.type, actionParams),
					close: (callback) => this.layoutWidget.close(callback),
				});

				return;
			}

			if (this.mode === Selector.MOVE_MODE && this.onSelect)
			{
				this.onSelect({
					...this.additionalPropsForSelect,
					folder,
				});
			}
			else if (this.mode === Selector.SWITCH_MODE)
			{
				handleMessagesSelection({
					onModeSelect: this.onModeSelect,
					afterModeSelect: () => dispatch(setCurrentFolder({ folderPath: folder.path })),
					close: (callback) => this.layoutWidget.close(callback),
				});

				return;
			}

			this.layoutWidget.close();
		};

		/**
		 * @public
		 * @returns {{type: string, id: string, testId: string, callback: ((function(): void)|*)}}
		 */
		getMenuButton(callback)
		{
			return {
				type: 'folder',
				id: 'message-grid-folder-selector-button',
				badgeCode: 'message-grid-folder-selector-button',
				testId: 'message-grid-folder-selector-button',
				callback,
			};
		}

		onLabelsChange = () => {
			this.syncLabelsSection();
			this.setState({});
		};

		onVisibleFoldersChange = () => {
			this.syncFavoritesVirtualFolder();
			this.syncLabelsSection();
			this.initCurrentFolder();
			this.setState({});
		};

		componentWillUnmount()
		{
			this.isDisposed = true;

			if (this.unsubscribeFoldersObserver)
			{
				this.unsubscribeFoldersObserver();
			}

			if (this.unsubscribeLabelsObserver)
			{
				this.unsubscribeLabelsObserver();
			}

			if (this.customHiddenCallback)
			{
				this.customHiddenCallback();
			}
		}
	}

	function SelectedIcon()
	{
		return View(
			{
				style: {},
			},
			Image({
				style: {
					width: 30,
					height: 30,
				},
				svg: {
					content: '<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.0857 10.1819C21.3303 9.93861 21.726 9.93934 21.9695 10.1838C22.213 10.4284 22.2119 10.8241 21.9675 11.0676L13.1804 19.8176C12.9366 20.0605 12.5424 20.0605 12.2986 19.8176L8.30933 15.845C8.06477 15.6014 8.06382 15.2058 8.30737 14.9612C8.55091 14.7168 8.94663 14.7159 9.19116 14.9592L12.739 18.4934L21.0857 10.1819Z" fill="#0075FF"/></svg>',
				},
			}),
		);
	}

	module.exports = {
		Selector,
		buildFolderSections,
		buildLabelSectionItems,
		buildDraftsNavigationItem,
		getDraftsNavigationDividerStyle,
		getFolderIcon,
		getDraftsAvailability,
		getInitialDraftsAvailability,
		handleDraftsSelection,
		handleMessagesSelection,
		isDraftsButtonVisible,
		isVirtualFolderVisible,
		isSystemFolderVisible,
		applyFavoritesAvailability,
		resetDraftsAvailabilityCache,
		isSectionCollapsed,
		toggleSectionCollapsed,
		readCollapsedSections,
		writeCollapsedSections,
		SECTION_FOLDERS,
		SECTION_COLLECTIONS,
		SECTION_LABELS,
	};
});
