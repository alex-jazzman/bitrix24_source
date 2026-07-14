/**
 * @module im/messenger/application/lib/dialog-manager/src/manager
 */
jn.define('im/messenger/application/lib/dialog-manager/src/manager', (require, exports, module) => {
	const { Type } = require('type');
	const {
		DialogType,
		ErrorType,
		EventType,
	} = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { VisibilityManager } = require('im/messenger/lib/visibility-manager');
	const { createOpenTaskCommentsOptions } = require('im/messenger/lib/integration/tasksmobile/comments/opener');
	const {
		Notification,
		ToastType,
	} = require('im/messenger/lib/ui/notification');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { normalizeOpenDialogOptions } = require('im/messenger/application/lib/dialog-manager/src/normalizer');
	const {
		createDialogByChatType,
		createDialogByModel,
	} = require('im/messenger/application/lib/dialog-manager/src/resolver');
	const { NestedNavigationStrategy } = require('im/messenger/application/lib/dialog-manager/src/nested-strategy/nested-navigation');
	const { DialogOpenContext } = require('im/messenger/application/lib/dialog-manager/src/open-context');
	const {
		ProjectsTariffRestrictionFilter,
	} = require('im/messenger/application/lib/dialog-manager/src/open-filter/projects-tariff-restriction');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { openPlanLimitsWidgetByError } = require('im/messenger/lib/plan-limit');

	/**
	 * @class DialogManager
	 */
	class DialogManager
	{
		/** @type {Array<Dialog>} */
		#dialogList = [];
		#chatService = new ChatService();
		/** @type {Map<string, Promise<{ chatId: number }>>} */
		#loadingPromises = new Map();
		/** @type {BaseNestedStrategy[]} */
		#nestedStrategies = [
			new NestedNavigationStrategy(),
		];
		/** @type {BaseOpenDialogFilter[]} */
		#openFilters = [
			new ProjectsTariffRestrictionFilter(),
		];

		constructor()
		{
			this.logger = getLoggerWithContext('messenger--dialog-manager', this);
		}

		/**
		 * @return {Dialog|null}
		 */
		getFirstOpenDialog()
		{
			return this.getOpenDialogByIndex(0);
		}

		/**
		 * @return {Dialog|null}
		 */
		getLastOpenDialog()
		{
			return this.getOpenDialogByIndex(this.#dialogList.length - 1);
		}

		/**
		 * @return {Dialog|null}
		 */
		getOpenDialogByIndex(index)
		{
			return (Type.isArrayFilled(this.#dialogList) && this.#dialogList[index]) ? this.#dialogList[index] : null;
		}

		/**
		 * @param {DialogOpenOptions} options
		 * @param {PageManager} parentWidget
		 * @return {Promise<boolean>}
		 */
		async openDialog(options, parentWidget = PageManager)
		{
			let normalizedOptions = normalizeOpenDialogOptions(options);
			const dialogId = normalizedOptions.dialogId;
			if (!Type.isStringFilled(dialogId))
			{
				return false;
			}

			const isVisible = await this.#isDialogVisible(dialogId);
			if (isVisible)
			{
				return false;
			}

			if (normalizedOptions.makeTabActive)
			{
				PageManager.getNavigator().makeTabActive();
			}

			const resolveResult = await this.#resolveDialog(normalizedOptions, options);
			if (!resolveResult)
			{
				return false;
			}

			const { dialog, dialogModel } = resolveResult;
			normalizedOptions = resolveResult.options;

			const context = new DialogOpenContext({
				dialogModel,
				options: normalizedOptions,
				parentWidget,
				loadDialogModel: (id) => this.#loadDialogModel(id),
			});

			if (!await this.#applyOpenFilters(context))
			{
				return false;
			}

			const dialogHelper = dialogModel ? DialogHelper.createByModel(dialogModel) : null;

			if (await this.#shouldApplyNestedStrategy(normalizedOptions, context))
			{
				await this.#applyNestedStrategy(dialogHelper);
			}

			if (this.#isOpenline(dialogHelper))
			{
				this.#openAsOpenline(dialog, dialogHelper);

				return true;
			}

			const trackedOptions = this.#trackDialog(dialog, normalizedOptions);

			this.logger.log('openDialog: options: ', trackedOptions);

			await dialog.open(trackedOptions, parentWidget);

			return true;
		}

		/**
		 * @param {string} dialogId
		 * @return {Promise<boolean>}
		 */
		async #isDialogVisible(dialogId)
		{
			return VisibilityManager.getInstance().checkIsDialogVisible({
				dialogId,
				currentContextOnly: true,
			});
		}

		/**
		 * @param {DialogOpenOptions} normalizedOptions
		 * @param {DialogOpenOptions} originalOptions
		 * @return {Promise<{dialog: Dialog, dialogModel: DialoguesModelState|null, options: DialogOpenOptions}|null>}
		 */
		async #resolveDialog(normalizedOptions, originalOptions)
		{
			const dialogId = normalizedOptions.dialogId;
			const dialogModel = await this.#loadDialogModel(dialogId);

			let dialog = await createDialogByChatType(normalizedOptions.chatType);
			this.logger.log('resolveDialog: dialog by chatType', dialog);
			if (dialog)
			{
				return { dialog, dialogModel, options: normalizedOptions };
			}

			if (!Type.isPlainObject(dialogModel))
			{
				return null;
			}

			dialog = await createDialogByModel(dialogModel);

			// TODO: MessengerV2 generalize the processing of chat integrations
			let options = normalizedOptions;
			if (
				!Type.isPlainObject(originalOptions.integrationSettings)
				&& dialogModel.type === DialogType.tasksTask
				&& Type.isStringFilled(dialogModel.entityId)
			)
			{
				options = {
					...options,
					...createOpenTaskCommentsOptions(
						dialogModel.chatId,
						Number(dialogModel.entityId),
						normalizedOptions.messageId,
					),
				};
			}

			this.logger.log('resolveDialog: dialog by model', dialog);

			return { dialog, dialogModel, options };
		}

		/**
		 * @param {DialogOpenOptions} normalizedOptions
		 * @param {DialogOpenContext} context
		 * @return {Promise<boolean>}
		 */
		async #shouldApplyNestedStrategy(normalizedOptions, context)
		{
			if (normalizedOptions.skipNestedStrategy)
			{
				return false;
			}

			if (!Feature.isNestedChatAvailable)
			{
				return false;
			}

			return context.isProjectOrChildOfProject();
		}

		/**
		 * @param {DialogOpenContext} context
		 * @return {Promise<boolean>}
		 */
		async #applyOpenFilters(context)
		{
			// Sequential with early exit. Filters enforce business policy and may have
			// side effects, so subsequent filters never run after a block or a failure.
			// A filter that throws is treated as a block: state is unknown, policy could
			// be bypassed otherwise. Surface a generic error toast.
			for (const filter of this.#openFilters)
			{
				try
				{
					// eslint-disable-next-line no-await-in-loop
					const allowed = await filter.allow(context);
					if (!allowed)
					{
						return false;
					}
				}
				catch (error)
				{
					this.logger.error('applyOpenFilters: filter threw, blocking open', error);
					Notification.showErrorToast();

					return false;
				}
			}

			return true;
		}

		/**
		 * @param {string} dialogId
		 * @return {Promise<DialoguesModelState|null>}
		 */
		async #loadDialogModel(dialogId)
		{
			try
			{
				return await this.#chatService.getDialogByDialogId(dialogId);
			}
			catch (error)
			{
				DialogManager.showToastByOpenDialogError(error);
				this.logger.error('loadDialogModel: failed to load dialog', dialogId, error);
				await openPlanLimitsWidgetByError(error?.[0] ?? error ?? {});

				return null;
			}
		}

		/**
		 * @param {DialogHelper} dialogHelper
		 * @return {Promise<void>}
		 */
		async #applyNestedStrategy(dialogHelper)
		{
			const strategy = this.#nestedStrategies.find((s) => s.shouldApply(dialogHelper));
			if (!strategy)
			{
				return;
			}

			try
			{
				await strategy.execute(dialogHelper);
			}
			catch (error)
			{
				this.logger.error('applyNestedStrategy: failed', error);
			}
		}

		/**
		 * @param {Dialog} dialog
		 * @param {DialogOpenOptions} normalizedOptions
		 * @return {DialogOpenOptions}
		 */
		#trackDialog(dialog, normalizedOptions)
		{
			this.#dialogList.push(dialog);

			const originalCloseHandler = Type.isFunction(normalizedOptions.onClose)
				? normalizedOptions.onClose
				: () => {}
			;

			return {
				...normalizedOptions,
				onClose: () => {
					this.#dialogList = this.#dialogList.filter((openDialog) => openDialog !== dialog);
					BX.postComponentEvent(EventType.messenger.dialogClosed, [{ dialogId: normalizedOptions.dialogId }]);
					originalCloseHandler();
				},
			};
		}

		/**
		 * @param {DialogHelper|null} dialogHelper
		 * @return {boolean}
		 */
		#isOpenline(dialogHelper)
		{
			return dialogHelper?.isOpenlines === true;
		}

		/**
		 * @param {Dialog} dialog
		 * @param {DialogHelper} dialogHelper
		 */
		#openAsOpenline(dialog, dialogHelper)
		{
			dialog.openLine({
				dialogId: dialogHelper.dialogId,
				dialogTitleParams: {
					chatType: DialogType.lines,
				},
			});
		}

		/**
		 * @param {Object} options
		 * @param {() => Promise<{ chatId: number }>} options.dataLoader
		 * @param {string} options.chatType
		 * @return {Promise<boolean>}
		 */
		async openOptimisticDialog(options)
		{
			const chatType = options.chatType;
			const loadingPromise = this.#getOrStoreLoadingPromise(chatType, options.dataLoader);

			const dialog = await createDialogByChatType(chatType);
			this.#dialogList.push(dialog);

			const onClose = () => {
				this.#dialogList = this.#dialogList.filter((d) => d !== dialog);
			};

			await dialog.openOptimistic({
				onClose,
				loadingPromise,
				chatType,
			});

			return true;
		}

		/**
		 * @param {string} chatType
		 * @param {() => Promise<{ chatId: number }>} dataLoader
		 * @return {Promise<{ chatId: number }>}
		 */
		#getOrStoreLoadingPromise(chatType, dataLoader)
		{
			const existing = this.#loadingPromises.get(chatType);
			if (existing)
			{
				return existing;
			}

			const promise = dataLoader();
			this.#loadingPromises.set(chatType, promise);
			// eslint-disable-next-line promise/catch-or-return
			promise.finally(() => {
				this.#loadingPromises.delete(chatType);
			});

			return promise;
		}

		static showToastByOpenDialogError(error)
		{
			const errorCode = error[0]?.code;
			switch (errorCode)
			{
				case ErrorType.dialog.accessDenied:
					Notification.showToast(ToastType.chatAccessDenied);
					break;

				case ErrorType.dialog.chatNotFound:
					Notification.showToast(ToastType.chatAccessDenied);
					break;

				case ErrorType.networkError:
					Notification.showOfflineToast();
					break;

				default:
					break;
			}
		}
	}

	module.exports = {
		DialogManager,
	};
});
