/**
 * @module im/messenger/controller/folder/update
 */
jn.define('im/messenger/controller/folder/update', (require, exports, module) => {
	const { Type } = require('type');
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('im/messenger/loc');
	const { Analytics } = require('im/messenger/const');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { FolderChatSelector } = require('im/messenger/controller/folder/chat-selector');
	const { FolderFormView } = require('im/messenger/controller/folder/lib/ui/folder-form');
	const { preloadIncompleteChats } = require('im/messenger/controller/folder/lib/preload-chats');
	const { preloadFolderChats } = require('im/messenger/controller/folder/lib/preload-folder-chats');
	const {
		updateFolder,
		showUpdateSuccessToast,
		showFolderGenericErrorToast,
	} = require('im/messenger/controller/folder/lib/actions');
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
				this.chatIds = this.#extractDialogIds(preloaded);
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
				if (!nextChatIds)
				{
					showFolderGenericErrorToast(this.layoutWidget);

					return;
				}

				await updateFolder({
					folderId: this.id,
					title,
					chatIds: nextChatIds,
					layoutWidget: this.layoutWidget,
				});

				this.sendRemovedChatsAnalytics(chatIds);

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

		/**
		 * @protected
		 * @param {Array<string>} savedDialogIds
		 */
		sendRemovedChatsAnalytics(savedDialogIds)
		{
			const saved = new Set(savedDialogIds);
			const analyticsService = AnalyticsService.getInstance();

			this.chatIds
				.filter((dialogId) => !saved.has(dialogId))
				.forEach((dialogId) => analyticsService.sendDeleteFromFolder({
					dialogId,
					section: Analytics.Section.userFolder,
				}));

			this.chatIds = [...savedDialogIds];
		}

		#getFolder()
		{
			return serviceLocator.get('core').getStore().getters['folderModel/getById'](this.id);
		}

		/**
		 * Resolves the preloaded folder members to dialogIds for the form.
		 *
		 * Prefers the server-authoritative dialogId carried in `definition.chats`
		 * (group → "chat" + chatId, private → companion userId). This is the exact
		 * value the form needs and avoids the client-side chatId → dialogId lookup,
		 * which mis-resolved private chats whose companion was not yet in
		 * dialoguesModel to a wrong `chat${chatId}` id.
		 *
		 * Falls back to the local store lookup only on the cache-hit path, where
		 * `preloaded.folder` is the flat local model (no `definition`) and every
		 * member is guaranteed to already live in dialoguesModel.
		 *
		 * @param {{ folder: object, chatIds: Array<number> }} preloaded
		 * @return {Array<string>}
		 */
		#extractDialogIds(preloaded)
		{
			const chats = preloaded.folder?.definition?.chats;
			if (Type.isArray(chats))
			{
				return chats
					.map((chat) => chat.dialogId)
					.filter((dialogId) => Type.isStringFilled(dialogId));
			}

			return this.#resolveDialogIds(preloaded.chatIds ?? []);
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

		/**
		 * @param {Array<string|number>} dialogIds
		 * @return {Array<number>|null} null when at least one dialogId has no chatId in dialoguesModel.
		 *   The save sends the whole composition, so dropping such a member would delete that chat
		 *   from the folder, so the caller refuses the save instead.
		 */
		#resolveChatIds(dialogIds)
		{
			const store = serviceLocator.get('core').getStore();

			const chatIds = dialogIds.map((dialogId) => {
				const dialog = store.getters['dialoguesModel/getById'](dialogId);
				const chatId = dialog?.chatId ?? null;

				return Type.isInteger(chatId) && chatId > 0 ? chatId : null;
			});

			const unresolvedDialogIds = dialogIds.filter((dialogId, index) => chatIds[index] === null);
			if (unresolvedDialogIds.length > 0)
			{
				logger.error('resolveChatIds: dialogIds with no chatId in the model', unresolvedDialogIds);

				return null;
			}

			return [...new Set(chatIds)];
		}
	}

	module.exports = { FolderUpdate };
});
