/**
 * @module disk/copy
 */
jn.define('disk/copy', (require, exports, module) => {
	const { Loc } = require('loc');
	const { DirectorySelector } = require('selector/widget/entity/tree-selectors/directory-selector');

	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { copy } = require('disk/statemanager/redux/slices/files/thunk');
	const { selectById } = require('disk/statemanager/redux/slices/files/selector');
	const { selectById: selectStorageById } = require('disk/statemanager/redux/slices/storages');

	const { showToast, showErrorToast } = require('toast');
	const { openFolder } = require('disk/opener/folder');
	const { fetchObjectWithRights } = require('disk/rights');
	const { fetchPersonalStorageId } = require('disk/storage/personal');
	const { requireLazy } = require('require-lazy');
	const { Type } = require('type');

	const showUnifiedLinkForbiddenToast = async (parentWidget) => {
		const opener = await requireLazy('disk:opener/unified-link/opener', false);

		opener?.showUnifiedLinkForbiddenToast(parentWidget);
	};

	async function copyObject(objectId, order, context, parentWidget = PageManager)
	{
		const copiedObject = selectById(store.getState(), objectId);
		const isUnifiedLinkMode = Boolean(context?.uniqueCode);
		const storageId = isUnifiedLinkMode
			? await fetchPersonalStorageId()
			: (context.storageId || copiedObject.storageId);

		if (!storageId)
		{
			showErrorToast({}, parentWidget);

			return;
		}

		const selector = new DirectorySelector({
			widgetParams: {
				backdrop: {
					mediumPositionPercent: 70,
					horizontalSwipeAllowed: false,
				},
				sendButtonName: Loc.getMessage('M_DISK_COPY_SELECTOR_BUTTON'),
			},
			allowMultipleSelection: false,
			closeOnSelect: false,
			events: {
				onClose: ({ parentItem }) => {
					const targetId = parentItem.rootObjectId || parentItem.id;
					finalizeCopy(objectId, targetId, { context, parentWidget });
				},
			},
			provider: {
				storageId,
				options: {
					showDirectoriesOnly: false,
					canSelectFiles: false,
					order,
					context: { storageId },
				},
			},
		});

		selector.getSelector().show({}, parentWidget);
	}

	async function finalizeCopy(objectId, targetId, openFolderOptions)
	{
		const copiedObject = selectById(store.getState(), objectId);

		const isUnifiedLinkMode = Boolean(openFolderOptions.context?.uniqueCode);
		if (isUnifiedLinkMode && !Type.isStringFilled(copiedObject?.uniqueCode))
		{
			void showUnifiedLinkForbiddenToast(openFolderOptions.parentWidget);

			return;
		}

		const target = await fetchObjectWithRights(targetId);

		if (!target || copiedObject.parentId === targetId)
		{
			return;
		}

		let targetName = target.name;
		if (target.parentId === 0)
		{
			const storage = selectStorageById(store.getState(), target.storageId);
			if (storage.type === 'user')
			{
				targetName = Loc.getMessage('M_DISK_COPY_MY_STORAGE_NAME');
			}
		}

		if (target.rights.canAdd === false)
		{
			showToast({
				message: Loc.getMessage('M_DISK_COPY_ACCESS_DENIED_TOAST_MESSAGE', {
					'#FOLDER#': targetName,
				}),
			}, openFolderOptions.parentWidget);

			return;
		}
		dispatch(
			copy({
				objectId,
				targetId: target.id,
				uniqueCode: isUnifiedLinkMode ? copiedObject.uniqueCode : null,
				onFulfilledSuccess: () => {
					const toastMessagePhraseId =	copiedObject.typeFile
						? 'M_DISK_COPY_FILE_TOAST_MESSAGE'
						: 'M_DISK_COPY_FOLDER_TOAST_MESSAGE';
					showToast({
						message: Loc.getMessage(toastMessagePhraseId, {
							'#FOLDER#': targetName,
						}),
						buttonText: Loc.getMessage('M_DISK_COPY_TOAST_BUTTON'),
						onButtonTap: () => {
							openFolder(
								target.id,
								{ storageId: openFolderOptions.context?.storageId },
								openFolderOptions.parentWidget,
							).catch((e) => console.error(e));
						},
					}, openFolderOptions.parentWidget);
				},
			}),
		);
	}

	module.exports = { copyObject };
});
