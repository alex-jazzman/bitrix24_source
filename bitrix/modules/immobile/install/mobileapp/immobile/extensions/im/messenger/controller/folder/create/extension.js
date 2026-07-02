/**
 * @module im/messenger/controller/folder/create
 */
jn.define('im/messenger/controller/folder/create', (require, exports, module) => {
	const { isOnline } = require('device/connection');
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { Theme } = require('im/lib/theme');
	const { Loc } = require('im/messenger/loc');
	const { MAX_PERSONAL_FOLDERS } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { FolderChatSelector } = require('im/messenger/controller/folder/chat-selector');
	const { FolderFormView } = require('im/messenger/controller/folder/lib/ui/folder-form');
	const { preloadIncompleteChats } = require('im/messenger/controller/folder/lib/preload-chats');
	const { createFolder, showCreateSuccessToast } = require('im/messenger/controller/folder/lib/actions');

	const logger = getLoggerWithContext('folder--create', 'FolderCreate');

	class FolderCreate
	{
		/**
		 * @param {object} [options]
		 * @param {Array<string|number>} [options.initialChatIds=[]]
		 */
		constructor(options = {})
		{
			this.layoutWidget = null;
			this.opener = null;
			this.submitButton = null;
			this.formView = null;
			this.initialChatIds = Type.isArray(options.initialChatIds) ? options.initialChatIds : [];
		}

		open(parentWidget)
		{
			if (!this.#canOpen(parentWidget))
			{
				return;
			}

			this.opener = parentWidget || PageManager;

			this.opener.openWidget('layout', {
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

		openAsBottomSheet(parentWidget)
		{
			if (!this.#canOpen(parentWidget))
			{
				return;
			}

			this.opener = parentWidget || PageManager;

			void new BottomSheet({
				titleParams: this.getTitleParams(),
				component: (layoutWidget) => {
					this.layoutWidget = layoutWidget;

					return this.createFormView();
				},
			})
				.setParentWidget(this.opener)
				.alwaysOnTop()
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.open()
				.catch((error) => {
					logger.error('open error', error);
				})
			;
		}

		/** @protected */
		getTitleParams()
		{
			return {
				text: Loc.getMessage('IMMOBILE_FOLDER_CREATE_NAV_TITLE'),
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
				submitText: Loc.getMessage('IMMOBILE_FOLDER_CREATE_SUBMIT_BUTTON'),
				showRemoveChats: true,
				initialChatIds: this.initialChatIds,
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
				await createFolder({
					title,
					chatIds: this.#resolveChatIds(chatIds),
					layoutWidget: this.layoutWidget,
				});

				this.formView?.markSaved();
				const opener = this.opener;
				this.layoutWidget?.close(() => showCreateSuccessToast(opener));
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

		#resolveChatIds(dialogIds)
		{
			const store = this.#getStore();

			return dialogIds
				.map((dialogId) => {
					const dialog = store?.getters['dialoguesModel/getById'](dialogId);

					return dialog?.chatId ?? null;
				})
				.filter((chatId) => Type.isInteger(chatId) && chatId > 0);
		}

		#canOpen(parentWidget = null)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast({}, parentWidget);

				return false;
			}

			if (!this.#getStore())
			{
				logger.error('open error: messenger core is not ready');
				Notification.showErrorToast({}, parentWidget);

				return false;
			}

			if (this.#getPersonalFolderCount() >= MAX_PERSONAL_FOLDERS)
			{
				Notification.showErrorToast(
					{
						message: Loc.getMessage('IMMOBILE_FOLDER_CREATE_ERROR_LIMIT'),
					},
					parentWidget,
				);

				return false;
			}

			return true;
		}

		#getPersonalFolderCount()
		{
			return this.#getStore()?.getters['folderModel/getPersonalFolders']().length || 0;
		}

		#getStore()
		{
			return serviceLocator.get('core')?.getStore?.() || null;
		}
	}

	module.exports = { FolderCreate };
});
