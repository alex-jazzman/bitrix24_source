/**
 * @module im/messenger/lib/promotion/src/promotion
 */
jn.define('im/messenger/lib/promotion/src/promotion', (require, exports, module) => {
	const { Type } = require('type');

	const { BackgroundUI } = require('im/messenger/const');
	const { PromotionRest } = require('im/messenger/provider/rest');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { VideoNotePromotion } = require('im/messenger/lib/promotion/src/entities/video-note');
	const { CopilotPromotion } = require('im/messenger/lib/promotion/src/entities/copilot');
	const { TasksPromotion } = require('im/messenger/lib/promotion/src/entities/tasks');
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
			this.pendingPromoQueue = [];
			this.isPromoCollectionLoaded = false;
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
				BackgroundUI.manager.openComponentInAnotherContext,
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
				BackgroundUI.manager.openComponentInAnotherContext,
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

		/**
		 * @param {immobileTabsLoadCommonResult} data
		 */
		#handlePromotionGet(data)
		{
			if (Type.isArray(data?.promotion))
			{
				this.promoCollection = data.promotion;
				this.isPromoCollectionLoaded = true;

				if (this.pendingPromoQueue.length > 0)
				{
					this.pendingPromoQueue.forEach((params) => {
						this.addToPromoQueue(params);
					});
					this.pendingPromoQueue = [];
				}
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
			if (!this.isPromoCollectionLoaded)
			{
				this.pendingPromoQueue.push({ promoId, callback });

				return;
			}

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
			BX.postComponentEvent(BackgroundUI.manager.onCloseActiveComponent, []);

			if (this.promoQueue.length > 0)
			{
				BX.postComponentEvent(
					BackgroundUI.events.tryToOpenComponentFromAnotherContext,
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

		showTasksRecentPromotion = () => {
			TasksPromotion.showRecentAvailable(this.onShowPromoCallback);
		};
	}

	module.exports = {
		Promotion,
	};
});
