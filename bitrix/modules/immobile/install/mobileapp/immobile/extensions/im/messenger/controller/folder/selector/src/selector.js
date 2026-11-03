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
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { FolderSelectorList } = require('im/messenger/controller/folder/selector/selector-list');
	const { setChatFolders, showSetChatFoldersSuccessToast } = require('im/messenger/controller/folder/lib/actions');

	const logger = getLoggerWithContext('folder--selector', 'FolderSelector');

	const folderIconUri = withCurrentDomain(DiskIcon.DISK_FOLDER_BLUE.getPath());

	class FolderSelector
	{
		/**
		 * @param {object} options
		 * @param {number} options.chatId
		 * @param {DialogId} [options.dialogId] - chat of the membership labels; without it none is sent
		 * @param {string} [options.subSection] - surface the selector was opened from
		 * @param {LayoutWidget} [options.parentWidget]
		 * @param {Function} [options.onComplete]
		 */
		static open({ chatId, dialogId, subSection, parentWidget, onComplete })
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
			// The selector stays open after a save, so the baseline of the membership labels moves with
			// it: a second save reports only what that save changed.
			let savedFolderIds = [...selectedFolderIds];
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

								FolderSelector.sendMembershipAnalytics({
									dialogId,
									subSection,
									savedFolderIds,
									folderIds,
								});
								savedFolderIds = [...folderIds];

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

		/**
		 * @desc The selector saves the whole set of folders of one chat, so what the user did with the
		 *       memberships is the difference between the set it had stored and the one it saved. The
		 *       label carries no folder, so a chat put into two folders at once is two facts.
		 * @param {object} params
		 * @param {DialogId} [params.dialogId]
		 * @param {string} [params.subSection]
		 * @param {Array<number>} params.savedFolderIds
		 * @param {Array<number>} params.folderIds
		 */
		static sendMembershipAnalytics({ dialogId, subSection, savedFolderIds, folderIds })
		{
			if (!dialogId)
			{
				return;
			}

			const analyticsService = AnalyticsService.getInstance();
			const selectedBefore = new Set(savedFolderIds);
			const selectedAfter = new Set(folderIds);

			folderIds
				.filter((folderId) => !selectedBefore.has(folderId))
				.forEach(() => analyticsService.sendAddToFolder({ dialogId, subSection }));

			savedFolderIds
				.filter((folderId) => !selectedAfter.has(folderId))
				.forEach(() => analyticsService.sendDeleteFromFolder({ dialogId, subSection }));
		}
	}

	module.exports = { FolderSelector };
});
