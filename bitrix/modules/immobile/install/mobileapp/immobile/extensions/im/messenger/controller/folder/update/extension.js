/**
 * @module im/messenger/controller/folder/update
 */
jn.define('im/messenger/controller/folder/update', (require, exports, module) => {
	const { Type } = require('type');
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('im/messenger/loc');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { FolderChatSelector } = require('im/messenger/controller/folder/chat-selector');
	const { FolderFormView } = require('im/messenger/controller/folder/lib/ui/folder-form');
	const { preloadIncompleteChats } = require('im/messenger/controller/folder/lib/preload-chats');
	const { preloadFolderChats } = require('im/messenger/controller/folder/lib/preload-folder-chats');
	const { updateFolder, showUpdateSuccessToast } = require('im/messenger/controller/folder/lib/actions');
	const { IconType } = require('im/messenger/assets/icon');

	const logger = getLoggerWithContext('folder--update', 'FolderUpdate');

	class FolderUpdate
	{
		/**
		 * @param {object} options
		 * @param {number|string} options.id - folder ID (coerced to integer)
		 */
		constructor({ id })
		{
			this.id = Number(id);
			this.layoutWidget = null;
			this.opener = null;
			this.submitButton = null;
			this.formView = null;

			const folder = this.#getFolder();
			this.folderTitle = folder?.title || '';
			this.chatIds = this.#resolveDialogIds(folder?.chatIds || []);
		}

		async open(parentWidget = PageManager)
		{
			this.opener = parentWidget;
			// im.v2.Folder.get returns the folder + all member chats (including
			// hidden-from-recent) + companion users in one shot. We preload them
			// straight into dialoguesModel/usersModel; without this, FolderFormView
			// would render hidden chats as raw chatId placeholder + empty avatar.
			const preloaded = await preloadFolderChats(this.id);
			if (preloaded)
			{
				const serverChatIds = preloaded.folder?.definition?.chatIds ?? preloaded.chatIds;
				this.chatIds = this.#resolveDialogIds(serverChatIds);
			}
			parentWidget.openWidget('layout', {
				titleParams: this.getTitleParams(),
				backgroundColor: Theme.colors.bgPrimary,
				onReady: (layoutWidget) => {
					this.layoutWidget = layoutWidget;
					layoutWidget.showComponent(this.createFormView());
				},
			}).catch((error) => {
				logger.error('open error', error);
			});
		}

		/** @protected */
		getTitleParams()
		{
			return {
				text: Loc.getMessage('IMMOBILE_FOLDER_UPDATE_NAV_TITLE'),
				type: 'dialog',
			};
		}

		/**
		 * @protected
		 * @return {FolderFormView}
		 */
		createFormView()
		{
			return new FolderFormView({
				submitText: Loc.getMessage('IMMOBILE_FOLDER_UPDATE_SAVE_BUTTON'),
				headerIconType: IconType.folderSettings,
				showRemoveChats: true,
				initialTitle: this.folderTitle,
				initialChatIds: this.chatIds,
				layoutWidget: this.layoutWidget,
				submitButtonRef: (btn) => {
					this.submitButton = btn;
				},
				formViewRef: (view) => {
					this.formView = view;
				},
				onAddChats: (currentChatIds, callback) => {
					FolderChatSelector.open({
						selectedChatIds: currentChatIds,
						onComplete: callback,
					}, this.layoutWidget);
				},
				onSubmit: ({ title, chatIds }) => {
					this.onSubmit({ title, chatIds });
				},
			});
		}

		/**
		 * @protected
		 * @param {{ title: string, chatIds: Array<string|number> }} params
		 */
		async onSubmit({ title, chatIds })
		{
			if (this.isSubmitting)
			{
				return;
			}

			this.isSubmitting = true;
			try
			{
				await preloadIncompleteChats(chatIds);
				const nextChatIds = this.#resolveChatIds(chatIds);
				const diff = this.#getChatIdsDiff(nextChatIds);
				await updateFolder({
					folderId: this.id,
					title,
					addChatIds: diff.addChatIds,
					removeChatIds: diff.removeChatIds,
					layoutWidget: this.layoutWidget,
				});

				this.formView?.markSaved();
				showUpdateSuccessToast(this.layoutWidget);
			}
			catch (error)
			{
				logger.error('submit error', error);
			}
			finally
			{
				this.isSubmitting = false;
				this.submitButton?.setLoading(false);
			}
		}

		#getFolder()
		{
			return serviceLocator.get('core').getStore().getters['folderModel/getById'](this.id);
		}

		#resolveDialogIds(chatIds)
		{
			const store = serviceLocator.get('core').getStore();

			return chatIds
				.map((chatId) => {
					const dialog = store.getters['dialoguesModel/getByChatId'](chatId);

					return dialog?.dialogId ?? `chat${chatId}`;
				});
		}

		#resolveChatIds(dialogIds)
		{
			const store = serviceLocator.get('core').getStore();

			return dialogIds
				.map((dialogId) => {
					const dialog = store.getters['dialoguesModel/getById'](dialogId);

					return dialog?.chatId ?? null;
				})
				.filter((chatId) => Type.isInteger(chatId) && chatId > 0);
		}

		#getChatIdsDiff(nextChatIds)
		{
			const currentChatIds = this.#resolveChatIds(this.chatIds);
			const currentSet = new Set(currentChatIds);
			const nextSet = new Set(nextChatIds);

			return {
				addChatIds: nextChatIds.filter((chatId) => !currentSet.has(chatId)),
				removeChatIds: currentChatIds.filter((chatId) => !nextSet.has(chatId)),
			};
		}
	}

	module.exports = { FolderUpdate };
});
