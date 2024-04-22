/**
 * @module im/messenger/controller/dialog/copilot/dialog
 */
jn.define('im/messenger/controller/dialog/copilot/dialog', (require, exports, module) => {
	const { Uuid } = require('utils/uuid');

	const {
		CopilotButtonType,
		EventType,
	} = require('im/messenger/const');
	const { MessageService } = require('im/messenger/provider/service');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { MessengerParams } = require('im/messenger/lib/params');

	const { Dialog } = require('im/messenger/controller/dialog/chat');
	const { DialogTextHelper } = require('im/messenger/controller/dialog/lib/helper/text');

	const { CopilotMessageMenu } = require('im/messenger/controller/dialog/copilot/component/message-menu');
	const { CopilotMentionManager } = require('im/messenger/controller/dialog/copilot/component/mention/manager');

	const logger = LoggerManager.getInstance().getLogger('dialog--dialog');

	/**
	 * @class CopilotDialog
	 */
	class CopilotDialog extends Dialog
	{
		constructor()
		{
			super();

			this.messageButtonTapHandler = this.onMessageButtonTap.bind(this);
		}

		getDialogType()
		{
			return 'copilot';
		}

		checkCanHaveAttachments()
		{
			return false;
		}

		initComponents()
		{
			super.initComponents();

			this.messageMenuComponent = new CopilotMessageMenu({
				serviceLocator: this.locator,
				dialogId: this.getDialogId(),
			});
		}

		subscribeViewEvents()
		{
			super.subscribeViewEvents();

			this.view
				.on(EventType.dialog.messageButtonTap, this.messageButtonTapHandler)
			;
		}

		initManagers()
		{
			super.initManagers();

			this.mentionManager = new CopilotMentionManager(this.view);
		}

		async open(options)
		{
			const {
				dialogId,
				dialogTitleParams,
			} = options;

			this.dialogId = dialogId;

			void this.store.dispatch('applicationModel/openDialogId', dialogId);

			const hasDialog = await this.loadDialogFromDb();
			if (hasDialog)
			{
				this.messageService = new MessageService({
					store: this.store,
					chatId: this.getChatId(),
				});
			}

			this.firstDbPagePromise = this.loadHistoryMessagesFromDb();

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

			this.createWidget(titleParams);
		}

		/**
		 *
		 * @param index
		 * @param {Message} message
		 */
		onMessageAvatarLongTap(index, message)
		{
			const messageModel = this.store.getters['messagesModel/getById'](message.id);
			const dialogModel = this.store.getters['usersModel/getById'](messageModel.authorId);

			if (dialogModel.botData?.code === 'copilot')
			{
				return;
			}

			super.onMessageAvatarLongTap(index, message);
		}

		/**
		 *
		 * @param messageId
		 * @param {CopilotButton} button
		 */
		onMessageButtonTap(messageId, button)
		{
			logger.log('Dialog.onMessageButtonTap', messageId, button);

			if (button.id === CopilotButtonType.copy)
			{
				const modelMessage = this.store.getters['messagesModel/getById'](messageId);
				DialogTextHelper.copyToClipboard(modelMessage);

				return;
			}

			if (button.id === CopilotButtonType.promtEdit)
			{
				const currentText = this.view.textField.getText();
				const text = (currentText.endsWith(' ') ? button.text : ` ${button.text}`)
					.replace('...', ' ')
				;
				this.view.textField.replaceText(currentText.length, currentText.length, text);
				this.view.textField.showKeyboard?.();

				return;
			}

			if (button.id === CopilotButtonType.promtSend)
			{
				const uuid = Uuid.getV4();

				const message = {
					chatId: this.getChatId(),
					authorId: MessengerParams.getUserId(),
					text: button.text.trim(),
					unread: false,
					templateId: uuid,
					date: new Date(),
					sending: true,
				};

				const messageSendOption = {
					dialogId: this.getDialogId(),
					text: button.text,
					messageType: 'self',
					templateId: uuid,
				};

				this.store.dispatch('messagesModel/add', message)
					.then(() => {
						/** @type {ScrollToBottomEvent} */
						const scrollToBottomEventData = {
							dialogId: this.getDialogId(),
							withAnimation: true,
							force: true,
						};

						BX.postComponentEvent(EventType.dialog.external.scrollToBottom, [scrollToBottomEventData]);

						// eslint-disable-next-line no-underscore-dangle
						return this._sendMessage(messageSendOption);
					})
					.catch((ex) => logger.error('Dialog.sendMessage.error', ex));
			}
		}

		/**
		 * @desc Create new status field by current dialog data and draw it in view
		 * @param {boolean} [isCheckBottom=true]
		 * @override
		 */
		drawStatusField(isCheckBottom = true)
		{
			// TODO if need show the status field then remove this override
		}
	}

	module.exports = { CopilotDialog };
});
