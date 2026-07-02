/**
 * @module mail/message/actions/src/change-folder
 */
jn.define('mail/message/actions/src/change-folder', (require, exports, module) => {
	const { Loc } = require('loc');
	const { qrauth } = require('qrauth/utils');
	const { showToast } = require('toast');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { selectFoldersByType, selectById: selectFolderById } = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { moveToFolder } = require('mail/statemanager/redux/slices/messages/thunk');
	const { Selector: FolderSelector } = require('mail/folder/selector');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	/**
	 * @typedef {Object} ChangeFolderResult
	 * @property {boolean} success
	 * @property {boolean} isTrash
	 */

	/**
	 * Resolves target folder and moves messages into it.
	 *
	 * @param {Object} params
	 * @param {number[]} params.objectIds
	 * @param {string[]} params.objectUidIds
	 * @param {string|null} [params.folderSignature=null]
	 * @param {Object|null} [params.folder=null]
	 * @returns {ChangeFolderResult}
	 */
	function changeFolder({ objectIds, objectUidIds, folderSignature = null, folder = null })
	{
		if (folder === null && DefaultFolderType.isDefined(folderSignature))
		{
			const defaultFolder = selectFoldersByType(store.getState(), folderSignature, true);
			if (defaultFolder.length === 0)
			{
				const mailboxId = selectCurrentMailboxId(store.getState());
				const title = (DefaultFolderType.TRASH.getValue() === folderSignature)
					? Loc.getMessage('MAILMOBILE_MESSAGE_ACTIONS_FOLDERS_TRASH_BANNER_TITLE')
					: Loc.getMessage('MAILMOBILE_MESSAGE_ACTIONS_FOLDERS_SPAM_BANNER_TITLE')
				;
				qrauth.open({
					title,
					hintText: Loc.getMessage('MAILMOBILE_MESSAGE_ACTIONS_FOLDERS_SETTINGS_BANNER_DESCRIPTION'),
					redirectUrl: `/mail/config/dirs?mailboxId=${mailboxId}`,
					showHint: true,
				});

				return { success: false, isTrash: false };
			}
		}

		let resolvedFolder = folder;

		if (resolvedFolder === null)
		{
			resolvedFolder = Object.values(DefaultFolderType).some((type) => type.value === folderSignature)
				? selectFoldersByType(store.getState(), folderSignature, true)?.find(() => true)
				: selectFolderById(store.getState(), folderSignature)
			;
		}

		if (!resolvedFolder || objectIds.length === 0)
		{
			return { success: false, isTrash: false };
		}

		dispatch(moveToFolder({
			objectIds,
			objectUidIds,
			folderPath: resolvedFolder.path,
		}));

		const isTrash = DefaultFolderType.isTrashFolder(resolvedFolder.type);
		const toastMessage = isTrash
			? Loc.getMessage('MAILMOBILE_MESSAGE_ACTIONS_IN_TRASH_TOAST')
			: Loc.getMessage('MAILMOBILE_MESSAGE_ACTIONS_IN_FOLDER_TOAST', { '#FOLDER_NAME#': resolvedFolder.name })
		;

		showToast({ message: toastMessage });

		return { success: true, isTrash };
	}

	/**
	 * Opens folder selector widget for moving messages.
	 *
	 * @param {Object} params
	 * @param {Function} params.onSelect
	 * @param {Object} [params.parentWidget]
	 * @param {Object} [params.selectorProps]
	 */
	function openFolderSelector({ onSelect, parentWidget, selectorProps = {} })
	{
		const opener = parentWidget || PageManager;
		const widgetConfig = {
			...FolderSelector.FOLDER_LAYOUT_PROPERTIES_MOVE,
			onReady: (layoutWidget) => {
				layoutWidget.showComponent(new FolderSelector({
					layoutWidget,
					mode: FolderSelector.MOVE_MODE,
					onSelect,
					...selectorProps,
				}));
			},
		};

		if (parentWidget)
		{
			opener.openWidget('layout', widgetConfig, parentWidget);
		}
		else
		{
			opener.openWidget('layout', widgetConfig);
		}
	}

	module.exports = { changeFolder, openFolderSelector };
});
