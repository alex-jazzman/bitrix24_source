/**
 * @module mail/message-grid/navigation/src/multi-select-menu
 */
jn.define('mail/message-grid/navigation/src/multi-select-menu', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { Feature } = require('feature');
	const { Icon } = require('assets/icons');
	const { qrauth } = require('qrauth/utils');
	const { UIMenu } = require('layout/ui/menu');
	const { showRemoveToast } = require('toast/remove');
	const { selectSelectedIds, selectIsMultiSelectMode, selectSelectedUidIds } = require('mail/statemanager/redux/slices/messages/selector');
	const { selectFoldersByType, selectById: selectFolderById, selectCurrentFolder } = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { remove, moveToFolder, changeReadStatus } = require('mail/statemanager/redux/slices/messages/thunk');
	const { markAsRemoved, unmarkAsRemoved } = require('mail/statemanager/redux/slices/messages');
	const { setMultiSelectMode } = require('mail/statemanager/redux/slices/messages');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { Selector: FolderSelector } = require('mail/folder/selector');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const Sections = {
		REMOVE: 'remove',
		EDIT: 'edit',
	};

	/**
	 * @class MessageGridMultiSelectMenu
	 */
	class MessageGridMultiSelectMenu
	{
		constructor(props)
		{
			this.parentWidget = props.parentWidget;
		}

		get actions()
		{
			const actions = [];
			const currentFolder = selectCurrentFolder(store.getState());

			actions.push(
				{
					id: 'unread',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_UNREAD'),
					sectionCode: Sections.EDIT,
					iconName: Icon.MAIL_COUNTER,
					onItemSelected: () => this.changeReadObjectStatus(0),
				},
				{
					id: 'read',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_READ'),
					sectionCode: Sections.EDIT,
					iconName: Icon.DOUBLE_CHECK,
					onItemSelected: () => this.changeReadObjectStatus(1),
				},
				{
					id: 'inFolder',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_IN_FOLDER'),
					sectionCode: Sections.EDIT,
					iconName: Icon.FOLDER,
					onItemSelected: () => this.openMover(),
				},
			);

			if (currentFolder?.type !== DefaultFolderType.SPAM.value)
			{
				actions.push({
					id: 'inSpam',
					title: Loc.getMessage('MAILMOBILE_ACTIONS_IN_SPAM'),
					sectionCode: Sections.EDIT,
					iconName: Icon.ALERT_ACCENT,
					onItemSelected: () => this.changeObjectFolder({
						folderSignature: DefaultFolderType.SPAM.value,
					}),
				});
			}

			actions.push({
				id: 'remove',
				title: Loc.getMessage('MAILMOBILE_ACTIONS_REMOVE'),
				sectionCode: Sections.REMOVE,
				iconName: Icon.TRASHCAN,
				isDestructive: true,
				onItemSelected: () => this.removeObject(),
			});

			return actions;
		}

		openMover()
		{
			this.parentWidget.openWidget(
				'layout',
				{
					...FolderSelector.FOLDER_LAYOUT_PROPERTIES_MOVE,
					onReady: (layoutWidget) => {
						layoutWidget.showComponent(new FolderSelector({
							parentWidget: this.parentWidget,
							layoutWidget,
							mode: FolderSelector.MOVE_MODE,
							onSelect: this.changeObjectFolder.bind(this),
						}));
					},
				},
				this.parentWidget,
			);
		}

		changeObjectFolder(props)
		{
			const {
				folderSignature = null,
				folder: folderToMove = null,
			} = props;

			if (folderToMove === null && DefaultFolderType.isDefined(folderSignature))
			{
				const defaultFolderToMove = selectFoldersByType(store.getState(), folderSignature, true);
				if (defaultFolderToMove.length === 0)
				{
					this.#onToggleMultiSelectMode();
					const mailboxId = selectCurrentMailboxId(store.getState());
					const title = (DefaultFolderType.TRASH.getValue() === folderSignature)
						? Loc.getMessage('MAILMOBILE_MESSAGE_GRID_GROUP_ACTIONS_FOLDERS_TRASH_BANNER_TITLE')
						: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_GROUP_ACTIONS_FOLDERS_SPAM_BANNER_TITLE')
					;
					qrauth.open({
						title,
						hintText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_GROUP_ACTIONS_FOLDERS_SETTINGS_BANNER_DESCRIPTION'),
						redirectUrl: `/mail/config/dirs?mailboxId=${mailboxId}`,
						showHint: true,
					});

					return;
				}
			}

			const objectIds = selectSelectedIds(store.getState());
			const objectUidIds = selectSelectedUidIds(store.getState());

			let resolvedFolderToMove = folderToMove;

			if (resolvedFolderToMove === null)
			{
				resolvedFolderToMove = Object.values(DefaultFolderType).some((type) => type.value === folderSignature)
					? selectFoldersByType(store.getState(), folderSignature, true)?.find(() => true)
					: selectFolderById(store.getState(), folderSignature, true);
			}

			if (!resolvedFolderToMove || objectIds.length === 0)
			{
				return;
			}

			dispatch(moveToFolder({ objectIds, objectUidIds, folderPath: resolvedFolderToMove.path }));
			this.#onToggleMultiSelectMode();
		}

		changeReadObjectStatus(isRead)
		{
			const objectIds = selectSelectedIds(store.getState());
			const objectUidIds = selectSelectedUidIds(store.getState());

			if (objectIds.length === 0)
			{
				return;
			}

			dispatch(changeReadStatus({ objectIds, objectUidIds, isRead }));
			this.#onToggleMultiSelectMode();
		}

		removeObject()
		{
			const objectIds = selectSelectedIds(store.getState());
			const objectUidIds = selectSelectedUidIds(store.getState());

			if (objectIds.length === 0)
			{
				return;
			}

			if (!Feature.isToastSupported())
			{
				dispatch(remove({ objectIds, objectUidIds }));

				return;
			}

			dispatch(markAsRemoved({ objectIds }));

			showRemoveToast(
				{
					message: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MULTI_SELECT_MAIL_REMOVE_TOAST_MESSAGE'),
					offset: 86,
					onButtonTap: () => {
						dispatch(unmarkAsRemoved({ objectIds }));
					},
					onTimerOver: () => {
						dispatch(remove({ objectIds, objectUidIds }));
						this.#onToggleMultiSelectMode();
					},
				},
			);
		}

		/**
		 * @public
		 * @returns {{type: string, id: string, testId: string, callback: ((function(): void)|*)}}
		 */
		getMenuButton()
		{
			return {
				name: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_ACTIONS_BUTTON'),
				id: 'next',
				type: 'text',
				testId: 'multiselect-mode-actions-button',
				color: Color.accentMainPrimaryalt.toHex(),
				callback: this.#onShow,
			};
		}

		getChanelButton()
		{
			return {
				name: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_CHANEL_BUTTON'),
				id: 'next',
				type: 'text',
				testId: 'multiselect-mode-chanel-button',
				color: Color.accentMainPrimaryalt.toHex(),
				callback: this.#onToggleMultiSelectMode,
			};
		}

		#onShow = () => {
			this.menu = new UIMenu(this.actions);
			this.menu.show({});
		};

		#onToggleMultiSelectMode = () => {
			const currentState = store.getState();
			const isMultiSelectMode = selectIsMultiSelectMode(currentState);

			dispatch(setMultiSelectMode({ isMultiSelectMode: !isMultiSelectMode }));
		};
	}
	module.exports = { MessageGridMultiSelectMenu };
});
