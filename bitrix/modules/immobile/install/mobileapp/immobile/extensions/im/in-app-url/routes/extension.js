/**
 * @module im/in-app-url/routes
 */
jn.define('im/in-app-url/routes', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');

	const {
		EventType,
		ComponentCode,
		FileType,
	} = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');

	const checkIsMessengerFamilyComponent = () => {
		const componentCode = BX.componentParameters.get('COMPONENT_CODE', '');
		const messengerComponentCodes = [
			ComponentCode.imMessenger,
			ComponentCode.imCopilotMessenger,
			ComponentCode.imChannelMessenger,
		];

		return messengerComponentCodes.includes(componentCode);
	};

	/**
	 * @param componentCode
	 * @param {string} dialogId
	 * @param {string|null} messageId
	 */
	const openDialog = (componentCode, dialogId, messageId = null) => {
		const openDialogEvent = {
			dialogId,
		};

		if (Type.isStringFilled(messageId) && Type.isNumber(parseInt(messageId, 10)))
		{
			openDialogEvent.messageId = parseInt(messageId, 10);
			openDialogEvent.withMessageHighlight = true;
		}

		MessengerEmitter.emit(EventType.messenger.openDialog, openDialogEvent, componentCode);
	};

	const openMessageAttach = (messageId) => {
		const realUrl = `${currentDomain}/mobile/im/attach.php?messageId=${messageId}`;

		PageManager.openPage({
			url: realUrl,
			titleParams: {
				text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_ATTACH_TITLE'),
			},
			backdrop: {
				horizontalSwipeAllowed: false,
			},
		});
	};

	const openMessageGallery = async (messageId) => {
		if (!checkIsMessengerFamilyComponent())
		{
			return;
		}

		const { serviceLocator } = await requireLazy('im:messenger/lib/di/service-locator');
		/**
		 * @type MessengerCoreStore
		 */
		const store = serviceLocator.get('core').getStore();
		const fileList = store.getters['filesModel/getListByMessageId'](messageId);
		if (!Type.isArrayFilled(fileList))
		{
			return;
		}

		const isImageGallery = fileList.every((file) => file.type === FileType.image);
		if (isImageGallery)
		{
			const imageList = fileList.map((file, index) => {
				return {
					url: file.urlShow,
					previewUrl: file.urlPreview,
					name: file.name,
					default: index === 1,
				};
			});

			viewer.openImageCollection(imageList);
		}
	};

	const openFile = async (fileId) => {
		if (!checkIsMessengerFamilyComponent())
		{
			return;
		}

		const { serviceLocator } = await requireLazy('im:messenger/lib/di/service-locator');
		/**
		 * @type MessengerCoreStore
		 */
		const store = serviceLocator.get('core').getStore();
		const file = store.getters['filesModel/getById'](fileId);
		if (file)
		{
			viewer.openDocument(file.urlDownload, file.name);
		}
	};

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl.register(
			'/online/\\?IM_DIALOG=:dialogId$',
			({ dialogId }) => openDialog(ComponentCode.imMessenger, dialogId),
		).name('im:dialog:openDialog');

		inAppUrl.register(
			'/online/\\?IM_DIALOG=:dialogId&IM_MESSAGE=:messageId$',
			({ dialogId, messageId }) => openDialog(ComponentCode.imMessenger, dialogId, messageId),
		).name('im:dialog:goToMessageContext');

		inAppUrl.register(
			'/online/\\?IM_COPILOT=:dialogId$',
			({ dialogId }) => openDialog(ComponentCode.imCopilotMessenger, dialogId),
		).name('im:copilot:openDialog');

		inAppUrl.register(
			'/online/\\?IM_COPILOT=:dialogId&IM_MESSAGE=:messageId$',
			({ dialogId, messageId }) => openDialog(ComponentCode.imCopilotMessenger, dialogId, messageId),
		).name('im:copilot:goToMessageContext');

		inAppUrl.register(
			'/immobile/in-app/message-attach/:messageId',
			({ messageId }) => openMessageAttach(messageId),
		).name('im:message:attach:open');

		inAppUrl.register(
			'/immobile/in-app/message-gallery/:messageId',
			({ messageId }) => openMessageGallery(messageId),
		).name('im:message:gallery:open');

		inAppUrl.register(
			'/immobile/in-app/file-open/:fileId',
			({ fileId }) => openFile(fileId),
		).name('im:message:gallery:open');
	};
});
