/**
 * @module im/messenger/lib/promotion/src/entities/video-note
 */
jn.define('im/messenger/lib/promotion/src/entities/video-note', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { PromotionAsset } = require('im/messenger/assets/promotion');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { FileType, Promo } = require('im/messenger/const');

	/**
	 * @class VideoNotePromotion
	 */
	class VideoNotePromotion
	{
		/**
		 * @param {number} chatId
		 * @param {() => any} actionCallback
		 */
		static show(chatId, actionCallback = () => {})
		{
			if (!this.#canShow(chatId))
			{
				actionCallback();

				return;
			}

			AhaMoment.show({
				testId: 'video-note-aha',
				targetRef: 'sendButtonRef',
				title: Loc.getMessage('IMMOBILE_MESSENGER_PROMO_VIDEO_NOTE_TITLE'),
				description: Loc.getMessage('IMMOBILE_MESSENGER_PROMO_VIDEO_NOTE_DESCRIPTION'),
				disableHideByOutsideClick: false,
				targetParams: {
					useHighlight: true,
					type: 'circle',
				},
				fadeInDuration: 0,
				delay: 300,
				shouldShowImageBackgroundColor: false,
				image: Image(
					{
						uri: PromotionAsset.videoNoteUrl,
						style: {
							width: 78,
							height: 60,
						},
						resizeMode: 'contain',
						onFailure: console.error,
						onSvgContentError: console.error,
					},
				),
				onHide: () => {
					actionCallback({ read: true, promoId: Promo.videoNote });
				},
			});
		}

		/**
		 * @param {number} chatId
		 */
		static #canShow(chatId)
		{
			const store = serviceLocator.get('core').getStore();

			const messageList = store.getters['messagesModel/getByChatId'](chatId);
			const currentUser = serviceLocator.get('core').getUserId();

			return messageList.some((message) => {
				if (message.authorId === currentUser)
				{
					const files = store.getters['filesModel/getListByMessageId'](message.id);

					return files.some((file) => file.type === FileType.audio);
				}

				return false;
			});
		}
	}

	module.exports = {
		VideoNotePromotion,
	};
});
