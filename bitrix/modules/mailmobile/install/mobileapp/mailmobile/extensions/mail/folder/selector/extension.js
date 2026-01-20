/**
 * @module mail/folder/selector
 */
jn.define('mail/folder/selector', (require, exports, module) => {
	const {
		setCurrentFolder,
	} = require('mail/statemanager/redux/slices/folders');
	const {
		selectSystemFolders,
		selectCustomFolders,
		selectCurrentFolder,
	} = require('mail/statemanager/redux/slices/folders/selector');
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
			} = props;

			this.additionalPropsForSelect = additionalPropsForSelect;
			this.mode = mode;
			this.layoutWidget = layoutWidget;
			this.parentWidget = parentWidget;
			this.onSelect = onSelect;
			this.customHiddenCallback = customHiddenCallback ?? null;

			if (mode === Selector.SWITCH_MODE)
			{
				this.mailboxSelector = new MailboxSelector({
					parentWidget: layoutWidget,
				});
			}
		}

		componentDidMount()
		{
			this.unsubscribeFoldersObserver = observeFoldersChange(
				store,
				this.onVisibleFoldersChange,
			);

			this.initCurrentFolder();
		}

		initCurrentFolder()
		{
			if (selectCurrentFolder(store.getState()) !== null && selectCurrentFolder(store.getState()) !== undefined)
			{
				return;
			}

			const systemFolders = selectSystemFolders(store.getState());
			const customFolders = selectCustomFolders(store.getState());

			const firstFolder = systemFolders[0] || customFolders[0] || null;

			if (firstFolder)
			{
				dispatch(setCurrentFolder({ folderPath: firstFolder.path }));
			}
		}

		renderMailboxSelector()
		{
			if (this.mode === Selector.SWITCH_MODE)
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
					this.renderSystemFolders(),
					this.renderCustomFolders(),
				),
			);
		}

		renderSystemFolders()
		{
			const systemFolders = selectSystemFolders(store.getState());

			const folders = systemFolders.map((folder) => this.renderFolderItem(folder));

			return View(
				{},
				...folders,
			);
		}

		renderCustomFolders()
		{
			const customFolders = selectCustomFolders(store.getState());

			if (customFolders.length === 0)
			{
				return null;
			}

			return View(
				{
					style: {},
				},
				...customFolders.map((folder) => this.renderFolderItem(folder)),
			);
		}

		renderFolderItem(folder)
		{
			let isSelected = false;

			const currentFolder = selectCurrentFolder(store.getState());

			if (currentFolder !== null
				&& currentFolder !== undefined
				&& currentFolder.id === folder.id
				&& (this.mode === Selector.SWITCH_MODE)
			)
			{
				isSelected = true;
			}

			let unreadCount = Number(folder.unreadCount) || '';

			if (this.mode !== Selector.SWITCH_MODE)
			{
				unreadCount = '';
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: 11.5,
						paddingHorizontal: 12,
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
						text: folder.name,
						style: {
							paddingRight: 4,
							fontSize: 16,
							fontWeight: isSelected ? '500' : '400',
							color: Color.base1.toHex(),
						},
					}),
					isSelected && SelectedIcon(),
				),
				folder.messageCount > 0
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

		getFolderIcon(type)
		{
			const icons = {
				default: Icon.MAIL,
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
				id: 'message-grid-more',
				testId: 'message-grid-more',
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
