/* eslint-disable es/no-nullish-coalescing-operators */

/**
 * @module im/messenger/controller/dialog/copilot/dialog
 */
jn.define('im/messenger/controller/dialog/copilot/dialog', (require, exports, module) => {
	const { Uuid } = require('utils/uuid');

	const {
		BotCode,
		DialogWidgetType,
		OpenDialogContextType,
	} = require('im/messenger/const');
	const { MessageService } = require('im/messenger/provider/services/message');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const { Feature } = require('im/messenger/lib/feature');
	const { getLogger } = require('im/messenger/lib/logger');

	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { MessageUiConverter } = require('im/messenger/lib/converter/ui/message');

	const { Dialog } = require('im/messenger/controller/dialog/chat');
	const { DialogConfigurator, configs } = require('im/messenger/controller/dialog/lib/configurator');

	const { BackgroundManager } = require('im/messenger/controller/dialog/lib/background');
	const { CopilotMentionManager } = require('im/messenger/controller/dialog/copilot/component/mention/manager');

	const logger = getLogger('dialog--dialog');

	/**
	 * @class CopilotDialog
	 */
	class CopilotDialog extends Dialog
	{
		getDialogWidgetType()
		{
			return DialogWidgetType.copilot;
		}

		checkCanHaveAttachments()
		{
			return Feature.isAttachPickerForBitrixGPTAvailable;
		}

		/**
		 * @returns {Array<string>}
		 */
		visibleAttachItems()
		{
			return [];
		}

		/**
		 * @returns {boolean}
		 */
		checkCanRecordVideo() {
			return false;
		}

		/**
		 * @returns {boolean}
		 */
		checkNeedKeyboardOverContent()
		{
			return Feature.isCopilotAnimatedScrollSupported;
		}

		/**
		 * @returns {boolean}
		 */
		checkCanShowStickerButton()
		{
			return false;
		}

		subscribeViewEvents()
		{
			super.subscribeViewEvents();
			this.disableParentClassViewEvents();
		}

		disableParentClassViewEvents()
		{}

		subscribeStoreEvents()
		{
			super.subscribeStoreEvents();
			this.subscribeCopilotStoreEvents();
		}

		subscribeCopilotStoreEvents()
		{
			this.storeManager
				.on('dialoguesModel/copilotModel/update', this.dialogUpdateHandlerRouter)
				.on('dialoguesModel/copilotModel/updateCollection', this.copilotCollectionUpdateHandler)
				.on('dialoguesModel/copilotModel/addCollection', this.copilotCollectionUpdateHandler)
			;
		}

		unsubscribeStoreEvents()
		{
			super.unsubscribeStoreEvents();
			this.unsubscribeCopilotStoreEvents();
		}

		unsubscribeCopilotStoreEvents()
		{
			this.storeManager
				.off('dialoguesModel/copilotModel/update', this.dialogUpdateHandlerRouter)
				.off('dialoguesModel/copilotModel/updateCollection', this.copilotCollectionUpdateHandler)
				.off('dialoguesModel/copilotModel/addCollection', this.copilotCollectionUpdateHandler)
			;
		}

		bindMethods()
		{
			super.bindMethods();
			/** @private */
			this.copilotCollectionUpdateHandler = this.copilotCollectionUpdateHandler.bind(this);
		}

		/**
		 * @desc setCollection commits addCollection/updateCollection mutations, not update,
		 * so the header title must be redrawn here as well (e.g. after loadChatWithMessages).
		 * @param {object} mutation
		 * @param {MutationPayload<CopilotUpdateCollectionData|CopilotAddCollectionData, CopilotUpdateActions|CopilotAddActions>} mutation.payload
		 */
		copilotCollectionUpdateHandler(mutation)
		{
			const { updateItems = [], addItems = [] } = mutation.payload.data;
			const currentDialogId = String(this.getDialogId());
			const hasCurrentDialogChanges = [...updateItems, ...addItems]
				.some((item) => String(item.dialogId) === currentDialogId)
			;

			if (!hasCurrentDialogChanges)
			{
				return;
			}

			void this.headerTitle.renderTitle();
		}

		/**
		 * @param {?ChatIntegrationSettings} integrationSettings
		 */
		initConfigurator(integrationSettings)
		{
			this.configurator = new DialogConfigurator({ ...configs?.copilotDialogConfig, ...integrationSettings });
			this.locator.add('configurator', this.configurator);
		}

		async initManagers()
		{
			await super.initManagers();
		}

		initMentionManager()
		{
			const dialogModelState = this.store.getters['dialoguesModel/getById'](this.dialogId);
			const hasMoreThanTwoUsers = dialogModelState?.userCounter > 2;
			if (hasMoreThanTwoUsers || Feature.isBitrixGptV2Available)
			{
				this.mentionManager = new CopilotMentionManager({
					view: this.view,
					dialogId: this.dialogId,
				});
			}
		}

		async open(options, parentWidget = PageManager, openPerfPoint = null)
		{
			const {
				dialogId,
				messageId,
				withMessageHighlight,
				dialogTitleParams,
				integrationSettings,
				onClose = () => {},
			} = options;

			this.openPerfPoint = openPerfPoint;

			this.onClose = onClose;
			this.initConfigurator(integrationSettings);
			this.headerTitleControllerClassLoadPromise = this.configurator.getHeaderTitleControllerClass();
			this.headerButtonsControllerClassLoadPromise = this.configurator.getHeaderButtonsControllerClass();

			this.dialogId = dialogId;
			this.dialogCode = `im.dialog-${this.getDialogId()}-${Uuid.getV4()}`;
			this.locator.add('dialogId', this.dialogId);
			this.messageUiConverter = new MessageUiConverter({ dialogId, dialogCode: this.dialogCode });
			this.locator.add('message-ui-converter', this.messageUiConverter);
			this.contextMessageId = messageId ?? null;
			this.withMessageHighlight = withMessageHighlight ?? false;
			void this.store.dispatch('applicationModel/openDialogId', dialogId);

			this.openPerfPoint?.startPoint('load-messages-from-db');
			const hasDialog = await this.loadDialogFromDb();
			if (hasDialog)
			{
				this.messageService = new MessageService({
					store: this.store,
					chatId: this.getChatId(),
					dialogId: this.getDialogId(),
				});
			}

			this.backgroundManager = new BackgroundManager({
				dialogId: this.dialogId,
				dialogLocator: this.locator,
			});

			this.firstDbPagePromise = this.loadHistoryMessagesFromDb();
			this.openPerfPoint?.endPoint('load-messages-from-db');

			let titleParams = null;
			if (dialogTitleParams)
			{
				titleParams = {
					text: dialogTitleParams.name,
					detailText: dialogTitleParams.description,
					imageUrl: dialogTitleParams.avatar,
					useLetterImage: true,
				};

				if (!dialogTitleParams.avatar || dialogTitleParams.avatar === '')
				{
					titleParams.imageColor = dialogTitleParams.color;
				}
			}

			this.openPerfPoint?.startPoint('create-widget');
			await this.createWidget(titleParams)
				.catch((error) => {
					logger.error(`${this.constructor.name}.createWidget error:`, error);
				})
			;
			this.openPerfPoint?.endPoint('create-widget');
		}

		/**
		 * @override
		 * @return {DialogHeaderTitleParams}
		 */
		getOptimisticTitleParams()
		{
			return ChatTitle.createOptimisticCopilotTitleParams();
		}


		/**
		 *
		 * @param index
		 * @param {Message} message
		 */
		messageAvatarLongTapHandler(index, message)
		{
			const messageModel = this.store.getters['messagesModel/getById'](message.id);
			const dialogModel = this.store.getters['usersModel/getById'](messageModel.authorId);

			if (dialogModel.botData?.code === BotCode.copilot)
			{
				return;
			}

			super.messageAvatarLongTapHandler(index, message);
		}

		/**
		 * @override
		 * @param {Object} mutation
		 * @void
		 */
		checkAvailableMention(mutation)
		{
			if (!mutation.type.includes('dialoguesModel'))
			{
				return;
			}

			// eslint-disable-next-line es/no-optional-chaining
			if (mutation.payload.data?.fields?.userCounter > 2)
			{
				this.mentionManager ??= new CopilotMentionManager({
					view: this.view,
					dialogId: this.dialogId,
				});
				this.view.setKeyboardOverContent(true);
			}
			else
			{
				if (!Feature.isBitrixGptV2Available)
				{
					this.mentionManager?.unsubscribeEvents();
					this.mentionManager = null;
				}

				this.view.setKeyboardOverContent(false);
			}
		}

		sendAnalyticsOpenDialog()
		{
			super.sendAnalyticsOpenDialog();
			if (this.openingContext === OpenDialogContextType.chatCreation)
			{
				return;
			}

			AnalyticsService.getInstance().sendOpenCopilotDialog({
				dialogId: this.dialogId,
				context: this.openingContext,
				modesState: this.locator.get('assistant-button-manager')?.getSettingsSnapshot() ?? null,
			});
		}
	}

	module.exports = { CopilotDialog };
});
