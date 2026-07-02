/**
 * @module im/messenger/controller/folder/selector/selector
 */
jn.define('im/messenger/controller/folder/selector/selector', (require, exports, module) => {
	const { isOnline } = require('device/connection');
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');
	const { Color } = require('tokens');
	const { withCurrentDomain } = require('utils/url');
	const { BottomSheet } = require('bottom-sheet');
	const { DiskIcon } = require('assets/icons');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { FolderSelectorList } = require('im/messenger/controller/folder/selector/selector-list');
	const { setChatFolders, showSetChatFoldersSuccessToast } = require('im/messenger/controller/folder/lib/actions');

	const logger = getLoggerWithContext('folder--selector', 'FolderSelector');

	const folderIconUri = withCurrentDomain(DiskIcon.DISK_FOLDER_BLUE.getPath());

	class FolderSelector
	{
		static open({ chatId, parentWidget, onComplete })
		{
			const opener = parentWidget || PageManager;

			if (!isOnline())
			{
				Notification.showOfflineToast({}, opener);

				return;
			}

			if (!serviceLocator.get('core'))
			{
				logger.error('open: messenger core is not ready');
				Notification.showErrorToast({}, opener);

				return;
			}

			const normalizedChatId = Number(chatId);
			if (!Type.isInteger(normalizedChatId) || normalizedChatId <= 0)
			{
				logger.error('open: invalid chatId', chatId);

				return;
			}

			const store = serviceLocator.get('core').getStore();
			const folders = store.getters['folderModel/getPersonalFolders']();
			const selectedFolderIds = store.getters['folderModel/getFoldersForChat'](normalizedChatId)
				.map((folder) => folder.id);
			let selectorList = null;
			let isSubmitting = false;
			const bottomSheet = new BottomSheet({
				titleParams: {
					text: Loc.getMessage('IMMOBILE_FOLDER_PICKER_TITLE'),
					type: 'dialog',
				},
				component: (widget) => {
					selectorList = new FolderSelectorList({
						folders,
						selectedFolderIds,
						folderIconUri,
						onComplete: async (folderIds) => {
							if (isSubmitting)
							{
								return;
							}

							isSubmitting = true;
							try
							{
								await setChatFolders({
									chatId: normalizedChatId,
									folderIds,
									layoutWidget: widget,
								});

								selectorList?.markSaved();
								onComplete?.(folderIds);
								widget.close(() => showSetChatFoldersSuccessToast(parentWidget));
							}
							catch (error)
							{
								logger.error('set chat folders error', error);
							}
							finally
							{
								isSubmitting = false;
								selectorList?.saveButton?.setLoading(false);
							}
						},
					});

					return selectorList;
				},
			});

			bottomSheet
				.setParentWidget(opener)
				.setMediumPositionPercent(50)
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.open()
			;
		}
	}

	module.exports = { FolderSelector };
});
