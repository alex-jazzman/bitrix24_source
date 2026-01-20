/**
 * @module im/messenger/lib/promotion
 */
jn.define('im/messenger/lib/promotion', (require, exports, module) => {
	const { Type } = require('type');

	const { PromotionRest } = require('im/messenger/provider/rest');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { VideoNotePromotion } = require('im/messenger/lib/promotion/video-note');
	const { CopilotPromotion } = require('im/messenger/lib/promotion/copilot');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('promotion', 'Promotion');

	const COMPONENT_NAME = 'im.messenger.Promotion';

	/** @type {Promotion || null} */
	let instance = null;

	/**
	 * @class Promotion
	 */
	class Promotion
	{
		/**
		 * @return {Promotion}
		 */
		static getInstance()
		{
			instance ??= new this();

			return instance;
		}

		constructor()
		{
			this.#bindMethods();

			this.promoCollection = [];
			this.promoQueue = [];
			this.messengerInitService = serviceLocator.get('messenger-init-service');
			this.subscribeEvents();
		}

		#bindMethods()
		{
			this.handlePromotionGet = this.#handlePromotionGet.bind(this);
			this.onReadPromo = this.#onReadPromo.bind(this);
			this.openPromotionFromBackgroundUIManagerEvent = this.#openPromotionFromBackgroundUIManagerEvent.bind(this);
			this.onShowPromoCallback = this.#onShowPromoCallback.bind(this);
		}

		subscribeEvents()
		{
			this.#subscribeInitMessengerEvent();
			this.#subscribeToBackgroundUIManagerEvent();
		}

		#subscribeToBackgroundUIManagerEvent()
		{
			BX.addCustomEvent(
				'BackgroundUIManager::openComponentInAnotherContext',
				this.openPromotionFromBackgroundUIManagerEvent,
			);
		}

		/**
		 * @param {string} componentName
		 */
		#openPromotionFromBackgroundUIManagerEvent(componentName)
		{
			logger.log('openPromotionFromBackgroundUIManagerEvent', componentName);

			if (componentName !== COMPONENT_NAME || this.promoQueue.length === 0)
			{
				return;
			}

			const nextPromo = this.promoQueue.shift();
			nextPromo.callback();
		}

		#unsubscribeBackgroundUIManagerEvent()
		{
			BX.removeCustomEvent(
				'BackgroundUIManager::openComponentInAnotherContext',
				this.openPromotionFromBackgroundUIManagerEvent,
			);
		}

		#subscribeInitMessengerEvent()
		{
			this.messengerInitService.onInit(this.handlePromotionGet);
		}

		destruct()
		{
			this.#unsubscribeBackgroundUIManagerEvent();
		}

		#handlePromotionGet(data)
		{
			if (data?.promotion)
			{
				this.promoCollection = data.promotion;
			}
		}

		/**
		 * @param {string} promoId
		 * @return {boolean}
		 */
		shouldShowPromo(promoId)
		{
			return this.promoCollection.includes(promoId);
		}

		/**
		 * @param {string} promoId
		 * @param {() => any} callback
		 */
		addToPromoQueue({ promoId, callback = () => {} })
		{
			if (!this.promoCollection.includes(promoId))
			{
				return;
			}

			this.promoQueue.push({ promoId, callback });
			if (this.promoQueue.length === 1)
			{
				this.#queueTickUp();
			}
		}

		#queueTickUp()
		{
			logger.log('queueTickUp queue:', this.promoQueue);
			BX.postComponentEvent('BackgroundUIManager::onCloseActiveComponent', []);

			if (this.promoQueue.length > 0)
			{
				BX.postComponentEvent(
					'BackgroundUIManagerEvents::tryToOpenComponentFromAnotherContext',
					[
						{
							componentName: COMPONENT_NAME,
							priority: 1000,
						},
					],
				);
			}
		}

		/**
		 * @param {string} promoId
		 */
		#onReadPromo(promoId)
		{
			logger.log('onReadPromo', promoId);

			if (Type.isStringFilled(promoId))
			{
				this.promoCollection = this.promoCollection.filter((activePromoListId) => activePromoListId !== promoId);
				PromotionRest.read(promoId);
			}
		}

		/**
		 * @param {PromotionCallbackData} callbackData
		 */
		#onShowPromoCallback(callbackData)
		{
			if (callbackData?.read && callbackData?.promoId)
			{
				this.onReadPromo(callbackData.promoId);
			}

			this.#queueTickUp();
		}

		/**
		 * @param {number} chatId
		 */
		showVideoNotePromotion = (chatId) => {
			VideoNotePromotion.show(chatId, this.onShowPromoCallback);
		};

		/**
		 * @param {LayoutComponent} targetRef
		 */
		showCopilotSidebarChangeEnginePromotion = (targetRef) => {
			CopilotPromotion.showCopilotSidebarChangeEngine(targetRef, this.onShowPromoCallback);
		};
	}

	module.exports = {
		Promotion,
	};
});
