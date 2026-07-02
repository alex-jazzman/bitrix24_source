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
	} = require('mail/statemanager/redux/slices/folders/selector');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const {
		VirtualFolder,
		ALL_MESSAGES,
		getNameByKey: getVirtualFolderNameByKey,
		getCounterByKey: getVirtualFolderCounterByKey,
		callAction: callVirtualFolderAction,
	} = require('mail/folder/virtual');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { ScrollView } = require('layout/ui/scroll-view');
	const { Box } = require('ui-system/layout/box');
	const { Color } = require('tokens');
	const { Selector: MailboxSelector } = require('mail/mailbox/selector');
	const { observeFoldersChange } = require('mail/statemanager/redux/slices/folders/observers/stateful-list');
	const { Loc } = require('loc');

	/**
	 * @class Selector
	 */
	class Selector extends LayoutComponent
	{
		static SWITCH_MODE = 0;
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
			} = props;

			this.additionalPropsForSelect = additionalPropsForSelect;
			this.mode = mode;
			this.layoutWidget = layoutWidget;
			this.parentWidget = parentWidget;
			this.onSelect = onSelect;
			this.customHiddenCallback = customHiddenCallback ?? null;
			this.folders = Array.isArray(folders) ? folders : null;
			this.selectedFolderId = selectedFolderId;
			this.virtualFolders = [];

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
			if (!this.hasCustomFoldersSource())
			{
				this.unsubscribeFoldersObserver = observeFoldersChange(
					store,
					this.onVisibleFoldersChange,
				);

				this.initCurrentFolder();
			}
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
						paddingTop: 8,
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

		renderFoldersList()
		{
			return ScrollView(
				{
					style: {
						flex: 1,
					},
				},
				View(
					{
						style: {
							paddingHorizontal: 8,
						},
					},
					this.renderVirtualFolders(),
					this.renderSystemFolders(),
					this.renderCustomFolders(),
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
			if (!this.hasCustomFoldersSource())
			{
				return selectSystemFolders(store.getState());
			}

			return this.folders.filter((folder) => DefaultFolderType.getValues().includes(folder.type));
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

		renderVirtualFolders()
		{
			if (this.mode !== Selector.SWITCH_MODE)
			{
				return null;
			}

			const folders = this.virtualFolders.map((folder) => this.renderFolderItem(folder));

			return View(
				{},
				...folders,
			);
		}

		renderSystemFolders()
		{
			const systemFolders = this.getSystemFoldersData();
			const rootSystemFolders = systemFolders.filter((folder) => folder.parentId === null);
			const childrenMap = this.buildChildrenMap();

			return View(
				{},
				...rootSystemFolders.flatMap((folder) => this.renderFolderWithChildren(folder, 0, childrenMap)),
			);
		}

		renderCustomFolders()
		{
			const rootCustomFolders = this.getRootCustomFoldersData();

			if (rootCustomFolders.length === 0)
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
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: 11.5,
						paddingHorizontal: 12,
						paddingLeft: 12 + nestingPadding,
						backgroundColor: 'transparent',
						borderRadius: 12,
						marginBottom: 4,
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
							marginRight: 12,
						},
					},
					this.getFolderIcon(folder.type),
				),
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
						},
					},
					Text({
						text: this.getFolderTitle(folder),
						style: {
							paddingRight: 4,
							fontSize: 16,
							fontWeight: isSelected ? '500' : '400',
							color: Color.base1.toHex(),
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
					Text({
						text: String(unreadCount),
						style: {
							ellipsize: 'end',
							numberOfLines: 1,
							textAlign: 'center',
							paddingVertical: 1,
							paddingHorizontal: 6,
							color: isSelected ? Color.baseWhiteFixed.toHex() : Color.base3.toHex(),
							fontSize: 13,
							fontWeight: '500',
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

		getFolderIcon(type)
		{
			const icons = {
				[ALL_MESSAGES]: Icon.MAIL,
				default: Icon.MAIL_SEND,
				drafts: Icon.FILE,
				outcome: Icon.SEND,
				trash: Icon.TRASHCAN,
				spam: Icon.ALERT,
				custom: Icon.FOLDER,
			};

			return IconView({
				size: 28,
				icon: icons[type] || icons.custom,
				color: Color.accentMainPrimaryalt,
			});
		}

		onFolderClick = (folder) => {
			if (folder.isVirtual === true)
			{
				callVirtualFolderAction(folder.type);
				this.layoutWidget.close();

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
				dispatch(setCurrentFolder({ folderPath: folder.path }));
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
				testId: 'message-grid-folder-selector-button',
				callback,
			};
		}

		onVisibleFoldersChange = () => {
			this.initCurrentFolder();
			this.setState({});
		};

		componentWillUnmount()
		{
			if (this.unsubscribeFoldersObserver)
			{
				this.unsubscribeFoldersObserver();
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
	};
});
