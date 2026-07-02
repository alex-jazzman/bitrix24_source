/**
 * @module im/messenger/controller/folder/list/view
 */
jn.define('im/messenger/controller/folder/list/view', (require, exports, module) => {
	const { isOnline } = require('device/connection');
	const { Color } = require('tokens');
	const { Haptics } = require('haptics');
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('im/messenger/loc');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { FolderLoadableButton } = require('im/messenger/controller/folder/lib/ui/loadable-button');
	const { MAX_PERSONAL_FOLDERS } = require('im/messenger/const');
	const { FolderCreate } = require('im/messenger/controller/folder/create');
	const { FolderUpdate } = require('im/messenger/controller/folder/update');
	const { FolderCard } = require('im/messenger/controller/folder/list/card');
	const {
		deleteFolder,
		sortFolders,
		showDeleteSuccessToast,
		showSortSuccessToast,
	} = require('im/messenger/controller/folder/lib/actions');

	const logger = getLoggerWithContext('folder--list', 'FolderListView');

	// Bottom inset for the list so the floating "+" button (FAB) doesn't overlap
	// the last folder's "..." menu. Implemented via a trailing non-draggable
	// spacer section, not a per-item padding — the latter changed item size
	// during drag.
	const FAB_SPACER_HEIGHT = 96;

	const PLUS_SVG = [
		'<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">',
		'<path d="M9 2V16M2 9H16" stroke="white" stroke-width="2" stroke-linecap="round"/>',
		'</svg>',
	].join('');

	const SystemFolderDescriptionMessage = Object.freeze({
		default: 'IMMOBILE_FOLDER_LIST_SYSTEM_DESCRIPTION_DEFAULT',
		tasksTask: 'IMMOBILE_FOLDER_LIST_SYSTEM_DESCRIPTION_TASKS_TASK',
		copilot: 'IMMOBILE_FOLDER_LIST_SYSTEM_DESCRIPTION_COPILOT',
		openChannel: 'IMMOBILE_FOLDER_LIST_SYSTEM_DESCRIPTION_OPEN_CHANNEL',
		collab: 'IMMOBILE_FOLDER_LIST_SYSTEM_DESCRIPTION_COLLAB',
		openlines: 'IMMOBILE_FOLDER_LIST_SYSTEM_DESCRIPTION_OPENLINES',
	});

	class FolderListView extends LayoutComponent
	{
		static open(parentWidget = null)
		{
			const opener = parentWidget || PageManager;

			if (!isOnline())
			{
				Notification.showOfflineToast({}, opener);

				return;
			}

			if (!serviceLocator.get('core'))
			{
				logger.error('open error: messenger core is not ready');
				Notification.showErrorToast({}, opener);

				return;
			}

			opener.openWidget('layout', {
				titleParams: {
					text: Loc.getMessage('IMMOBILE_FOLDER_LIST_NAV_TITLE'),
				},
				backgroundColor: Theme.colors.bgPrimary,
			})
				.then((widget) => {
					widget.showComponent(new FolderListView({
						layoutWidget: widget,
						opener,
					}));
				})
				.catch((error) => {
					logger.error('open error', error);
				})
			;
		}

		constructor(props)
		{
			super(props);

			this.folders = this.getFolderList();
			this.initialFolderIds = this.folders.map((folder) => folder.id);
			this.saveButton = null;
			this.state = {
				isOrderDirty: false,
			};

			this.handleFolderModelMutation = this.handleFolderModelMutation.bind(this);
		}

		get personalFolderCount()
		{
			return this.folders.filter((folder) => folder.type === 'personal').length;
		}

		get canCreateFolder()
		{
			return this.personalFolderCount < MAX_PERSONAL_FOLDERS;
		}

		componentDidMount()
		{
			super.componentDidMount();
			this.subscribeFolderModel();
		}

		// JaNative doesn't propagate props to existing class-component children
		// on parent setState — push the new enabled state through the ref.
		// Use as setState callback to land after the new ref is bound.
		#syncSaveEnabled = () => {
			this.saveButton?.setEnabled(this.state.isOrderDirty);
		};

		componentWillUnmount()
		{
			this.unsubscribeFolderModel();
			super.componentWillUnmount();
		}

		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		get storeManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		getFolderList()
		{
			return this.store.getters['folderModel/getList']();
		}

		subscribeFolderModel()
		{
			this.storeManager
				.on('folderModel/add', this.handleFolderModelMutation)
				.on('folderModel/update', this.handleFolderModelMutation)
				.on('folderModel/delete', this.handleFolderModelMutation)
				.on('folderModel/sort', this.handleFolderModelMutation)
				.on('folderModel/setChats', this.handleFolderModelMutation)
				.on('folderModel/setState', this.handleFolderModelMutation)
			;
		}

		unsubscribeFolderModel()
		{
			this.storeManager
				.off('folderModel/add', this.handleFolderModelMutation)
				.off('folderModel/update', this.handleFolderModelMutation)
				.off('folderModel/delete', this.handleFolderModelMutation)
				.off('folderModel/sort', this.handleFolderModelMutation)
				.off('folderModel/setChats', this.handleFolderModelMutation)
				.off('folderModel/setState', this.handleFolderModelMutation)
			;
		}

		handleFolderModelMutation()
		{
			this.folders = this.getFolderList();
			this.initialFolderIds = this.folders.map((folder) => folder.id);
			this.setState({ isOrderDirty: false }, this.#syncSaveEnabled);
		}

		handleMorePress(folder, targetRef)
		{
			const menu = new PopupMenu([
				{
					id: 'settings',
					title: Loc.getMessage('IMMOBILE_FOLDER_LIST_CONTEXT_SETTINGS'),
					onItemSelected: () => {
						new FolderUpdate({ id: folder.id }).open(this.props.layoutWidget);
					},
				},
				{
					id: 'delete',
					title: Loc.getMessage('IMMOBILE_FOLDER_LIST_CONTEXT_DELETE'),
					isDestructive: true,
					onItemSelected: () => {
						this.deleteFolder(folder.id);
					},
				},
			]);

			menu.show({ target: targetRef });
		}

		async deleteFolder(folderId)
		{
			let ok;
			try
			{
				ok = await deleteFolder({
					folderId,
					layoutWidget: this.props.layoutWidget,
				});
			}
			catch (error)
			{
				logger.error('delete folder error', error);

				return;
			}

			if (ok)
			{
				showDeleteSuccessToast(this.props.layoutWidget);
			}
		}

		handleItemDrop({ from, to })
		{
			const fromIndex = from.index;
			const toIndex = to.index;

			if (fromIndex === toIndex)
			{
				return;
			}

			const item = this.folders[fromIndex];
			this.folders.splice(fromIndex, 1);
			this.folders.splice(toIndex, 0, item);

			Haptics.impactMedium();

			const orderedIds = this.folders.map((folder) => folder.id);
			this.setState({ isOrderDirty: this.isOrderChanged(orderedIds) }, this.#syncSaveEnabled);
		}

		isOrderChanged(orderedIds)
		{
			if (orderedIds.length !== this.initialFolderIds.length)
			{
				return true;
			}

			return orderedIds.some((id, index) => id !== this.initialFolderIds[index]);
		}

		renderFolderItem(folder)
		{
			if (folder.__isSpacer)
			{
				return View({ style: { height: FAB_SPACER_HEIGHT } });
			}

			const isSystem = folder.type === 'system';

			return View(
				{
					style: {
						paddingHorizontal: 18,
						paddingBottom: 12,
					},
				},
				new FolderCard({
					title: folder.title,
					description: this.getFolderDescription(folder),
					isSystem,
					onMorePress: (targetRef) => this.handleMorePress(folder, targetRef),
				}),
			);
		}

		getFolderDescription(folder)
		{
			if (folder.type === 'system')
			{
				const messageId = SystemFolderDescriptionMessage[folder.code];

				return Loc.getMessage(messageId) || folder.recentSection || '';
			}

			const count = folder.chatIds?.length || 0;

			return Loc.getMessagePlural(
				'IMMOBILE_FOLDER_LIST_PERSONAL_DESCRIPTION',
				count,
				{ '#COUNT#': String(count) },
			);
		}

		renderFab()
		{
			if (!this.canCreateFolder)
			{
				return null;
			}

			return View(
				{
					style: {
						position: 'absolute',
						bottom: 78,
						right: 24,
					},
				},
				View(
					{
						style: {
							width: 58,
							height: 58,
							borderRadius: 18,
							backgroundColor: Color.accentMainPrimary.toHex(),
							opacity: 0.32,
							alignItems: 'center',
							justifyContent: 'center',
							shadowColor: Color.baseBlackFixed.toHex(),
							shadowOpacity: 0.2,
							shadowRadius: 4,
							shadowOffset: { x: 0, y: 2 },
						},
						onClick: () => {
							new FolderCreate().openAsBottomSheet(this.props.layoutWidget);
						},
					},
					Image({
						style: {
							width: 18,
							height: 18,
						},
						svg: {
							content: PLUS_SVG,
						},
					}),
				),
			);
		}

		renderBottomBar()
		{
			return View(
				{
					style: {
						paddingHorizontal: 18,
						paddingVertical: 12,
						backgroundColor: Theme.colors.bgNavigation,
					},
				},
				new FolderLoadableButton({
					testId: 'folder-list-save-button',
					text: Loc.getMessage('IMMOBILE_FOLDER_LIST_SAVE_BUTTON'),
					enabled: this.state.isOrderDirty,
					ref: (btn) => {
						this.saveButton = btn;
					},
					onClick: () => {
						void this.saveFolderOrder();
					},
				}),
			);
		}

		async saveFolderOrder()
		{
			if (this.isSubmitting)
			{
				return;
			}

			const orderedIds = this.folders.map((folder) => folder.id);
			if (!this.isOrderChanged(orderedIds))
			{
				return;
			}

			this.isSubmitting = true;
			try
			{
				await sortFolders({
					folderIds: orderedIds,
					layoutWidget: this.props.layoutWidget,
				});

				// Move the saved baseline forward so the diff reads as "no pending changes".
				this.initialFolderIds = [...orderedIds];
				this.setState({ isOrderDirty: false }, this.#syncSaveEnabled);
				showSortSuccessToast(this.props.layoutWidget);
			}
			catch (error)
			{
				logger.error('save folder order error', error);
				// Rollback the local drag state — REST failed, sync UI back to the store.
				this.folders = this.getFolderList();
				this.initialFolderIds = this.folders.map((folder) => folder.id);
				this.setState({ isOrderDirty: false }, this.#syncSaveEnabled);
			}
			finally
			{
				this.isSubmitting = false;
				this.saveButton?.setLoading(false);
			}
		}

		render()
		{
			const sections = [
				{
					items: this.folders.map((folder) => ({ ...folder, key: String(folder.id) })),
					dragInteractionEnabled: true,
				},
			];

			if (this.canCreateFolder)
			{
				sections.push({
					items: [{ key: '__fab-spacer__', __isSpacer: true }],
					dragInteractionEnabled: false,
				});
			}

			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Theme.colors.bgPrimary,
					},
				},
				ListView({
					style: {
						flex: 1,
						marginTop: 10,
					},
					dragInteractionEnabled: true,
					data: sections,
					renderItem: (folder) => this.renderFolderItem(folder),
					onItemDrop: (move) => this.handleItemDrop(move),
				}),
				this.renderBottomBar(),
				this.renderFab(),
			);
		}
	}

	module.exports = { FolderListView };
});
